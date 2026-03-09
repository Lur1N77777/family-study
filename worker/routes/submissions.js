// ========================================
// Submission routes - /api/submissions
// ========================================

import { uid } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { getSubmissionWindowForNow, normalizeWeeklyRule } from '../utils/task-periods.js';
import {
  getPhotoAvailableUntil,
  hydrateSubmissionPhotoState,
  parsePhotoKeys,
} from '../utils/photo-retention.js';

export async function handleSubmissions(request, env, user, path) {
  const method = request.method;

  if (method === 'GET' && path === '/api/submissions') {
    return listSubmissions(request, env, user);
  }

  if (method === 'POST' && path === '/api/submissions') {
    return createSubmission(request, env, user);
  }

  if (method === 'PATCH' && path.startsWith('/api/submissions/')) {
    return reviewSubmission(request, env, user, path);
  }

  return errorResponse('Not Found', 404, env);
}

async function listSubmissions(request, env, user) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const childId = url.searchParams.get('childId');

  let sql = `
    SELECT s.*, u.username AS child_name, u.avatar AS child_avatar, t.title AS task_title, t.points AS task_points
    FROM submissions s
    JOIN users u ON s.child_id = u.id
    LEFT JOIN tasks t ON s.task_id = t.id
    WHERE u.family_code = ?
  `;
  const params = [user.familyCode];

  if (status) {
    sql += ' AND s.status = ?';
    params.push(status);
  }

  if (childId) {
    sql += ' AND s.child_id = ?';
    params.push(childId);
  }

  sql += ' ORDER BY s.created_at DESC LIMIT 50';

  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return jsonResponse((results || []).map((submission) => hydrateSubmissionPhotoState(submission)), env);
}

async function createSubmission(request, env, user) {
  if (user.role !== 'child') {
    return errorResponse('只有学生可以提交任务', 403, env);
  }

  const body = await request.json();
  const taskId = body.taskId;
  let photoKeyValue = null;

  if (Array.isArray(body.photoKeys) && body.photoKeys.length > 0) {
    photoKeyValue = JSON.stringify(body.photoKeys);
  } else if (body.photoKey) {
    photoKeyValue = body.photoKey;
  }

  if (!taskId) {
    return errorResponse('缺少任务 ID', 400, env);
  }

  const task = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first();
  if (!task) {
    return errorResponse('任务不存在', 404, env);
  }

  if (task.family_code !== user.familyCode) {
    return errorResponse('无权提交这个任务', 403, env);
  }

  if (task.target_child_id && task.target_child_id !== user.id) {
    return errorResponse('无权提交这个任务', 403, env);
  }

  const now = Date.now();
  const submissionWindow = getSubmissionWindowForNow(task, now);
  if (!submissionWindow) {
    return errorResponse(getSubmissionBlockedMessage(task), 400, env);
  }

  const existingSubmission = await findLatestSubmissionInWindow(env.DB, taskId, user.id, submissionWindow);
  if (existingSubmission) {
    if (existingSubmission.status === 'pending') {
      return errorResponse('本周期已经提交过了，请等待家长审核', 400, env);
    }

    if (existingSubmission.status === 'approved') {
      return errorResponse('本周期已经完成这个任务了', 400, env);
    }
  }

  const id = uid();
  await env.DB.prepare(
    `INSERT INTO submissions (id, task_id, child_id, status, photo_key, points, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, taskId, user.id, 'pending', photoKeyValue, 0, now).run();

  return jsonResponse({ id, status: 'pending' }, env, 201);
}

async function reviewSubmission(request, env, user, path) {
  if (user.role !== 'parent') {
    return errorResponse('权限不足', 403, env);
  }

  const subId = path.split('/').pop();
  const { action, reason } = await request.json();
  const submission = await env.DB.prepare('SELECT * FROM submissions WHERE id = ?').bind(subId).first();
  if (!submission) {
    return errorResponse('提交记录不存在', 404, env);
  }

  const child = await env.DB.prepare('SELECT id, username, family_code FROM users WHERE id = ?')
    .bind(submission.child_id)
    .first();
  if (!child || child.family_code !== user.familyCode) {
    return errorResponse('无权操作这条提交记录', 403, env);
  }

  if (submission.status !== 'pending') {
    return errorResponse('这条提交已经审核过了', 400, env);
  }

  if (action === 'approve') {
    return approveSubmission(env, user, submission, subId, child);
  }

  if (action === 'reject') {
    return rejectSubmission(env, user, submission, subId, child, reason);
  }

  return errorResponse('无效的审核操作', 400, env);
}

async function approveSubmission(env, user, submission, subId, child) {
  const task = await env.DB.prepare('SELECT points, title FROM tasks WHERE id = ?').bind(submission.task_id).first();
  const points = task?.points || 0;
  const reviewedAt = Date.now();
  const photoAvailableUntil = getSubmissionPhotoAvailableUntil(submission, reviewedAt);

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE submissions
          SET status = ?,
              points = ?,
              reviewed_at = ?,
              photo_available_until = ?,
              photo_cleared_at = NULL,
              reject_reason = ?
        WHERE id = ?`
    ).bind('approved', points, reviewedAt, photoAvailableUntil, `approved_by:${user.username}`, subId),
    env.DB.prepare('UPDATE users SET points = points + ? WHERE id = ?')
      .bind(points, submission.child_id),
    env.DB.prepare('INSERT INTO activity_log (id, type, message, family_code, timestamp) VALUES (?, ?, ?, ?, ?)')
      .bind(
        uid(),
        'task_approved',
        `${user.username}通过了 ${child?.username || '学生'} 的《${task?.title || '任务'}》，发放 ${points} 积分`,
        child?.family_code || user.familyCode,
        reviewedAt,
      ),
  ]);

  return jsonResponse({
    success: true,
    photoAvailableUntil,
  }, env);
}

async function rejectSubmission(env, user, submission, subId, child, reason) {
  const task = await env.DB.prepare('SELECT title FROM tasks WHERE id = ?').bind(submission.task_id).first();
  const reviewedAt = Date.now();
  const rejectReason = (reason || '').trim();
  const rejectNote = `rejected_by:${user.username}|${rejectReason || '未说明原因'}`;
  const photoAvailableUntil = getSubmissionPhotoAvailableUntil(submission, reviewedAt);

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE submissions
          SET status = ?,
              reject_reason = ?,
              reviewed_at = ?,
              photo_available_until = ?,
              photo_cleared_at = NULL
        WHERE id = ?`
    ).bind('rejected', rejectNote, reviewedAt, photoAvailableUntil, subId),
    env.DB.prepare('INSERT INTO activity_log (id, type, message, family_code, timestamp) VALUES (?, ?, ?, ?, ?)')
      .bind(
        uid(),
        'task_rejected',
        `${user.username}驳回了 ${child?.username || '学生'} 的《${task?.title || '任务'}》`,
        child?.family_code || user.familyCode,
        reviewedAt,
      ),
  ]);

  return jsonResponse({
    success: true,
    photoAvailableUntil,
  }, env);
}

function getSubmissionPhotoAvailableUntil(submission, reviewedAt) {
  return parsePhotoKeys(submission.photo_key).length ? getPhotoAvailableUntil(reviewedAt) : null;
}

async function findLatestSubmissionInWindow(db, taskId, childId, window) {
  let query = 'SELECT id, status FROM submissions WHERE task_id = ? AND child_id = ?';
  const params = [taskId, childId];

  if (window.endAt == null) {
    query += ' AND created_at >= ?';
    params.push(window.startAt);
  } else {
    query += ' AND created_at >= ? AND created_at < ?';
    params.push(window.startAt, window.endAt);
  }

  query += ' ORDER BY created_at DESC LIMIT 1';
  return db.prepare(query).bind(...params).first();
}

function getSubmissionBlockedMessage(task) {
  if (task.type === 'weekly') {
    const weeklyRule = normalizeWeeklyRule(task.weekly_rule);
    if (weeklyRule === 'saturday') {
      return '本周任务需要在周六结束前提交';
    }

    if (weeklyRule === 'weekend_twice') {
      return '这个任务需要在周六和周日各完成一次';
    }

    return '本周任务还不能提交';
  }

  if (task.type === 'once') {
    return '这个单次任务已经过期了';
  }

  return '当前时间不能提交这个任务';
}
