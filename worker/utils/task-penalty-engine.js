import {
  getPenaltyWindowToCheck,
  isTimestampInWindow,
  wasTaskActiveDuringWindow,
} from './task-periods.js';

export function buildPenaltyActions({
  tasks,
  children,
  approvedSubmissions,
  appliedPenaltyKeys = [],
  now = Date.now(),
}) {
  const appliedKeySet = new Set(appliedPenaltyKeys);
  const childrenByFamily = new Map();

  for (const child of children) {
    if (child.role && child.role !== 'child') continue;
    const key = child.family_code;
    if (!childrenByFamily.has(key)) {
      childrenByFamily.set(key, []);
    }
    childrenByFamily.get(key).push(child);
  }

  const actions = [];

  for (const task of tasks) {
    if (!isPenaltyEnabled(task)) continue;

    const window = getPenaltyWindowToCheck(task, now);
    if (!window || !wasTaskActiveDuringWindow(task, window)) continue;

    const taskChildren = task.target_child_id
      ? (childrenByFamily.get(task.family_code) || []).filter(child => child.id === task.target_child_id)
      : (childrenByFamily.get(task.family_code) || []);

    for (const child of taskChildren) {
      const actionKey = `${task.id}:${child.id}:${window.periodKey}`;
      if (appliedKeySet.has(actionKey)) continue;

      const hasApprovedSubmission = approvedSubmissions.some((submission) =>
        submission.task_id === task.id &&
        submission.child_id === child.id &&
        isTimestampInWindow(submission.created_at, window),
      );

      if (hasApprovedSubmission) continue;

      actions.push({
        taskId: task.id,
        taskTitle: task.title,
        taskType: task.type,
        childId: child.id,
        childName: child.username,
        familyCode: task.family_code,
        points: Number(task.penalty_points) || 0,
        periodKey: window.periodKey,
        periodStart: window.startAt,
        periodEnd: window.endAt ?? window.dueAt ?? window.startAt,
        actionKey,
      });
    }
  }

  return actions;
}

function isPenaltyEnabled(task) {
  return (task.penalty_enabled === 1 || task.penalty_enabled === true) && (Number(task.penalty_points) || 0) > 0;
}
