// ========================================
// JWT 工具
// ========================================

// 简单的uid生成函数
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const SECRET = process.env.JWT_SECRET || 'family-study-secret-2024';

export async function signJWT(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Date.now();
    const claims = { ...payload, iat: now, exp: now + 30 * 24 * 60 * 60 * 1000 }; // 30天
    const body = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const signature = await hmacSha256(`${header}.${body}`, SECRET);
    return `${header}.${body}.${signature}`;
}

export async function verifyJWT(token) {
    try {
        const [header, body, signature] = token.split('.');
        const expectedSig = await hmacSha256(`${header}.${body}`, SECRET);
        if (signature !== expectedSig) return null;

        const claims = JSON.parse(Buffer.from(body, 'base64url').toString());
        if (claims.exp < Date.now()) return null;
        return claims;
    } catch {
        return null;
    }
}

async function hmacSha256(message, key) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
        'raw', keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false, ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
