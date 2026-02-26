// ========================================
// 兑换路由 — /api/redemptions
// ========================================

import { uid } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function handleRedemptions(request, env, user, path) {
    const method = request.method;

    // GET /api/redemptions — 查询兑换记录
    if (method === 'GET' && path === '/api/redemptions') {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');

        let sql = `SELECT * FROM redemptions WHERE `;
        const params = [];

        if (user.role === 'child') {
            sql += `child_id = ?`;
            params.push(user.id);
        } else {
            sql += `child_id IN (SELECT id FROM users WHERE family_code = ?)`;
            params.push(user.familyCode);
        }

        if (status) {
            sql += ` AND status = ?`;
            params.push(status);
        }

        sql += ` ORDER BY created_at DESC LIMIT 50`;

        const { results } = await env.DB.prepare(sql).bind(...params).all();
        return jsonResponse(results, env);
    }

    // POST /api/redemptions — 发起兑换
    if (method === 'POST' && path === '/api/redemptions') {
        if (user.role !== 'child') return errorResponse('权限不足', 403, env);
        const { productId } = await request.json();
        if (!productId) return errorResponse('缺少商品ID', 400, env);

        // 查询商品并判断余额 (使用事务)
        const product = await env.DB.prepare('SELECT name, emoji, price FROM products WHERE id = ? AND status = ?')
            .bind(productId, 'active').first();
        if (!product) return errorResponse('商品不存在或已下架', 404, env);

        const child = await env.DB.prepare('SELECT points, username, family_code FROM users WHERE id = ?')
            .bind(user.id).first();
        if (!child || child.points < product.price) return errorResponse('积分不足', 400, env);

        const redId = uid();
        await env.DB.batch([
            // 扣减积分
            env.DB.prepare('UPDATE users SET points = points - ? WHERE id = ?').bind(product.price, user.id),
            // 写入兑换记录
            env.DB.prepare('INSERT INTO redemptions (id, product_id, child_id, product_name, product_emoji, price, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                .bind(redId, productId, user.id, product.name, product.emoji, product.price, 'pending', Date.now()),
            // 写入活动日志
            env.DB.prepare('INSERT INTO activity_log (id, type, message, family_code, timestamp) VALUES (?, ?, ?, ?, ?)')
                .bind(uid(), 'redemption', `${child.username}兑换了「${product.name}」，花费${product.price}积分`, child.family_code, Date.now())
        ]);

        return jsonResponse({ id: redId, status: 'pending' }, env, 201);
    }

    // PATCH /api/redemptions/:id — 家长确认兑现
    if (method === 'PATCH') {
        const redId = path.split('/').pop();
        if (user.role !== 'parent') return errorResponse('权限不足', 403, env);

        const res = await env.DB.prepare('UPDATE redemptions SET status = ? WHERE id = ? AND status = ?')
            .bind('confirmed', redId, 'pending').run();

        if (!res.success) return errorResponse('确认失败', 400, env);

        return jsonResponse({ success: true }, env);
    }

    return errorResponse('Not Found', 404, env);
}
