// ========================================
// 任务 API — /api/tasks
// ========================================

import { uid } from './jwt.js';

export async function handleTasks(req, res, user, path) {
    const { kv } = await import('@vercel/kv');

    if (path === '/api/tasks' && req.method === 'GET') {
        // 获取任务列表
        const tasksData = await kv.hgetall(`family:${user.familyCode}:tasks`) || {};
        const tasks = Object.values(tasksData).filter(t => t.status === 'active');

        if (user.role === 'child') {
            // 孩子只看到自己的任务
            const myTasks = tasks.filter(t => t.assigneeId === user.id || !t.assigneeId);
            return res.json(myTasks);
        }
        return res.json(tasks);
    }

    if (path === '/api/tasks' && req.method === 'POST') {
        if (user.role !== 'parent') {
            return res.status(403).json({ error: '只有家长可以创建任务' });
        }

        const { title, description, type, points, assigneeId } = req.body || {};
        if (!title || !type) {
            return res.status(400).json({ error: '请填写任务标题和类型' });
        }

        const id = uid();
        const task = {
            id,
            title,
            description: description || '',
            type,
            points: points || 0,
            creatorId: user.id,
            assigneeId: assigneeId || null,
            familyCode: user.familyCode,
            status: 'active',
            createdAt: Date.now()
        };

        await kv.hset(`family:${user.familyCode}:tasks`, { [id]: task });

        // 记录活动
        await kv.lpush(`family:${user.familyCode}:activity`, {
            type: 'task_created',
            message: `${user.username} 创建了新任务: ${title}`,
            timestamp: Date.now()
        });

        return res.json(task);
    }

    if (path.startsWith('/api/tasks/') && req.method === 'DELETE') {
        if (user.role !== 'parent') {
            return res.status(403).json({ error: '只有家长可以删除任务' });
        }

        const taskId = path.split('/')[3];
        const taskData = await kv.hget(`family:${user.familyCode}:tasks`, taskId);

        if (!taskData) {
            return res.status(404).json({ error: '任务不存在' });
        }

        taskData.status = 'deleted';
        await kv.hset(`family:${user.familyCode}:tasks`, { [taskId]: taskData });

        return res.json({ success: true });
    }

    return res.status(404).json({ error: '接口不存在' });
}
