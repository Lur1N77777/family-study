// ========================================
// 积分商品路由 — /api/products
// ========================================

import { uid } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function handleProducts(request, env, user, path) {
    const method = request.method;

    // GET /api/products — 获取商品列表
    if (method === 'GET' && path === '/api/products') {
        const { results } = await env.DB.prepare(
            'SELECT * FROM products WHERE family_code = ? AND status = ? ORDER BY created_at DESC'
        ).bind(user.familyCode, 'active').all();
        return jsonResponse(results, env);
    }

    // POST /api/products — 上架商品
    if (method === 'POST' && path === '/api/products') {
        if (user.role !== 'parent') return errorResponse('权限不足', 403, env);
        const { name, description, emoji, category, price } = await request.json();
        if (!name || price == null) return errorResponse('请填写完整信息', 400, env);

        const id = uid();
        await env.DB.prepare(
            'INSERT INTO products (id, name, description, emoji, category, price, creator_id, family_code, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, name, description || '', emoji || '🎁', category || 'virtual', price, user.id, user.familyCode, 'active', Date.now()).run();

        return jsonResponse({ id, name, price, status: 'active' }, env, 201);
    }

    // PATCH /api/products/:id — 更新/下架商品
    if (method === 'PATCH') {
        const productId = path.split('/').pop();
        if (user.role !== 'parent') return errorResponse('权限不足', 403, env);
        const updates = await request.json();

        const fields = [];
        const values = [];
        for (const [k, v] of Object.entries(updates)) {
            if (['name', 'description', 'emoji', 'category', 'price', 'status'].includes(k)) {
                fields.push(`${k} = ?`);
                values.push(v);
            }
        }
        if (fields.length === 0) return errorResponse('无有效更新', 400, env);

        values.push(productId);
        await env.DB.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

        return jsonResponse({ success: true }, env);
    }

    // DELETE /api/products/:id — 下架商品 (逻辑删除)
    if (method === 'DELETE') {
        const productId = path.split('/').pop();
        if (user.role !== 'parent') return errorResponse('权限不足', 403, env);
        await env.DB.prepare("UPDATE products SET status = 'deleted' WHERE id = ?").bind(productId).run();
        return jsonResponse({ success: true }, env);
    }

    return errorResponse('Not Found', 404, env);
}
