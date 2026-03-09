import { uid } from './jwt.js';
import { buildPenaltyActions } from './task-penalty-engine.js';

export async function applyOverduePenalties(env, now = Date.now()) {
  const { results: tasks } = await env.DB.prepare(
    `SELECT id, title, type, weekly_rule, family_code, target_child_id, penalty_enabled, penalty_points, created_at
     FROM tasks
     WHERE status = ? AND penalty_enabled = 1 AND penalty_points > 0`
  ).bind('active').all();

  if (!tasks.length) {
    return { checkedTasks: 0, penaltiesApplied: 0, affectedChildren: 0 };
  }

  const familyCodes = [...new Set(tasks.map(task => task.family_code))];
  const taskIds = tasks.map(task => task.id);

  const [children, approvedSubmissions, appliedPenaltyKeys] = await Promise.all([
    loadChildren(env, familyCodes),
    loadApprovedSubmissions(env, taskIds),
    loadAppliedPenaltyKeys(env, taskIds),
  ]);

  const actions = buildPenaltyActions({
    tasks,
    children,
    approvedSubmissions,
    appliedPenaltyKeys,
    now,
  });

  for (const action of actions) {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO task_penalties
         (id, task_id, child_id, family_code, period_key, period_start, period_end, points, applied_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        uid(),
        action.taskId,
        action.childId,
        action.familyCode,
        action.periodKey,
        action.periodStart,
        action.periodEnd,
        action.points,
        now,
      ),
      env.DB.prepare(
        'UPDATE users SET points = points - ? WHERE id = ?'
      ).bind(action.points, action.childId),
      env.DB.prepare(
        'INSERT INTO activity_log (id, type, message, family_code, timestamp) VALUES (?, ?, ?, ?, ?)'
      ).bind(
        uid(),
        'task_penalty',
        `${action.childName}未完成「${action.taskTitle}」，扣除${action.points}积分`,
        action.familyCode,
        now,
      ),
    ]);
  }

  return {
    checkedTasks: tasks.length,
    penaltiesApplied: actions.length,
    affectedChildren: new Set(actions.map(action => action.childId)).size,
  };
}

async function loadChildren(env, familyCodes) {
  if (!familyCodes.length) return [];

  const placeholders = familyCodes.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT id, username, family_code, role
     FROM users
     WHERE role = 'child' AND family_code IN (${placeholders})`
  ).bind(...familyCodes).all();

  return results;
}

async function loadApprovedSubmissions(env, taskIds) {
  if (!taskIds.length) return [];

  const placeholders = taskIds.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT task_id, child_id, status, created_at
     FROM submissions
     WHERE status = 'approved' AND task_id IN (${placeholders})`
  ).bind(...taskIds).all();

  return results;
}

async function loadAppliedPenaltyKeys(env, taskIds) {
  if (!taskIds.length) return [];

  const placeholders = taskIds.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT task_id, child_id, period_key
     FROM task_penalties
     WHERE task_id IN (${placeholders})`
  ).bind(...taskIds).all();

  return results.map(row => `${row.task_id}:${row.child_id}:${row.period_key}`);
}
