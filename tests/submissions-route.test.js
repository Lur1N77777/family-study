import { describe, expect, it } from 'vitest';

import { handleSubmissions } from '../worker/routes/submissions.js';

describe('submission routes', () => {
  it('blocks a child from querying another child submissions', async () => {
    const { env, calls, verifyComplete } = createEnv([]);

    const response = await handleSubmissions(
      new Request('https://example.com/api/submissions?childId=child_2', { method: 'GET' }),
      env,
      { role: 'child', id: 'child_1', familyCode: '888666' },
      '/api/submissions',
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: expect.any(String) });
    expect(calls).toEqual([]);
    verifyComplete();
  });

  it('atomically blocks duplicate submissions in the same window', async () => {
    const { env, verifyComplete } = createEnv([
      {
        method: 'first',
        sqlIncludes: 'SELECT * FROM tasks WHERE id = ?',
        result: {
          id: 'task_1',
          type: 'daily',
          family_code: '888666',
          target_child_id: null,
        },
      },
      {
        method: 'run',
        sqlIncludes: ['INSERT INTO submissions', 'WHERE NOT EXISTS'],
        result: { success: true, meta: { changes: 0 } },
      },
      {
        method: 'first',
        sqlIncludes: ['SELECT id, status', 'status IN (?, ?)'],
        result: { id: 'sub_existing', status: 'pending' },
      },
    ]);

    const response = await handleSubmissions(
      new Request('https://example.com/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: 'task_1', photoKeys: ['photo_1'] }),
      }),
      env,
      { role: 'child', id: 'child_1', familyCode: '888666' },
      '/api/submissions',
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: expect.any(String) });
    verifyComplete();
  });

  it('approves a submission with compare-and-swap semantics', async () => {
    const { env, verifyComplete } = createEnv([
      {
        method: 'first',
        sqlIncludes: 'SELECT * FROM submissions WHERE id = ?',
        result: { id: 'sub_1', child_id: 'child_1', status: 'pending', task_id: 'task_1', photo_key: null },
      },
      {
        method: 'first',
        sqlIncludes: 'SELECT id, username, family_code FROM users WHERE id = ?',
        result: { id: 'child_1', username: '小明', family_code: '888666' },
      },
      {
        method: 'first',
        sqlIncludes: 'SELECT points, title FROM tasks WHERE id = ?',
        result: { points: 8, title: '阅读' },
      },
      {
        method: 'run',
        sqlIncludes: 'WHERE id = ? AND status = ?',
        assertArgs(args) {
          expect(args.at(-1)).toBe('pending');
        },
        result: { success: true, meta: { changes: 1 } },
      },
      {
        method: 'run',
        sqlIncludes: ['UPDATE users', 'AND EXISTS'],
        result: { success: true, meta: { changes: 1 } },
      },
      {
        method: 'run',
        sqlIncludes: ['INSERT INTO activity_log', 'WHERE EXISTS'],
        result: { success: true, meta: { changes: 1 } },
      },
    ]);

    const response = await handleSubmissions(
      new Request('https://example.com/api/submissions/sub_1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      }),
      env,
      { role: 'parent', id: 'parent_1', username: '妈妈', familyCode: '888666' },
      '/api/submissions/sub_1',
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, photoAvailableUntil: null });
    verifyComplete();
  });

  it('returns already reviewed when approval loses the compare-and-swap race', async () => {
    const { env, verifyComplete } = createEnv([
      {
        method: 'first',
        sqlIncludes: 'SELECT * FROM submissions WHERE id = ?',
        result: { id: 'sub_1', child_id: 'child_1', status: 'pending', task_id: 'task_1', photo_key: null },
      },
      {
        method: 'first',
        sqlIncludes: 'SELECT id, username, family_code FROM users WHERE id = ?',
        result: { id: 'child_1', username: '小明', family_code: '888666' },
      },
      {
        method: 'first',
        sqlIncludes: 'SELECT points, title FROM tasks WHERE id = ?',
        result: { points: 8, title: '阅读' },
      },
      {
        method: 'run',
        sqlIncludes: 'WHERE id = ? AND status = ?',
        result: { success: true, meta: { changes: 0 } },
      },
      {
        method: 'run',
        sqlIncludes: ['UPDATE users', 'AND EXISTS'],
        result: { success: true, meta: { changes: 0 } },
      },
      {
        method: 'run',
        sqlIncludes: ['INSERT INTO activity_log', 'WHERE EXISTS'],
        result: { success: true, meta: { changes: 0 } },
      },
    ]);

    const response = await handleSubmissions(
      new Request('https://example.com/api/submissions/sub_1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      }),
      env,
      { role: 'parent', id: 'parent_1', username: '妈妈', familyCode: '888666' },
      '/api/submissions/sub_1',
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: expect.any(String) });
    verifyComplete();
  });

  it('returns already reviewed when rejection loses the compare-and-swap race', async () => {
    const { env, verifyComplete } = createEnv([
      {
        method: 'first',
        sqlIncludes: 'SELECT * FROM submissions WHERE id = ?',
        result: { id: 'sub_1', child_id: 'child_1', status: 'pending', task_id: 'task_1', photo_key: null },
      },
      {
        method: 'first',
        sqlIncludes: 'SELECT id, username, family_code FROM users WHERE id = ?',
        result: { id: 'child_1', username: '小明', family_code: '888666' },
      },
      {
        method: 'first',
        sqlIncludes: 'SELECT title FROM tasks WHERE id = ?',
        result: { title: '阅读' },
      },
      {
        method: 'run',
        sqlIncludes: 'WHERE id = ? AND status = ?',
        result: { success: true, meta: { changes: 0 } },
      },
      {
        method: 'run',
        sqlIncludes: ['INSERT INTO activity_log', 'WHERE EXISTS'],
        result: { success: true, meta: { changes: 0 } },
      },
    ]);

    const response = await handleSubmissions(
      new Request('https://example.com/api/submissions/sub_1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: '未完成' }),
      }),
      env,
      { role: 'parent', id: 'parent_1', username: '妈妈', familyCode: '888666' },
      '/api/submissions/sub_1',
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: expect.any(String) });
    verifyComplete();
  });
});

function createEnv(steps) {
  const queue = [...steps];
  const calls = [];

  function consume(method, sql, args) {
    const step = queue.shift();
    expect(step, `Unexpected DB ${method} call for ${sql}`).toBeTruthy();
    expect(step.method).toBe(method);

    const includes = Array.isArray(step.sqlIncludes) ? step.sqlIncludes : (step.sqlIncludes ? [step.sqlIncludes] : []);
    includes.forEach((value) => {
      expect(sql).toContain(value);
    });

    if (step.assertArgs) {
      step.assertArgs(args);
    }

    return typeof step.result === 'function' ? step.result({ sql, args }) : step.result;
  }

  const env = {
    CORS_ORIGIN: '*',
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            return {
              sql,
              args,
              async first() {
                calls.push({ method: 'first', sql, args });
                return consume('first', sql, args);
              },
              async all() {
                calls.push({ method: 'all', sql, args });
                return consume('all', sql, args);
              },
              async run() {
                calls.push({ method: 'run', sql, args });
                return consume('run', sql, args);
              },
            };
          },
        };
      },
      async batch(statements) {
        const results = [];
        for (const statement of statements) {
          results.push(await statement.run());
        }
        return results;
      },
    },
  };

  return {
    env,
    calls,
    verifyComplete() {
      expect(queue).toHaveLength(0);
    },
  };
}
