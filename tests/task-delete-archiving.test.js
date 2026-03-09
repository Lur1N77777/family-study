import { describe, expect, it } from 'vitest';
import { handleTasks } from '../worker/routes/tasks.js';

describe('task deletion route', () => {
  it('archives a task instead of hard deleting it', async () => {
    const calls = [];
    const env = createEnv({
      runResult: { success: true, meta: { changes: 1 } },
      calls,
    });

    const response = await handleTasks(
      { method: 'DELETE' },
      env,
      { role: 'parent', familyCode: '888666', id: 'parent_1' },
      '/api/tasks/task_123',
    );

    expect(response.status).toBe(200);
    expect(calls).toEqual([
      {
        sql: 'UPDATE tasks SET status = ? WHERE id = ? AND family_code = ? AND status = ?',
        args: ['deleted', 'task_123', '888666', 'active'],
      },
    ]);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('returns 404 when the task is already missing or archived', async () => {
    const env = createEnv({
      runResult: { success: true, meta: { changes: 0 } },
      calls: [],
    });

    const response = await handleTasks(
      { method: 'DELETE' },
      env,
      { role: 'parent', familyCode: '888666', id: 'parent_1' },
      '/api/tasks/task_missing',
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: '任务不存在' });
  });
});

function createEnv({ runResult, calls }) {
  return {
    CORS_ORIGIN: '*',
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            return {
              async run() {
                calls.push({ sql, args });
                return runResult;
              },
            };
          },
        };
      },
    },
  };
}
