// ========================================
// API client
// ========================================

import { shouldRetryRequest } from './request-policy.js';

const API_BASE = '/api';
const TOKEN_KEY = 'auth_token';
const REQUEST_TIMEOUT_MS = 12000;

function safeStorageGet(key) {
    try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
        return null;
    }
}

function safeStorageSet(key, value) {
    try {
        if (typeof localStorage === 'undefined') return;
        if (value == null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, value);
        }
    } catch {
        // Ignore storage failures.
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(resource, init, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(resource, {
            ...init,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timer);
    }
}

async function parseResponseBody(response) {
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }
    if (contentType.startsWith('text/')) {
        return response.text();
    }
    if (!contentType) {
        return null;
    }

    return response;
}

function notifyAuthExpired(message, status) {
    if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
        return;
    }

    window.dispatchEvent(new CustomEvent('app:auth-expired', {
        detail: { message, status }
    }));
}

export class ApiError extends Error {
    constructor(message, { status = 0, response = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.response = response;
    }
}

function toApiError(error, fallbackMessage = '请求失败，请稍后重试') {
    if (error instanceof ApiError) {
        return error;
    }

    if (error?.name === 'AbortError') {
        return new ApiError('请求超时，请稍后重试', { status: 408 });
    }

    return new ApiError(error?.message || fallbackMessage);
}

function normalizeMethod(method) {
    return String(method || 'GET').toUpperCase();
}

class ApiClient {
    constructor() {
        this.token = safeStorageGet(TOKEN_KEY);
        this._authFailureNotified = false;
    }

    setToken(token) {
        this.token = token;
        this._authFailureNotified = false;
        safeStorageSet(TOKEN_KEY, token || null);
    }

    handleAuthFailure(message, status) {
        if (this._authFailureNotified) {
            return;
        }

        this._authFailureNotified = true;
        notifyAuthExpired(message, status);
    }

    async request(endpoint, options = {}) {
        const method = normalizeMethod(options.method);
        const headers = new Headers(options.headers || {});

        if (this.token) {
            headers.set('Authorization', `Bearer ${this.token}`);
        }

        let body = options.body;
        if (body && !(body instanceof FormData) && typeof body === 'object') {
            headers.set('Content-Type', 'application/json');
            body = JSON.stringify(body);
        }

        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
                    ...options,
                    method,
                    headers,
                    body,
                }, REQUEST_TIMEOUT_MS);

                const data = await parseResponseBody(response);
                if (!response.ok) {
                    const message = typeof data === 'object' && data?.error
                        ? data.error
                        : typeof data === 'string' && data.trim()
                            ? data
                            : response.statusText || '请求失败，请稍后重试';
                    const error = new ApiError(message, { status: response.status, response });

                    if (response.status === 401) {
                        this.handleAuthFailure(message, response.status);
                    }

                    if (shouldRetryRequest(method, response.status, attempt)) {
                        await sleep(250);
                        continue;
                    }

                    throw error;
                }

                return data instanceof Response ? data : data;
            } catch (rawError) {
                const error = toApiError(rawError);

                if (error.status === 401) {
                    this.handleAuthFailure(error.message, error.status);
                }

                if (shouldRetryRequest(method, error.status, attempt)) {
                    await sleep(250);
                    continue;
                }

                console.error(`API Error [${method} ${endpoint}]`, error);
                throw error;
            }
        }

        throw new ApiError('请求失败，请稍后重试');
    }

    get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
    post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: data }); }
    patch(endpoint, data) { return this.request(endpoint, { method: 'PATCH', body: data }); }
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }

    uploadPhoto(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request('/photos/upload', {
            method: 'POST',
            body: formData
        });
    }

    uploadMultiplePhotos(files) {
        const formData = new FormData();
        files.forEach((file, i) => {
            formData.append(`file${i}`, file);
        });
        return this.request('/photos/upload-multi', {
            method: 'POST',
            body: formData
        });
    }
}

export const api = new ApiClient();
