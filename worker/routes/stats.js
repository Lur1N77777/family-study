// ========================================
// 统计数据路由 — /api/stats
// ========================================

import { jsonResponse, errorResponse } from '../utils/response.js';

export async function handleStats(request, env, user, path) {
    if (path !== '/api/stats' || request.method !== 'GET') {
        return errorResponse('Not Found', 404, env);
    }

    const fc = user.familyCode;

    // 用聚合查询获取所有统计
    const [taskCount, pendingSubs, approvedSubs, totalSubs, pendingReds] = await Promise.all([
        env.DB.prepare('SELECT COUNT(*) as c FROM tasks WHERE family_code = ? AND status = ?').bind(fc, 'active').first('c'),
        env.DB.prepare('SELECT COUNT(*) as c FROM submissions s JOIN users u ON s.child_id = u.id WHERE u.family_code = ? AND s.status = ?').bind(fc, 'pending').first('c'),
        env.DB.prepare('SELECT COUNT(*) as c FROM submissions s JOIN users u ON s.child_id = u.id WHERE u.family_code = ? AND s.status = ?').bind(fc, 'approved').first('c'),
        env.DB.prepare('SELECT COUNT(*) as c FROM submissions s JOIN users u ON s.child_id = u.id WHERE u.family_code = ?').bind(fc).first('c'),
        env.DB.prepare('SELECT COUNT(*) as c FROM redemptions r JOIN users u ON r.child_id = u.id WHERE u.family_code = ? AND r.status = ?').bind(fc, 'pending').first('c')
    ]);

    const completionRate = totalSubs > 0 ? Math.round((approvedSubs / totalSubs) * 100) : 0;

    return jsonResponse({
        totalTasks: taskCount,
        totalSubmissions: totalSubs,
        pendingReview: pendingSubs,
        approved: approvedSubs,
        completionRate,
        pendingRedemptions: pendingReds
    }, env);
}
