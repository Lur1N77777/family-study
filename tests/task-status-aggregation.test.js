import { describe, expect, it } from 'vitest';
import { buildParentTaskStatusView } from '../worker/routes/tasks.js';

describe('parent task status aggregation', () => {
  it('returns current-period completion for each target child', () => {
    const now = Date.parse('2026-03-15T04:00:00.000Z');
    const tasks = [
      {
        id: 'task_weekend_all',
        title: '鍛ㄦ湯鏁寸悊',
        type: 'weekly',
        weekly_rule: 'weekend_twice',
        family_code: '888666',
        target_child_id: null,
        created_at: Date.parse('2026-03-01T02:00:00.000Z'),
      },
    ];
    const children = [
      { id: 'child_1', username: '灏忔槑', avatar: 'A' },
      { id: 'child_2', username: '灏忕孩', avatar: 'B' },
    ];
    const submissions = [
      {
        id: 'sub_1',
        task_id: 'task_weekend_all',
        child_id: 'child_1',
        status: 'approved',
        created_at: Date.parse('2026-03-14T02:00:00.000Z'),
      },
      {
        id: 'sub_2',
        task_id: 'task_weekend_all',
        child_id: 'child_1',
        status: 'approved',
        created_at: Date.parse('2026-03-15T02:00:00.000Z'),
      },
      {
        id: 'sub_3',
        task_id: 'task_weekend_all',
        child_id: 'child_2',
        status: 'approved',
        created_at: Date.parse('2026-03-14T02:00:00.000Z'),
      },
    ];

    const [taskView] = buildParentTaskStatusView({
      tasks,
      children,
      submissions,
      now,
    });

    expect(taskView.completion_overview).toMatchObject({
      totalChildren: 2,
      completedChildren: 1,
      partialChildren: 1,
      overdueChildren: 0,
    });
    expect(taskView.target_children_statuses.map((child) => ({
      childId: child.child_id,
      status: child.completion_status,
      completedCount: child.completion_summary.completedCount,
    }))).toEqual([
      { childId: 'child_1', status: 'completed', completedCount: 2 },
      { childId: 'child_2', status: 'partial', completedCount: 1 },
    ]);
  });
});
