import { describe, expect, it } from 'vitest';

import { shouldRetryRequest } from '../src/utils/request-policy.js';

describe('request retry policy', () => {
  it('retries the first transient GET failure', () => {
    expect(shouldRetryRequest('GET', 503, 0)).toBe(true);
    expect(shouldRetryRequest('GET', 0, 0)).toBe(true);
  });

  it('does not retry non-idempotent requests', () => {
    expect(shouldRetryRequest('POST', 503, 0)).toBe(false);
  });

  it('does not retry beyond the first attempt', () => {
    expect(shouldRetryRequest('GET', 503, 1)).toBe(false);
  });
});
