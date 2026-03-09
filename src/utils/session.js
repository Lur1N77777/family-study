function decodeBase64UrlSegment(value) {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (normalized.length % 4 || 4)) % 4;
    const padded = normalized + '='.repeat(padding);

    if (typeof atob === 'function') {
        return decodeURIComponent(
            Array.from(atob(padded), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
        );
    }

    return Buffer.from(padded, 'base64').toString('utf8');
}

export function parseJwtPayload(token) {
    try {
        const parts = String(token || '').split('.');
        if (parts.length !== 3 || !parts[1]) {
            return null;
        }

        return JSON.parse(decodeBase64UrlSegment(parts[1]));
    } catch {
        return null;
    }
}

export function isJwtExpired(token, now = Date.now(), clockSkewSeconds = 30) {
    const payload = parseJwtPayload(token);
    if (!payload?.exp) {
        return false;
    }

    return payload.exp * 1000 <= now + clockSkewSeconds * 1000;
}
