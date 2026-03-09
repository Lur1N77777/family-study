// ========================================
// 认证路由 — /api/auth/*
// ========================================

import { signJWT, uid } from '../utils/jwt.js';
import { jsonResponse, errorResponse } from '../utils/response.js';

function generateFamilyCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// SHA-256 密码哈希
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    // 密码哈希后存储
    const passwordHash = await hashPassword(password);

    const id = uid();
    await env.DB.prepare(
        'INSERT INTO users (id, username, password_hash, role, family_code, avatar, points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, username, passwordHash, role, familyCode, avatar, 0, Date.now()).run();

    const user = { id, username, role, familyCode, avatar, points: 0 };
    const token = await signJWT(user, env.JWT_SECRET);

    return jsonResponse({ user, token, familyCode }, env);
}

async function login({ username, password }, env) {
    if (!username || !password) return errorResponse('请填写完整', 400, env);

    const user = await env.DB.prepare(
        'SELECT id, username, password_hash, role, family_code, avatar, points FROM users WHERE username = ?'
    ).bind(username).first();

    if (!user) return errorResponse('用户名或密码错误', 400, env);

    // 密码验证：先尝试哈希比对，再兼容旧明文密码
    const inputHash = await hashPassword(password);
    const passwordMatch = (user.password_hash === inputHash) || (user.password_hash === password);

    if (!passwordMatch) return errorResponse('用户名或密码错误', 400, env);

    // 如果是旧明文密码匹配成功，自动迁移为哈希存储
    if (user.password_hash === password && user.password_hash !== inputHash) {
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            .bind(inputHash, user.id).run();
    }

    const payload = { id: user.id, username: user.username, role: user.role, familyCode: user.family_code, avatar: user.avatar };
    const token = await signJWT(payload, env.JWT_SECRET);

    return jsonResponse({
        user: { ...payload, points: user.points },
        token,
    }, env);
}
