import { describe, expect, it } from 'vitest';
import { buildPenaltyActions } from '../worker/utils/task-penalty-engine.js';

describe('task penalty engine', () => {
  it('creates penalties only for assignees who missed the finished period', () => {
    const now = Date.parse('2026-03-10T00:10:00.000Z');
    const tasks = [
      {
        id: 'task_daily_all',
        title: '背单词',
        type: 'daily',
        family_code: '888666',
        target_child_id: null,
        penalty_enabled: 1,
        penalty_points: 3,
        created_at: Date.parse('2026-03-01T02:00:00.000Z'),
      },
    ];

    const children = [
      { id: 'child_1', family_code: '888666', role: 'child', username: '小明' },
      { id: 'child_2', family_code: '888666', role: 'child', username: '小红' },
    ];

    const approvedSubmissions = [
      {
        task_id: 'task_daily_all',
        child_id: 'child_1',
        status: 'approved',
        created_at: Date.parse('2026-03-09T02:00:00.000Z'),
      },
    ];

    const actions = buildPenaltyActions({
      tasks,
      children,
      approvedSubmissions,
      appliedPenaltyKeys: [],
      now,
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      taskId: 'task_daily_all',
      childId: 'child_2',
      points: 3,
      periodKey: 'daily:2026-03-09',
    });
  });

  it('does not create duplicate penalties for an already processed period', () => {
    const now = Date.parse('2026-03-10T00:10:00.000Z');
    const tasks = [
      {
        id: 'task_targeted',
        title: '朗读',
        type: 'daily',
        family_code: '888666',
        target_child_id: 'child_1',
        penalty_enabled: 1,
        penalty_points: 2,
        created_at: Date.parse('2026-03-01T02:00:00.000Z'),
      },
    ];

    const children = [
      { id: 'child_1', family_code: '888666', role: 'child', username: '小明' },
    ];

    const actions = buildPenaltyActions({
      tasks,
      children,
      approvedSubmissions: [],
      appliedPenaltyKeys: ['task_targeted:child_1:daily:2026-03-09'],
      now,
    });

    expect(actions).toEqual([]);
  });
});
