// ========================================
// Task routes - /api/tasks
// ========================================

import { uid } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';
import {
  buildTaskCompletionSnapshot,
  normalizeWeeklyRule,
  WEEKLY_RULE_SUNDAY,
} from '../utils/task-periods.js';

const VALID_TASK_TYPES = new Set(['daily', 'weekly', 'once', 'semester']);
const UPDATEABLE_FIELDS = [
  'title',
  'description',
  'type',
  'points',
  'target_child_id',
  'penalty_enabled',
  'penalty_points',
  'weekly_rule',
];

export async function handleTasks(request, env, user, path) {
  const method = request.method;

  if (method === 'GET' && path === '/api/tasks') {
    const tasks = await loadActiveTasks(env, user.familyCode);
    const now = Date.now();

    if (user.role === 'parent') {
      const [children, submissions] = await Promise.all([
        loadFamilyChildren(env, user.familyCode),
        loadSubmissionsForTasks(env, tasks.map((task) => task.id)),
      ]);

      return jsonResponse(buildParentTaskStatusView({
        tasks,
        children,
        submissions,
        now,
      }), env);
    }

    const [children, submissions] = await Promise.all([
      loadFamilyChildren(env, user.familyCode),
      loadSubmissionsForTasks(env, tasks.map((task) => task.id), [user.id]),
    ]);

    return jsonResponse(buildChildTaskStatusView({
      tasks,
      children,
      childId: user.id,
      submissions,
      now,
    }), env);
  }

  if (method === 'POST' && path === '/api/tasks') {
    if (user.role !== 'parent') return errorResponse('权限不足', 403, env);

    let payload;
    try {
      const body = await request.json();
      const children = await loadFamilyChildren(env, user.familyCode);
      payload = validateTaskPayload(body, {
        children,
        requireAll: true,
      });
    } catch (error) {
      return errorResponse(error.message || '任务信息不合法', 400, env);
    }

    const now = Date.now();
    const id = uid();

    await env.DB.prepare(
      `INSERT INTO tasks (
        id, title, description, type, weekly_rule, points, creator_id,
        family_code, target_child_id, penalty_enabled, penalty_points, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      payload.title,
      payload.description,
      payload.type,
      payload.weekly_rule,
      payload.points,
      user.id,
      user.familyCode,
      payload.target_child_id,
      payload.penalty_enabled,
      payload.penalty_points,
      'active',
      now,
    ).run();

    return jsonResponse({
      id,
      ...payload,
      status: 'active',
      created_at: now,
    }, env, 201);
  }

  if (method === 'PATCH') {
    if (user.role !== 'parent') return errorResponse('权限不足', 403, env);

    const taskId = path.split('/').pop();
    const existing = await env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ? AND family_code = ?'
    ).bind(taskId, user.familyCode).first();

    if (!existing) return errorResponse('任务不存在', 404, env);

    let payload;
    try {
      const body = await request.json();
      const children = await loadFamilyChildren(env, user.familyCode);
      payload = validateTaskPayload(body, {
        children,
        existingTask: existing,
        requireAll: false,
      });
    } catch (error) {
      return errorResponse(error.message || '任务信息不合法', 400, env);
    }

    const fields = [];
    const values = [];
    for (const field of UPDATEABLE_FIELDS) {
      if (!(field in payload)) continue;
      fields.push(`${field} = ?`);
      values.push(payload[field]);
    }

    if (!fields.length) return errorResponse('没有可更新的内容', 400, env);

    values.push(taskId, user.familyCode);
    await env.DB.prepare(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND family_code = ?`
    ).bind(...values).run();

    return jsonResponse({ success: true }, env);
  }

  if (method === 'DELETE') {
    if (user.role !== 'parent') return errorResponse('权限不足', 403, env);

    const taskId = path.split('/').pop();
    const result = await env.DB.prepare(
      'UPDATE tasks SET status = ? WHERE id = ? AND family_code = ? AND status = ?'
    ).bind('deleted', taskId, user.familyCode, 'active').run();

    if (!result.success || !result.meta?.changes) {
      return errorResponse('任务不存在', 404, env);
    }

    return jsonResponse({ success: true }, env);
  }

  return errorResponse('Not Found', 404, env);
}

export function buildParentTaskStatusView({
  tasks = [],
  children = [],
  submissions = [],
  now = Date.now(),
}) {
  const childList = children.filter((child) => !child.role || child.role === 'child');
  const submissionsByTaskChild = groupSubmissionsByTaskAndChild(submissions);

  return tasks.map((task) => {
    const targetChildren = resolveTargetChildren(task, childList);
    const childStatuses = targetChildren.map((child) => {
      const childSubmissions = submissionsByTaskChild.get(task.id)?.get(child.id) || [];
      const snapshot = buildTaskCompletionSnapshot(task, childSubmissions, now);

      return {
        child_id: child.id,
        child_name: child.username,
        child_avatar: child.avatar,
        completion_status: snapshot.status,
        completion_summary: snapshot,
        current_submission: snapshot.currentSubmission,
        latest_submission: snapshot.latestSubmission,
      };
    });

    const overview = summarizeChildStatuses(childStatuses);

    return {
      ...task,
      weekly_rule: normalizeWeeklyRule(task.weekly_rule),
      target_children_statuses: childStatuses,
      completion_overview: overview,
    };
  });
}

function buildChildTaskStatusView({
  tasks = [],
  children = [],
  childId,
  submissions = [],
  now = Date.now(),
}) {
  const child = children.find((item) => item.id === childId) || null;
  const submissionsByTaskChild = groupSubmissionsByTaskAndChild(submissions);

  return tasks
    .filter((task) => !task.target_child_id || task.target_child_id === childId)
    .map((task) => {
      const childSubmissions = submissionsByTaskChild.get(task.id)?.get(childId) || [];
      const snapshot = buildTaskCompletionSnapshot(task, childSubmissions, now);

      return {
        ...task,
        weekly_rule: normalizeWeeklyRule(task.weekly_rule),
        target_child_name: child?.username || null,
        currentSubmission: snapshot.currentSubmission,
        todaySubmission: snapshot.currentSubmission,
        latestSubmission: snapshot.latestSubmission,
        completion_status: snapshot.status,
        completion_summary: snapshot,
      };
    });
}

function summarizeChildStatuses(childStatuses) {
  const summary = {
    totalChildren: childStatuses.length,
    completedChildren: 0,
    partialChildren: 0,
    overdueChildren: 0,
    pendingChildren: 0,
    todoChildren: 0,
  };

  for (const childStatus of childStatuses) {
    switch (childStatus.completion_status) {
      case 'completed':
        summary.completedChildren += 1;
        break;
      case 'partial':
        summary.partialChildren += 1;
        break;
      case 'overdue':
        summary.overdueChildren += 1;
        break;
      case 'pending':
        summary.pendingChildren += 1;
        break;
      default:
        summary.todoChildren += 1;
        break;
    }
  }

  return summary;
}

function groupSubmissionsByTaskAndChild(submissions) {
  const map = new Map();

  for (const submission of submissions) {
    if (!map.has(submission.task_id)) {
      map.set(submission.task_id, new Map());
    }

    const childMap = map.get(submission.task_id);
    if (!childMap.has(submission.child_id)) {
      childMap.set(submission.child_id, []);
    }

    childMap.get(submission.child_id).push(submission);
  }

  return map;
}

function resolveTargetChildren(task, children) {
  if (task.target_child_id) {
    return children.filter((child) => child.id === task.target_child_id);
  }

  return children;
}

async function loadActiveTasks(env, familyCode) {
  const { results } = await env.DB.prepare(
    `SELECT id, title, description, type, weekly_rule, points, creator_id, family_code,
            target_child_id, penalty_enabled, penalty_points, status, created_at
     FROM tasks
     WHERE family_code = ? AND status = ?
     ORDER BY created_at DESC`
  ).bind(familyCode, 'active').all();

  return results.map(normalizeTaskRow);
}

async function loadFamilyChildren(env, familyCode) {
  const { results } = await env.DB.prepare(
    `SELECT id, username, avatar, role, created_at
     FROM users
     WHERE family_code = ? AND role = 'child'
     ORDER BY created_at ASC, username ASC`
  ).bind(familyCode).all();

  return results;
}

async function loadSubmissionsForTasks(env, taskIds, childIds = []) {
  if (!taskIds.length) return [];

  const taskPlaceholders = taskIds.map(() => '?').join(', ');
  let sql = `SELECT id, task_id, child_id, status, photo_key, submission_text, points, reject_reason, created_at, reviewed_at
             FROM submissions
             WHERE task_id IN (${taskPlaceholders})`;
  const params = [...taskIds];

  if (childIds.length) {
    const childPlaceholders = childIds.map(() => '?').join(', ');
    sql += ` AND child_id IN (${childPlaceholders})`;
    params.push(...childIds);
  }

  sql += ' ORDER BY created_at DESC';

  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return results;
}

function validateTaskPayload(payload, {
  children = [],
  existingTask = null,
  requireAll = false,
}) {
  const childIds = new Set(children.map((child) => child.id));
  const nextType = payload.type ?? existingTask?.type ?? 'daily';
  const normalized = {};

  if (requireAll || 'title' in payload) {
    const title = String(payload.title || '').trim();
    if (!title) {
      throw new Error('任务名称不能为空');
    }
    if (title.length > 60) {
      throw new Error('任务名称不能超过 60 个字');
    }
    normalized.title = title;
  }

  if (requireAll || 'description' in payload) {
    const description = String(payload.description || '').trim();
    if (description.length > 200) {
      throw new Error('任务描述不能超过 200 个字');
    }
    normalized.description = description;
  }

  if (requireAll || 'type' in payload) {
    if (!VALID_TASK_TYPES.has(nextType)) {
      throw new Error('任务类型不支持');
    }
    normalized.type = nextType;
  }

  if (requireAll || 'points' in payload) {
    const points = Number(payload.points);
    if (!Number.isInteger(points) || points < 1 || points > 9999) {
      throw new Error('积分奖励必须是 1-9999 的整数');
    }
    normalized.points = points;
  }

  if (requireAll || 'target_child_id' in payload) {
    const targetChildId = payload.target_child_id ? String(payload.target_child_id) : null;
    if (targetChildId && !childIds.has(targetChildId)) {
      throw new Error('指定的孩子不存在');
    }
    normalized.target_child_id = targetChildId;
  }

  if (requireAll || 'weekly_rule' in payload || 'type' in payload) {
    const requestedRule = payload.weekly_rule ?? existingTask?.weekly_rule ?? WEEKLY_RULE_SUNDAY;
    normalized.weekly_rule = nextType === 'weekly'
      ? normalizeWeeklyRule(requestedRule)
      : WEEKLY_RULE_SUNDAY;
  }

  const penaltyEnabled = 'penalty_enabled' in payload
    ? normalizeBoolean(payload.penalty_enabled)
    : existingTask?.penalty_enabled;
  const penaltyPoints = 'penalty_points' in payload
    ? Number(payload.penalty_points)
    : existingTask?.penalty_points;

  if (requireAll || 'penalty_enabled' in payload || 'penalty_points' in payload) {
    if (penaltyEnabled && (!Number.isInteger(penaltyPoints) || penaltyPoints < 1 || penaltyPoints > 9999)) {
      throw new Error('惩罚扣分必须是 1-9999 的整数');
    }

    normalized.penalty_enabled = penaltyEnabled ? 1 : 0;
    normalized.penalty_points = penaltyEnabled ? penaltyPoints : 0;
  }

  return normalized;
}

function normalizeBoolean(value) {
  if (value === true || value === 1 || value === '1') return true;
  return false;
}

function normalizeTaskRow(task) {
  return {
    ...task,
    weekly_rule: normalizeWeeklyRule(task.weekly_rule),
    penalty_enabled: task.penalty_enabled === 1 || task.penalty_enabled === true ? 1 : 0,
    penalty_points: Number(task.penalty_points) || 0,
    points: Number(task.points) || 0,
  };
}
