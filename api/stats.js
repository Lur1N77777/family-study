// ========================================
// 统计 API — /api/stats
// ========================================

export async function handleStats(req, res, user, path) {
    const { kv } = await import('@vercel/kv');

    if (path === '/api/stats' && req.method === 'GET') {
        const familyCode = user.familyCode;

        // 用户统计
        const users = await kv.hgetall(`family:${familyCode}:users`) || {};
        const userList = Object.values(users);

        const children = userList.filter(u => u.role === 'child');
        const parents = userList.filter(u => u.role === 'parent');

        // 任务统计
        const tasks = await kv.hgetall(`family:${familyCode}:tasks`) || {};
        const taskList = Object.values(tasks);

        // 提交统计
        const submissions = await kv.lrange(`family:${familyCode}:submissions`, 0, -1) || [];

        // 兑换统计
        const redemptions = await kv.lrange(`family:${familyCode}:redemptions`, 0, -1) || [];

        const stats = {
            totalUsers: userList.length,
            childrenCount: children.length,
            parentsCount: parents.length,
            activeTasks: taskList.filter(t => t.status === 'active').length,
            pendingSubmissions: submissions.filter(s => s.status === 'pending').length,
            approvedSubmissions: submissions.filter(s => s.status === 'approved').length,
            pendingRedemptions: redemptions.filter(r => r.status === 'pending').length,
            childrenPoints: children.map(c => ({
                id: c.id,
                username: c.username,
                avatar: c.avatar,
                points: c.points || 0
            }))
        };

        return res.json(stats);
    }

    return res.status(404).json({ error: '接口不存在' });
}
