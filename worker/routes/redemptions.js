// ========================================
// 兑换路由 - /api/redemptions
// ========================================

import { uid } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function handleRedemptions(request, env, user, path) {
  const method = request.method;

  if (method === 'GET' && path === '/api/redemptions') {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let sql = 'SELECT * FROM redemptions WHERE ';
    const params = [];

    if (user.role === 'child') {
      sql += 'child_id = ?';
      params.push(user.id);
    } else {
      sql += 'child_id IN (SELECT id FROM users WHERE family_code = ?)';
      params.push(user.familyCode);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const { results } = await env.DB.prepare(sql).bind(...params).all();
    return jsonResponse(results, env);
  }

  if (method === 'POST' && path === '/api/redemptions') {
    if (user.role !== 'child') return errorResponse('权限不足', 403, env);

    const { productId } = await request.json();
    if (!productId) return errorResponse('缺少商品ID', 400, env);

    const product = await env.DB.prepare(
      'SELECT name, emoji, price FROM products WHERE id = ? AND family_code = ? AND status = ?'
    ).bind(productId, user.familyCode, 'active').first();
    if (!product) return errorResponse('商品不存在或已下架', 404, env);

    const child = await env.DB.prepare(
      'SELECT username, family_code FROM users WHERE id = ? AND family_code = ?'
    ).bind(user.id, user.familyCode).first();
    if (!child) return errorResponse('权限不足', 403, env);

    const redemptionId = uid();
    const now = Date.now();
    const results = await env.DB.batch([
      env.DB.prepare(
        'UPDATE users SET points = points - ? WHERE id = ? AND family_code = ? AND points >= ?'
      ).bind(product.price, user.id, user.familyCode, product.price),
      env.DB.prepare(
        `INSERT INTO redemptions (id, product_id, child_id, product_name, product_emoji, price, status, created_at)
         SELECT ?, ?, ?, ?, ?, ?, ?, ?
          WHERE changes() > 0`
      ).bind(redemptionId, productId, user.id, product.name, product.emoji, product.price, 'pending', now),
      env.DB.prepare(
        `INSERT INTO activity_log (id, type, message, family_code, timestamp)
         SELECT ?, ?, ?, ?, ?
          WHERE EXISTS (
            SELECT 1
              FROM redemptions
             WHERE id = ?
               AND child_id = ?
               AND status = ?
          )`
      ).bind(
        uid(),
        'redemption',
        `${child.username}兑换了《${product.name}》，花费${product.price}积分`,
        child.family_code,
        now,
        redemptionId,
        user.id,
        'pending',
      ),
    ]);

    if (!wasMutationApplied(results?.[0])) {
      return errorResponse('积分不足', 400, env);
    }

    if (!wasMutationApplied(results?.[1])) {
      return errorResponse('创建兑换记录失败', 500, env);
    }

    return jsonResponse({ id: redemptionId, status: 'pending' }, env, 201);
  }

  if (method === 'PATCH') {
    const redemptionId = path.split('/').pop();
    if (user.role !== 'parent') return errorResponse('权限不足', 403, env);

    const result = await env.DB.prepare(
      'UPDATE redemptions SET status = ? WHERE id = ? AND status = ? AND child_id IN (SELECT id FROM users WHERE family_code = ?)'
    ).bind('confirmed', redemptionId, 'pending', user.familyCode).run();

    if (!wasMutationApplied(result)) {
      return errorResponse('兑换记录不存在', 404, env);
    }

    return jsonResponse({ success: true }, env);
  }

  return errorResponse('Not Found', 404, env);
}

function wasMutationApplied(result) {
  return Boolean(result?.success && result?.meta?.changes);
}
