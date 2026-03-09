// ========================================
// Cloudflare Worker - API 入口
// ========================================

import { handleAuth } from './routes/auth.js';
import { handleTasks } from './routes/tasks.js';
import { handleSubmissions } from './routes/submissions.js';
import { handleProducts } from './routes/products.js';
import { handleRedemptions } from './routes/redemptions.js';
import { handlePhotos } from './routes/photos.js';
import { handleStats } from './routes/stats.js';
import { handleNotifications } from './routes/notifications.js';
import { verifyJWT } from './utils/jwt.js';
import { corsHeaders, jsonResponse, errorResponse } from './utils/response.js';
import { applyOverduePenalties } from './utils/task-penalties.js';
import { purgeExpiredReviewedPhotos } from './utils/photo-retention.js';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (!path.startsWith('/api/')) {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not Found', { status: 404 });
    }

    try {
      if (path.startsWith('/api/auth/')) {
        return await handleAuth(request, env, path);
      }

      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse('未登录', 401, env);
      }

      const token = authHeader.slice(7);
      const user = await verifyJWT(token, env.JWT_SECRET);
      if (!user) {
        return errorResponse('登录已过期', 401, env);
      }

      if (path.startsWith('/api/tasks')) return await handleTasks(request, env, user, path);
      if (path.startsWith('/api/submissions')) return await handleSubmissions(request, env, user, path);
      if (path.startsWith('/api/products')) return await handleProducts(request, env, user, path);
      if (path.startsWith('/api/redemptions')) return await handleRedemptions(request, env, user, path);
      if (path.startsWith('/api/photos')) return await handlePhotos(request, env, user, path);
      if (path.startsWith('/api/stats')) return await handleStats(request, env, user, path);
      if (path.startsWith('/api/notifications')) return await handleNotifications(request, env, user, path);
      if (path === '/api/users/family') return await handleFamilyUsers(env, user);
      if (path === '/api/activity') return await handleActivity(request, env, user);
      if (path === '/api/users/avatar') return await handleAvatarUpdate(request, env, user);

      return errorResponse('接口不存在', 404, env);
    } catch (error) {
      console.error('API Error:', error);
      return errorResponse(`服务器错误: ${error.message}`, 500, env);
    }
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runScheduledJobs(controller, env));
  }
};

async function handleFamilyUsers(env, user) {
  const { results } = await env.DB.prepare(
    'SELECT id, username, role, avatar, points, created_at FROM users WHERE family_code = ?'
  ).bind(user.familyCode).all();
  return jsonResponse(results, env);
}

async function handleActivity(request, env, user) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const { results } = await env.DB.prepare(
    'SELECT * FROM activity_log WHERE family_code = ? ORDER BY timestamp DESC LIMIT ?'
  ).bind(user.familyCode, limit).all();
  return jsonResponse(results, env);
}

async function handleAvatarUpdate(request, env, user) {
  if (request.method !== 'PATCH') return errorResponse('Method Not Allowed', 405, env);

  const { avatar } = await request.json();
  if (!avatar || avatar.length > 10) {
    return errorResponse('头像格式无效', 400, env);
  }

  await env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(avatar, user.id).run();
  return jsonResponse({ success: true, avatar }, env);
}

async function runScheduledJobs(controller, env) {
  const scheduledTime = controller?.scheduledTime || Date.now();
  const [penaltyResult, photoCleanupResult] = await Promise.all([
    applyOverduePenalties(env, scheduledTime),
    purgeExpiredReviewedPhotos(env, scheduledTime),
  ]);

  console.log('Penalty cron finished', JSON.stringify(penaltyResult));
  console.log('Photo cleanup cron finished', JSON.stringify(photoCleanupResult));
}
