// ========================================
// API 客户端封装
// ========================================

const API_BASE = '/api';

class ApiClient {
    constructor() {
        this.token = sessionStorage.getItem('auth_token') || null;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            sessionStorage.setItem('auth_token', token);
        } else {
            sessionStorage.removeItem('auth_token');
        }
    }

    async request(endpoint, options = {}) {
        const headers = { ...options.headers };

        // 自动附加 Token
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        // 默认 JSON 处理
        let body = options.body;
        if (body && !(body instanceof FormData) && typeof body === 'object') {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers,
                body,
            });

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || '请求失败');
                return data;
            }

            if (!response.ok) throw new Error(response.statusText);
            return response;
        } catch (err) {
            console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, err);
            return { error: err.message };
        }
    }

    get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
    post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: data }); }
    patch(endpoint, data) { return this.request(endpoint, { method: 'PATCH', body: data }); }
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }

    // 图片上传使用 FormData
    uploadPhoto(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request('/photos/upload', {
            method: 'POST',
            body: formData
        });
    }
}

export const api = new ApiClient();
