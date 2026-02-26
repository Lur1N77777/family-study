// ========================================
// Vercel Serverless API 入口
// ========================================

import { handleAuth } from './auth.js';
import { handleTasks } from './tasks.js';
import { handleSubmissions } from './submissions.js';
import { handleProducts } from './products.js';
import { handleRedemptions } from './redemptions.js';
import { handlePhotos } from './photos.js';
import { handleStats } from './stats.js';
import { verifyJWT } from './jwt.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    const url = new URL(req.url);
    const path = url.pathname;

    // 公开路由
    if (path.startsWith('/api/auth/')) {
        return handleAuth(req, res, path);
    }

    // 需要认证的路由
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未登录' });
    }

    const token = authHeader.slice(7);
    const user = await verifyJWT(token);
    if (!user) {
        return res.status(401).json({ error: '登录已过期' });
    }

    // 路由分发
    try {
        if (path.startsWith('/api/tasks')) return handleTasks(req, res, user, path);
        if (path.startsWith('/api/submissions')) return handleSubmissions(req, res, user, path);
        if (path.startsWith('/api/products')) return handleProducts(req, res, user, path);
        if (path.startsWith('/api/redemptions')) return handleRedemptions(req, res, user, path);
        if (path.startsWith('/api/photos')) return handlePhotos(req, res, user, path);
        if (path.startsWith('/api/stats')) return handleStats(req, res, user, path);
        if (path === '/api/users/family') return handleFamilyUsers(req, res, user);
        if (path === '/api/activity') return handleActivity(req, res, user);

        return res.status(404).json({ error: '接口不存在' });
    } catch (err) {
        console.error('API Error:', err);
        return res.status(500).json({ error: '服务器错误: ' + err.message });
    }
}

// 获取家庭成员
async function handleFamilyUsers(req, res, user) {
    const { kv } = await import('@vercel/kv');
    const users = await kv.hgetall(`family:${user.familyCode}:users`) || {};
    const userList = Object.values(users);
    return res.json(userList);
}

// 获取活动日志
async function handleActivity(req, res, user) {
    const { kv } = await import('@vercel/kv');
    const limit = parseInt(new URL(req.url).searchParams.get('limit') || '20');
    const activities = await kv.lrange(`family:${user.familyCode}:activity`, 0, limit - 1);
    return res.json(activities || []);
}
