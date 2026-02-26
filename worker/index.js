// ========================================
// Cloudflare Worker — API 入口
// ========================================

import { handleAuth } from './routes/auth.js';
import { handleTasks } from './routes/tasks.js';
import { handleSubmissions } from './routes/submissions.js';
import { handleProducts } from './routes/products.js';
import { handleRedemptions } from './routes/redemptions.js';
import { handlePhotos } from './routes/photos.js';
import { handleStats } from './routes/stats.js';
import { verifyJWT } from './utils/jwt.js';
import { corsHeaders, jsonResponse, errorResponse } from './utils/response.js';

export default {
    async fetch(request, env, ctx) {
        // 处理 CORS 预检
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(env) });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        // 非 API 路径 → 交给 Pages 处理静态文件
        if (!path.startsWith('/api/')) {
            return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not Found', { status: 404 });
        }

        try {
            // 公开路由（不需要认证）
            if (path.startsWith('/api/auth/')) {
                return await handleAuth(request, env, path);
            }

            // 需认证的路由
            const authHeader = request.headers.get('Authorization');
            if (!authHeader?.startsWith('Bearer ')) {
                return errorResponse('未登录', 401, env);
            }

            const token = authHeader.slice(7);
            const user = await verifyJWT(token, env.JWT_SECRET);
            if (!user) {
                return errorResponse('登录已过期', 401, env);
            }

            // 路由分发
            if (path.startsWith('/api/tasks')) return await handleTasks(request, env, user, path);
            if (path.startsWith('/api/submissions')) return await handleSubmissions(request, env, user, path);
            if (path.startsWith('/api/products')) return await handleProducts(request, env, user, path);
            if (path.startsWith('/api/redemptions')) return await handleRedemptions(request, env, user, path);
            if (path.startsWith('/api/photos')) return await handlePhotos(request, env, user, path);
            if (path.startsWith('/api/stats')) return await handleStats(request, env, user, path);
            if (path === '/api/users/family') return await handleFamilyUsers(request, env, user);
            if (path === '/api/activity') return await handleActivity(request, env, user);

            return errorResponse('接口不存在', 404, env);
        } catch (err) {
            console.error('API Error:', err);
            return errorResponse('服务器错误: ' + err.message, 500, env);
        }
    }
};

// 获取家庭成员
async function handleFamilyUsers(request, env, user) {
    const { results } = await env.DB.prepare(
        'SELECT id, username, role, avatar, points, created_at FROM users WHERE family_code = ?'
    ).bind(user.familyCode).all();
    return jsonResponse(results, env);
}

// 获取活动日志
async function handleActivity(request, env, user) {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const { results } = await env.DB.prepare(
        'SELECT * FROM activity_log WHERE family_code = ? ORDER BY timestamp DESC LIMIT ?'
    ).bind(user.familyCode, limit).all();
    return jsonResponse(results, env);
}
