// ========================================
// 认证 API — /api/auth/*
// ========================================

import { signJWT, uid } from './jwt.js';

function generateFamilyCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function handleAuth(req, res, path) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const body = req.body || {};
    if (path === '/api/auth/register') return register(body, res);
    if (path === '/api/auth/login') return login(body, res);
    if (path === '/api/auth/status') return status(req, res);
    return res.status(404).json({ error: 'Not Found' });
}

async function register({ username, password, role, familyCode, joinExisting }, res) {
    if (!username || !password || !role) {
        return res.status(400).json({ error: '请填写完整信息' });
    }

    const { kv } = await import('@vercel/kv');

    // 检查用户名唯一
    const existingUser = await kv.get(`user:${username}`);
    if (existingUser) {
        return res.status(400).json({ error: '用户名已存在' });
    }

    // 家庭码逻辑
    if (role === 'child' || (role === 'parent' && joinExisting)) {
        if (!familyCode) {
            return res.status(400).json({ error: '请输入家庭码' });
        }
        const familyUsers = await kv.hgetall(`family:${familyCode}:users`);
        if (!familyUsers || Object.keys(familyUsers).length === 0) {
            return res.status(400).json({ error: '家庭码无效' });
        }
    }
    if (role === 'parent' && !joinExisting) {
        familyCode = generateFamilyCode();
    }

    // 选头像
    const avatarMap = { parent: ['👨', '👩', '🧑', '👴', '👵'], child: ['👦', '👧', '🧒'] };
    const familyUsers = (await kv.hgetall(`family:${familyCode}:users`)) || {};
    const sameRoleUsers = Object.values(familyUsers).filter(u => u.role === role);
    const avatar = avatarMap[role]?.[sameRoleUsers.length % avatarMap[role].length] || '👦';

    const id = uid();
    const user = {
        id,
        username,
        password,
        role,
        familyCode,
        avatar,
        points: 0,
        createdAt: Date.now()
    };

    // 存储用户
    await kv.set(`user:${username}`, user);
    await kv.hset(`family:${familyCode}:users`, { [id]: user });

    const token = await signJWT({
        id: user.id,
        username: user.username,
        role: user.role,
        familyCode: user.familyCode,
        avatar: user.avatar,
        points: user.points
    });

    return res.json({ user, token, familyCode });
}

async function login({ username, password }, res) {
    if (!username || !password) {
        return res.status(400).json({ error: '请填写完整' });
    }

    const { kv } = await import('@vercel/kv');
    const user = await kv.get(`user:${username}`);

    if (!user || user.password !== password) {
        return res.status(400).json({ error: '用户名或密码错误' });
    }

    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        familyCode: user.familyCode,
        avatar: user.avatar,
        points: user.points
    };
    const token = await signJWT(payload);

    return res.json({ user: payload, token });
}

async function status(req, res) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return res.json({ loggedIn: false });
    }

    const token = authHeader.slice(7);
    const user = await verifyJWT(token);

    if (!user) {
        return res.json({ loggedIn: false });
    }

    return res.json({ loggedIn: true, user });
}

async function verifyJWT(token) {
    const { kv } = await import('@vercel/kv');
    try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        return payload;
    } catch {
        return null;
    }
}
