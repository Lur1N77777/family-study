// ========================================
// 提交 API — /api/submissions
// ========================================

import { uid } from './jwt.js';

export async function handleSubmissions(req, res, user, path) {
    const { kv } = await import('@vercel/kv');

    if (path === '/api/submissions' && req.method === 'GET') {
        // 获取提交列表
        const submissionsData = await kv.lrange(`family:${user.familyCode}:submissions`, 0, -1);
        let submissions = submissionsData || [];

        if (user.role === 'child') {
            // 孩子只看到自己的提交
            submissions = submissions.filter(s => s.childId === user.id);
        }

        return res.json(submissions.reverse());
    }

    if (path === '/api/submissions' && req.method === 'POST') {
        const { taskId, photoKey } = req.body || {};
        if (!taskId) {
            return res.status(400).json({ error: '请选择任务' });
        }

        // 获取任务信息
        const taskData = await kv.hget(`family:${user.familyCode}:tasks`, taskId);
        if (!taskData) {
            return res.status(404).json({ error: '任务不存在' });
        }

        const id = uid();
        const submission = {
            id,
            taskId,
            childId: user.id,
            childName: user.username,
            status: 'pending',
            photoKey: photoKey || null,
            points: taskData.points || 0,
            rejectReason: null,
            createdAt: Date.now(),
            reviewedAt: null
        };

        await kv.lpush(`family:${user.familyCode}:submissions`, submission);

        // 记录活动
        await kv.lpush(`family:${user.familyCode}:activity`, {
            type: 'submission',
            message: `${user.username} 提交了任务: ${taskData.title}`,
            timestamp: Date.now()
        });

        return res.json(submission);
    }

    if (path.startsWith('/api/submissions/') && req.method === 'PUT') {
        if (user.role !== 'parent') {
            return res.status(403).json({ error: '只有家长可以审核' });
        }

        const submissionId = path.split('/')[3];
        const { status, rejectReason } = req.body || {};

        const submissionsData = await kv.lrange(`family:${user.familyCode}:submissions`, 0, -1);
        const submissions = submissionsData || [];
        const idx = submissions.findIndex(s => s.id === submissionId);

        if (idx === -1) {
            return res.status(404).json({ error: '提交不存在' });
        }

        const submission = submissions[idx];
        submission.status = status;
        submission.reviewedAt = Date.now();

        // 如果批准，发放积分
        if (status === 'approved') {
            const child = await kv.get(`user:${submission.childName}`);
            if (child) {
                child.points = (child.points || 0) + submission.points;
                await kv.set(`user:${submission.childName}`, child);
                await kv.hset(`family:${user.familyCode}:users`, { [child.id]: child });

                await kv.lpush(`family:${user.familyCode}:activity`, {
                    type: 'points',
                    message: `${submission.childName} 获得了 ${submission.points} 积分`,
                    timestamp: Date.now()
                });
            }
        }

        if (status === 'rejected') {
            submission.rejectReason = rejectReason || '';
        }

        // 更新提交
        submissions[idx] = submission;
        await kv.del(`family:${user.familyCode}:submissions`);
        for (const s of submissions.reverse()) {
            await kv.lpush(`family:${user.familyCode}:submissions`, s);
        }

        return res.json(submission);
    }

    return res.status(404).json({ error: '接口不存在' });
}
