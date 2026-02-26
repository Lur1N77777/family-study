// ========================================
// 提交路由 — /api/submissions
// ========================================

import { uid } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function handleSubmissions(request, env, user, path) {
    const method = request.method;

    // GET /api/submissions?status=pending&childId=xxx
    if (method === 'GET' && path === '/api/submissions') {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const childId = url.searchParams.get('childId');

        let sql = `SELECT s.*, u.username as child_name, u.avatar as child_avatar, t.title as task_title, t.points as task_points
               FROM submissions s
               JOIN users u ON s.child_id = u.id
               LEFT JOIN tasks t ON s.task_id = t.id
               WHERE u.family_code = ?`;
        const params = [user.familyCode];

        if (status) { sql += ' AND s.status = ?'; params.push(status); }
        if (childId) { sql += ' AND s.child_id = ?'; params.push(childId); }

        sql += ' ORDER BY s.created_at DESC LIMIT 50';

        const { results } = await env.DB.prepare(sql).bind(...params).all();
        return jsonResponse(results, env);
    }

    // POST /api/submissions — 孩子提交任务
    if (method === 'POST' && path === '/api/submissions') {
        if (user.role !== 'child') return errorResponse('权限不足', 403, env);
        const { taskId, photoKey } = await request.json();
        if (!taskId) return errorResponse('缺少任务ID', 400, env);

        const id = uid();
        await env.DB.prepare(
            'INSERT INTO submissions (id, task_id, child_id, status, photo_key, points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, taskId, user.id, 'pending', photoKey || null, 0, Date.now()).run();

        return jsonResponse({ id, status: 'pending' }, env, 201);
    }

    // PATCH /api/submissions/:id — 家长审核
    if (method === 'PATCH') {
        const subId = path.split('/').pop();
        if (user.role !== 'parent') return errorResponse('权限不足', 403, env);
        const { action, reason } = await request.json(); // action: approve | reject

        const sub = await env.DB.prepare('SELECT * FROM submissions WHERE id = ?').bind(subId).first();
        if (!sub) return errorResponse('提交不存在', 404, env);

        if (action === 'approve') {
            const task = await env.DB.prepare('SELECT points, title FROM tasks WHERE id = ?').bind(sub.task_id).first();
            const pts = task?.points || 0;
            const child = await env.DB.prepare('SELECT username, family_code FROM users WHERE id = ?').bind(sub.child_id).first();

            await env.DB.batch([
                env.DB.prepare('UPDATE submissions SET status = ?, points = ?, reviewed_at = ? WHERE id = ?')
                    .bind('approved', pts, Date.now(), subId),
                env.DB.prepare('UPDATE users SET points = points + ? WHERE id = ?')
                    .bind(pts, sub.child_id),
                env.DB.prepare('INSERT INTO activity_log (id, type, message, family_code, timestamp) VALUES (?, ?, ?, ?, ?)')
                    .bind(uid(), 'task_approved', `${child?.username || ''}完成了「${task?.title || ''}」，获得${pts}积分`, child?.family_code || user.familyCode, Date.now()),
            ]);
        } else {
            const child = await env.DB.prepare('SELECT username, family_code FROM users WHERE id = ?').bind(sub.child_id).first();
            const task = await env.DB.prepare('SELECT title FROM tasks WHERE id = ?').bind(sub.task_id).first();

            await env.DB.batch([
                env.DB.prepare('UPDATE submissions SET status = ?, reject_reason = ?, reviewed_at = ? WHERE id = ?')
                    .bind('rejected', reason || '未达标', Date.now(), subId),
                env.DB.prepare('INSERT INTO activity_log (id, type, message, family_code, timestamp) VALUES (?, ?, ?, ?, ?)')
                    .bind(uid(), 'task_rejected', `${child?.username || ''}的「${task?.title || ''}」被驳回`, child?.family_code || user.familyCode, Date.now()),
            ]);
        }

        return jsonResponse({ success: true }, env);
    }

    return errorResponse('Not Found', 404, env);
}
