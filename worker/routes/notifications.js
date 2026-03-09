// ========================================
// 通知路由 — /api/notifications
// ========================================

import { uid } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function handleNotifications(request, env, user, path) {
    const method = request.method;

    // GET /api/notifications — 获取通知列表（孩子端轮询）
    if (method === 'GET' && path === '/api/notifications') {
        // 孩子轮询获取未读通知
        if (user.role !== 'child') return errorResponse('权限不足', 403, env);

        const url = new URL(request.url);
        const since = parseInt(url.searchParams.get('since') || '0');

        const { results } = await env.DB.prepare(
            'SELECT * FROM notifications WHERE child_id = ? AND created_at > ? ORDER BY created_at DESC LIMIT 20'
        ).bind(user.id, since).all();

        return jsonResponse(results, env);
    }

    // POST /api/notifications — 发送通知（家长端）
    if (method === 'POST' && path === '/api/notifications') {
        if (user.role !== 'parent') return errorResponse('权限不足', 403, env);

        const { childId, title, message, type } = await request.json();

        if (!childId || !message) return errorResponse('缺少必要参数', 400, env);

        // 验证孩子属于同一家庭
        const child = await env.DB.prepare(
            'SELECT id, username FROM users WHERE id = ? AND family_code = ?'
        ).bind(childId, user.familyCode).first();

        if (!child) return errorResponse('孩子不存在', 404, env);

        const id = uid();
        await env.DB.prepare(
            'INSERT INTO notifications (id, parent_id, child_id, title, message, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, user.id, childId, title || '学习提醒', message, type || 'reminder', Date.now()).run();

        return jsonResponse({ success: true, id }, env, 201);
    }

    // POST /api/notnotifications — 广播通知给所有孩子
    if (method === 'POST' && path === '/api/notifications/broadcast') {
        if (user.role !== 'parent') return errorResponse('权限不足', 403, env);

        const { title, message, type, childIds } = await request.json();

        if (!message) return errorResponse('缺少消息内容', 400, env);

        // 获取家庭中所有孩子
        let children;
        if (childIds && childIds.length > 0) {
            // 指定孩子
            children = await env.DB.prepare(
                'SELECT id, username FROM users WHERE id IN (' + childIds.map(() => '?').join(',') + ') AND family_code = ?'
            ).bind(...childIds, user.familyCode).all();
        } else {
            // 所有孩子
            children = await env.DB.prepare(
                'SELECT id, username FROM users WHERE role = ? AND family_code = ?'
            ).bind('child', user.familyCode).all();
        }

        const now = Date.now();
        const insertPromises = children.results.map(child =>
            env.DB.prepare(
                'INSERT INTO notifications (id, parent_id, child_id, title, message, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(uid(), user.id, child.id, title || '学习提醒', message, type || 'reminder', now)
        );

        await env.DB.batch(insertPromises);

        return jsonResponse({ success: true, count: children.results.length }, env);
    }

    // GET /api/notifications/templates — 获取通知模板（家长端）
    if (method === 'GET' && path === '/api/notifications/templates') {
        // 返回预设模板
        const templates = [
            { id: 'study', title: '学习提醒', message: '该学习了！快去做作业吧 📚', type: 'reminder' },
            { id: 'phone', title: '交手机', message: '学习时间结束，请把手机交给家长 📱', type: 'phone' },
            { id: 'sleep', title: '睡觉时间', message: '该睡觉了，晚安 💤', type: 'sleep' },
            { id: 'break', title: '休息一下', message: '学习辛苦了，休息 10 分钟吧 ☕', type: 'break' },
            { id: 'meal', title: '吃饭时间', message: '吃饭时间到了，快来吃饭 🍚', type: 'meal' },
        ];
        return jsonResponse(templates, env);
    }

    // PATCH /api/notifications/:id — 标记已读
    if (method === 'PATCH') {
        const notifId = path.split('/').pop();
        if (user.role !== 'child') return errorResponse('权限不足', 403, env);

        await env.DB.prepare(
            'UPDATE notifications SET read_at = ? WHERE id = ? AND child_id = ?'
        ).bind(Date.now(), notifId, user.id).run();

        return jsonResponse({ success: true }, env);
    }

    return errorResponse('Not Found', 404, env);
}
