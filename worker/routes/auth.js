// ========================================
// 认证路由 — /api/auth/*
// ========================================

import { signJWT, uid } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

function generateFamilyCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function handleAuth(request, env, path) {
    if (request.method !== 'POST') return errorResponse('Method Not Allowed', 405, env);
    const body = await request.json();

    if (path === '/api/auth/register') return register(body, env);
    if (path === '/api/auth/login') return login(body, env);
    return errorResponse('Not Found', 404, env);
}

async function register({ username, password, role, familyCode, joinExisting }, env) {
    if (!username || !password || !role) return errorResponse('请填写完整信息', 400, env);

    // 检查用户名唯一
    const exists = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (exists) return errorResponse('用户名已存在', 400, env);

    // 家庭码逻辑
    if (role === 'child' || (role === 'parent' && joinExisting)) {
        if (!familyCode) return errorResponse('请输入家庭码', 400, env);
        const familyExists = await env.DB.prepare('SELECT id FROM users WHERE family_code = ? LIMIT 1').bind(familyCode).first();
        if (!familyExists) return errorResponse('家庭码无效', 400, env);
    }
    if (role === 'parent' && !joinExisting) {
        familyCode = generateFamilyCode();
    }

    // 选头像
    const avatarMap = { parent: ['👨', '👩', '🧑', '👴', '👵'], child: ['👦', '👧', '🧒'] };
    const { results: sameRole } = await env.DB.prepare(
        'SELECT id FROM users WHERE role = ? AND family_code = ?'
    ).bind(role, familyCode).all();
    const avatar = avatarMap[role]?.[sameRole.length % avatarMap[role].length] || '👦';

    const id = uid();
    await env.DB.prepare(
        'INSERT INTO users (id, username, password_hash, role, family_code, avatar, points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, username, password, role, familyCode, avatar, role === 'child' ? 0 : 0, Date.now()).run();

    const user = { id, username, role, familyCode, avatar, points: 0 };
    const token = await signJWT(user, env.JWT_SECRET);

    return jsonResponse({ user, token, familyCode }, env);
}

async function login({ username, password }, env) {
    if (!username || !password) return errorResponse('请填写完整', 400, env);

    const user = await env.DB.prepare(
        'SELECT id, username, password_hash, role, family_code, avatar, points FROM users WHERE username = ?'
    ).bind(username).first();

    if (!user || user.password_hash !== password) return errorResponse('用户名或密码错误', 400, env);

    const payload = { id: user.id, username: user.username, role: user.role, familyCode: user.family_code, avatar: user.avatar };
    const token = await signJWT(payload, env.JWT_SECRET);

    return jsonResponse({
        user: { ...payload, points: user.points },
        token,
    }, env);
}
