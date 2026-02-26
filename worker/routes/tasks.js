// ========================================
// 任务路由 — /api/tasks
// ========================================

import { uid } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

export async function handleTasks(request, env, user, path) {
    const method = request.method;

    // GET /api/tasks — 获取家庭任务列表
    if (method === 'GET' && path === '/api/tasks') {
        const { results } = await env.DB.prepare(
            'SELECT * FROM tasks WHERE family_code = ? AND status = ? ORDER BY created_at DESC'
        ).bind(user.familyCode, 'active').all();
        return jsonResponse(results, env);
    }

    // POST /api/tasks — 创建任务（家长）
    if (method === 'POST' && path === '/api/tasks') {
        if (user.role !== 'parent') return errorResponse('权限不足', 403, env);
        const { title, description, type, points } = await request.json();
        if (!title || !points) return errorResponse('请填写完整', 400, env);

        const id = uid();
        await env.DB.prepare(
            'INSERT INTO tasks (id, title, description, type, points, creator_id, family_code, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, title, description || '', type || 'daily', points, user.id, user.familyCode, 'active', Date.now()).run();

        return jsonResponse({ id, title, description, type, points, status: 'active' }, env, 201);
    }

    // PATCH /api/tasks/:id — 更新任务
    if (method === 'PATCH') {
        const taskId = path.split('/').pop();
        if (user.role !== 'parent') return errorResponse('权限不足', 403, env);
        const updates = await request.json();
        const fields = [];
        const values = [];
        for (const [k, v] of Object.entries(updates)) {
            if (['title', 'description', 'type', 'points'].includes(k)) {
                fields.push(`${k} = ?`);
                values.push(v);
            }
        }
        if (fields.length === 0) return errorResponse('无有效更新', 400, env);
        values.push(taskId);
        await env.DB.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
        return jsonResponse({ success: true }, env);
    }

    // DELETE /api/tasks/:id
    if (method === 'DELETE') {
        const taskId = path.split('/').pop();
        if (user.role !== 'parent') return errorResponse('权限不足', 403, env);
        await env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(taskId).run();
        return jsonResponse({ success: true }, env);
    }

    return errorResponse('Not Found', 404, env);
}
