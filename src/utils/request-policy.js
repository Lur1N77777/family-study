const RETRYABLE_STATUSES = new Set([0, 408, 425, 429, 500, 502, 503, 504]);

export function shouldRetryRequest(method, status, attempt = 0) {
    if (attempt > 0) {
        return false;
    }

    return String(method || 'GET').toUpperCase() === 'GET' && RETRYABLE_STATUSES.has(Number(status) || 0);
}
