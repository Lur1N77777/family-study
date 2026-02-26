// ========================================
// JWT 工具（适配 Cloudflare Workers）
// ========================================

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Base64 URL 编码工具
function base64UrlEncode(str) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return atob(str);
}

// HMAC SHA-256 签名
async function hmacSign(message, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw', encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return base64UrlEncode(String.fromCharCode(...new Uint8Array(sig)));
}

// 生成 JWT
export async function signJWT(payload, secret, expiresIn = 86400 * 7) {
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const body = base64UrlEncode(JSON.stringify({
        ...payload,
        iat: now,
        exp: now + expiresIn,
    }));
    const signature = await hmacSign(`${header}.${body}`, secret);
    return `${header}.${body}.${signature}`;
}

// 验证 JWT
export async function verifyJWT(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [header, body, signature] = parts;
        const expected = await hmacSign(`${header}.${body}`, secret);
        if (signature !== expected) return null;

        const payload = JSON.parse(base64UrlDecode(body));
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

        return payload;
    } catch {
        return null;
    }
}

export { uid };
