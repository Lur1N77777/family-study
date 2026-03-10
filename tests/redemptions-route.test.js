import { describe, expect, it } from 'vitest';

import { handleRedemptions } from '../worker/routes/redemptions.js';

describe('redemptions route', () => {
  it('scopes product lookup to the current family', async () => {
    const calls = [];
    const env = createEnv({
      calls,
      firstResults: [null],
    });

    const response = await handleRedemptions(
      createJsonRequest('POST', { productId: 'product_foreign' }),
      env,
      { role: 'child', id: 'child_1', familyCode: '888666' },
      '/api/redemptions',
    );

    expect(response.status).toBe(404);
    expect(calls[0]).toEqual({
      sql: 'SELECT name, emoji, price FROM products WHERE id = ? AND family_code = ? AND status = ?',
      args: ['product_foreign', '888666', 'active'],
      method: 'first',
    });
  });

  it('does not create a redemption when the guarded points update fails', async () => {
    const batchCalls = [];
    const env = createEnv({
      firstResults: [
        { name: 'Toy', emoji: '🎁', price: 30 },
        { username: 'Kid', family_code: '888666' },
      ],
      batchResults: [[
        { success: true, meta: { changes: 0 } },
        { success: true, meta: { changes: 0 } },
        { success: true, meta: { changes: 0 } },
      ]],
      batchCalls,
    });

    const response = await handleRedemptions(
      createJsonRequest('POST', { productId: 'product_1' }),
      env,
      { role: 'child', id: 'child_1', familyCode: '888666' },
      '/api/redemptions',
    );

    expect(response.status).toBe(400);
    expect(batchCalls).toHaveLength(1);
    expect(batchCalls[0][1].sql).toContain('WHERE changes() > 0');
  });

  it('scopes redemption confirmation to the current family', async () => {
    const calls = [];
    const env = createEnv({
      calls,
      runResults: [{ success: true, meta: { changes: 0 } }],
    });

    const response = await handleRedemptions(
      { method: 'PATCH' },
      env,
      { role: 'parent', id: 'parent_1', familyCode: '888666' },
      '/api/redemptions/red_foreign',
    );

    expect(response.status).toBe(404);
    expect(calls[0]).toEqual({
      sql: 'UPDATE redemptions SET status = ? WHERE id = ? AND status = ? AND child_id IN (SELECT id FROM users WHERE family_code = ?)',
      args: ['confirmed', 'red_foreign', 'pending', '888666'],
      method: 'run',
    });
  });
});

function createJsonRequest(method, body) {
  return {
    method,
    async json() {
      return body;
    },
  };
}

function createEnv({
  calls = [],
  firstResults = [],
  runResults = [],
  batchResults = [],
  batchCalls = [],
} = {}) {
  return {
    CORS_ORIGIN: '*',
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            return {
              sql,
              args,
              async first() {
                calls.push({ sql, args, method: 'first' });
                return firstResults.shift() ?? null;
              },
              async run() {
                calls.push({ sql, args, method: 'run' });
                return runResults.shift() ?? { success: true, meta: { changes: 1 } };
              },
            };
          },
        };
      },
      async batch(statements) {
        batchCalls.push(statements.map(({ sql, args }) => ({ sql, args })));
        const results = batchResults.shift();
        return results || statements.map(() => ({ success: true, meta: { changes: 1 } }));
      },
    },
  };
}
