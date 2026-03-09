import { describe, expect, it } from 'vitest';

import { isJwtExpired, parseJwtPayload } from '../src/utils/session.js';

function encodeBase64Url(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createToken(payload) {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('session utils', () => {
  it('parses a jwt payload', () => {
    const token = createToken({ sub: 'user-1', exp: 1760000000 });

    expect(parseJwtPayload(token)).toEqual({ sub: 'user-1', exp: 1760000000 });
  });

  it('treats expired tokens as logged out', () => {
    const token = createToken({ exp: Math.floor(Date.now() / 1000) - 5 });

    expect(isJwtExpired(token)).toBe(true);
  });

  it('keeps valid tokens active', () => {
    const token = createToken({ exp: Math.floor(Date.now() / 1000) + 3600 });

    expect(isJwtExpired(token)).toBe(false);
  });
});
