import { describe, expect, it } from 'vitest';

import { handleProducts } from '../worker/routes/products.js';

describe('products route', () => {
  it('rejects product creation with invalid price or category', async () => {
    const env = createEnv();

    const response = await handleProducts(
      createJsonRequest('POST', { name: 'Bad Product', category: 'other', price: -1 }),
      env,
      { role: 'parent', familyCode: '888666', id: 'parent_1' },
      '/api/products',
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      error: expect.any(String),
    }));
  });

  it('scopes product updates to the current family', async () => {
    const calls = [];
    const env = createEnv({
      runResults: [{ success: true, meta: { changes: 0 } }],
      calls,
    });

    const response = await handleProducts(
      createJsonRequest('PATCH', { price: 99 }),
      env,
      { role: 'parent', familyCode: '888666', id: 'parent_1' },
      '/api/products/product_foreign',
    );

    expect(response.status).toBe(404);
    expect(calls).toEqual([
      {
        sql: 'UPDATE products SET price = ? WHERE id = ? AND family_code = ?',
        args: [99, 'product_foreign', '888666'],
      },
    ]);
  });

  it('scopes product deletion to the current family', async () => {
    const calls = [];
    const env = createEnv({
      runResults: [{ success: true, meta: { changes: 0 } }],
      calls,
    });

    const response = await handleProducts(
      { method: 'DELETE' },
      env,
      { role: 'parent', familyCode: '888666', id: 'parent_1' },
      '/api/products/product_foreign',
    );

    expect(response.status).toBe(404);
    expect(calls).toEqual([
      {
        sql: 'UPDATE products SET status = ? WHERE id = ? AND family_code = ? AND status != ?',
        args: ['deleted', 'product_foreign', '888666', 'deleted'],
      },
    ]);
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

function createEnv({ runResults = [], calls = [] } = {}) {
  let runIndex = 0;

  return {
    CORS_ORIGIN: '*',
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            return {
              async run() {
                calls.push({ sql, args });
                return runResults[runIndex++] || { success: true, meta: { changes: 1 } };
              },
              async all() {
                calls.push({ sql, args });
                return { results: [] };
              },
            };
          },
        };
      },
    },
  };
}
