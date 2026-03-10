// ========================================
// Product routes - /api/products
// ========================================

import { uid } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

const VALID_CATEGORIES = new Set(['virtual', 'physical']);
const VALID_STATUSES = new Set(['active', 'deleted']);
const UPDATEABLE_FIELDS = ['name', 'description', 'emoji', 'category', 'price', 'status'];

export async function handleProducts(request, env, user, path) {
  const method = request.method;

  if (method === 'GET' && path === '/api/products') {
    const { results } = await env.DB.prepare(
      'SELECT * FROM products WHERE family_code = ? AND status = ? ORDER BY created_at DESC'
    ).bind(user.familyCode, 'active').all();
    return jsonResponse(results, env);
  }

  if (method === 'POST' && path === '/api/products') {
    if (user.role !== 'parent') return errorResponse('权限不足', 403, env);

    let payload;
    try {
      payload = normalizeProductPayload(await request.json(), { partial: false });
    } catch (error) {
      return errorResponse(error.message || '商品信息不合法', 400, env);
    }

    const id = uid();
    await env.DB.prepare(
      'INSERT INTO products (id, name, description, emoji, category, price, creator_id, family_code, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id,
      payload.name,
      payload.description,
      payload.emoji,
      payload.category,
      payload.price,
      user.id,
      user.familyCode,
      'active',
      Date.now(),
    ).run();

    return jsonResponse({ id, name: payload.name, price: payload.price, status: 'active' }, env, 201);
  }

  if (method === 'PATCH') {
    const productId = path.split('/').pop();
    if (user.role !== 'parent') return errorResponse('权限不足', 403, env);

    let updates;
    try {
      updates = normalizeProductPayload(await request.json(), { partial: true });
    } catch (error) {
      return errorResponse(error.message || '商品信息不合法', 400, env);
    }

    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
      if (UPDATEABLE_FIELDS.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return errorResponse('没有有效更新', 400, env);

    values.push(productId, user.familyCode);
    const result = await env.DB.prepare(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ? AND family_code = ?`
    ).bind(...values).run();

    if (!wasMutationApplied(result)) {
      return errorResponse('商品不存在或无权操作', 404, env);
    }

    return jsonResponse({ success: true }, env);
  }

  if (method === 'DELETE') {
    const productId = path.split('/').pop();
    if (user.role !== 'parent') return errorResponse('权限不足', 403, env);

    const result = await env.DB.prepare(
      'UPDATE products SET status = ? WHERE id = ? AND family_code = ? AND status != ?'
    ).bind('deleted', productId, user.familyCode, 'deleted').run();

    if (!wasMutationApplied(result)) {
      return errorResponse('商品不存在或无权操作', 404, env);
    }

    return jsonResponse({ success: true }, env);
  }

  return errorResponse('Not Found', 404, env);
}

function normalizeProductPayload(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('商品信息不合法');
  }

  const normalized = {};

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'name')) {
    const name = String(payload.name || '').trim();
    if (!name) throw new Error('请填写商品名称');
    normalized.name = name;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'description')) {
    normalized.description = payload.description == null ? '' : String(payload.description);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'emoji')) {
    normalized.emoji = payload.emoji == null || payload.emoji === '' ? '🎁' : String(payload.emoji);
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'category')) {
    const category = payload.category == null || payload.category === ''
      ? 'virtual'
      : String(payload.category);
    if (!VALID_CATEGORIES.has(category)) throw new Error('商品类别无效');
    normalized.category = category;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, 'price')) {
    const price = Number(payload.price);
    if (!Number.isInteger(price) || price < 0) throw new Error('商品价格必须为非负整数');
    normalized.price = price;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    const status = String(payload.status);
    if (!VALID_STATUSES.has(status)) throw new Error('商品状态无效');
    normalized.status = status;
  }

  return normalized;
}

function wasMutationApplied(result) {
  return Boolean(result?.success && result?.meta?.changes);
}
