// ========================================
// App data store
// ========================================

import { api } from './api.js';
import { sanitizeEmoji } from './emoji.js';

function normalizeSubmission(item) {
    if (!item || typeof item !== 'object') {
        return item;
    }

    return {
        ...item,
        taskId: item.taskId || item.task_id || null,
        childId: item.childId || item.child_id || null,
        childName: item.childName || item.child_name || '',
        childAvatar: item.childAvatar || item.child_avatar || '',
        taskTitle: item.taskTitle || item.task_title || '',
        taskPoints: item.taskPoints ?? item.task_points ?? 0,
        photoKey: item.photoKey || item.photo_key || null,
        submissionText: item.submissionText || item.submission_text || '',
        photoCount: item.photoCount ?? item.photo_count ?? 0,
        photoAccessStatus: item.photoAccessStatus || item.photo_access_status || 'none',
        photoAvailableUntil: item.photoAvailableUntil || item.photo_available_until || null,
        reviewPhotoAvailable: Boolean(item.reviewPhotoAvailable ?? item.review_photo_available),
        pendingPhotoAvailable: Boolean(item.pendingPhotoAvailable ?? item.pending_photo_available),
        reviewPhotoExpiresAt: item.reviewPhotoExpiresAt || item.review_photo_expires_at || null,
        photoClearedAt: item.photoClearedAt || item.photo_cleared_at || null,
        createdAt: item.createdAt || item.created_at || null,
        reviewedAt: item.reviewedAt || item.reviewed_at || null,
        rejectReason: item.rejectReason || item.reject_reason || '',
        childAvatar: sanitizeEmoji(item.childAvatar || item.child_avatar || '', '🙂'),
    };
}

function normalizeRedemption(item) {
    if (!item || typeof item !== 'object') {
        return item;
    }

    return {
        ...item,
        productId: item.productId || item.product_id || null,
        childId: item.childId || item.child_id || null,
        productName: item.productName || item.product_name || '',
        productEmoji: sanitizeEmoji(item.productEmoji || item.product_emoji || '', '🎁'),
        createdAt: item.createdAt || item.created_at || null,
    };
}

function normalizeProduct(item) {
    if (!item || typeof item !== 'object') {
        return item;
    }

    return {
        ...item,
        emoji: sanitizeEmoji(item.emoji, '🎁'),
    };
}

function normalizeFamilyUser(item) {
    if (!item || typeof item !== 'object') {
        return item;
    }

    return {
        ...item,
        avatar: sanitizeEmoji(item.avatar, item.role === 'parent' ? '🧑' : '🙂'),
    };
}

function normalizeTask(item) {
    if (!item || typeof item !== 'object') {
        return item;
    }

    const targetChildrenStatuses = Array.isArray(item.target_children_statuses)
        ? item.target_children_statuses.map((child) => ({
            ...child,
            child_avatar: sanitizeEmoji(child?.child_avatar, '🙂'),
        }))
        : item.target_children_statuses;

    return {
        ...item,
        target_children_statuses: targetChildrenStatuses,
    };
}

class Store {
    constructor() {
        this.listeners = new Map();
        this._cache = {};
        this._inflight = new Map();
        this._cacheTTL = 15000;
    }

    on(key, fn) {
        if (!this.listeners.has(key)) this.listeners.set(key, []);
        this.listeners.get(key).push(fn);
        return () => {
            const arr = this.listeners.get(key);
            const idx = arr.indexOf(fn);
            if (idx > -1) arr.splice(idx, 1);
        };
    }

    emit(key, data = null) {
        const fns = this.listeners.get(key) || [];
        fns.forEach((fn) => fn(data));
    }

    getCachedValue(key) {
        const entry = this._cache[key];
        if (!entry) {
            return null;
        }

        if (Date.now() - entry.time > entry.ttl) {
            delete this._cache[key];
            return null;
        }

        return entry.data;
    }

    setCachedValue(key, data, ttl = this._cacheTTL) {
        this._cache[key] = {
            data,
            ttl,
            time: Date.now(),
        };
    }

    async fetchShared(key, loader, { ttl = 0 } = {}) {
        const cached = ttl > 0 ? this.getCachedValue(key) : null;
        if (cached !== null) {
            return cached;
        }

        if (this._inflight.has(key)) {
            return this._inflight.get(key);
        }

        const promise = (async () => {
            try {
                const data = await loader();
                if (ttl > 0) {
                    this.setCachedValue(key, data, ttl);
                }
                return data;
            } finally {
                this._inflight.delete(key);
            }
        })();

        this._inflight.set(key, promise);
        return promise;
    }

    invalidateCache(key) {
        if (!key) {
            this._cache = {};
            this._inflight.clear();
            return;
        }

        Object.keys(this._cache).forEach((cacheKey) => {
            if (cacheKey === key || cacheKey.startsWith(`${key}:`)) {
                delete this._cache[cacheKey];
            }
        });

        Array.from(this._inflight.keys()).forEach((cacheKey) => {
            if (cacheKey === key || cacheKey.startsWith(`${key}:`)) {
                this._inflight.delete(cacheKey);
            }
        });
    }

    invalidateCaches(keys = []) {
        keys.forEach((key) => this.invalidateCache(key));
    }

    async getTasks() {
        return this.fetchShared(
            'tasks',
            async () => {
                const data = await api.get('/tasks');
                return Array.isArray(data) ? data.map(normalizeTask) : [];
            },
            { ttl: 10000 }
        );
    }

    async createTask(task) {
        const res = await api.post('/tasks', task);
        this.invalidateCaches(['tasks', 'stats', 'activity']);
        this.emit('tasks');
        return res;
    }

    async updateTask(taskId, updates) {
        const res = await api.patch(`/tasks/${taskId}`, updates);
        this.invalidateCaches(['tasks', 'stats', 'activity']);
        this.emit('tasks');
        return res;
    }

    async refreshUserPoints(userId) {
        const users = await this.getFamilyUsers();
        const user = users.find((item) => item.id === userId);
        return user?.points || 0;
    }

    async deleteTask(taskId) {
        const res = await api.delete(`/tasks/${taskId}`);
        this.invalidateCaches(['tasks', 'submissions', 'stats', 'activity']);
        this.emit('tasks');
        return res;
    }

    async submitTask(taskId, payload = {}) {
        const body = {
            taskId,
            ...payload,
        };
        const res = await api.post('/submissions', body);
        this.invalidateCaches(['submissions', 'tasks', 'activity']);
        this.emit('submissions');
        return res;
    }

    async getSubmissions(status = null, childId = null) {
        const query = [];
        if (status) query.push(`status=${status}`);
        if (childId) query.push(`childId=${childId}`);
        const qs = query.length ? `?${query.join('&')}` : '';
        return this.fetchShared(
            `submissions:${status || 'all'}:${childId || 'all'}`,
            async () => {
                const data = await api.get(`/submissions${qs}`);
                return Array.isArray(data) ? data.map(normalizeSubmission) : [];
            },
            { ttl: 5000 }
        );
    }

    async approveSubmission(submissionId) {
        const res = await api.patch(`/submissions/${submissionId}`, { action: 'approve' });
        this.invalidateCaches(['submissions', 'familyUsers', 'stats', 'activity']);
        this.emit('submissions');
        return res;
    }

    async rejectSubmission(submissionId, reason) {
        const res = await api.patch(`/submissions/${submissionId}`, { action: 'reject', reason });
        this.invalidateCaches(['submissions', 'activity']);
        this.emit('submissions');
        return res;
    }

    async getProducts() {
        return this.fetchShared(
            'products',
            async () => {
                const data = await api.get('/products');
                return Array.isArray(data) ? data.map(normalizeProduct) : [];
            },
            { ttl: 20000 }
        );
    }

    async createProduct(product) {
        const res = await api.post('/products', product);
        this.invalidateCaches(['products', 'activity']);
        this.emit('products');
        return res;
    }

    async updateProduct(productId, updates) {
        const res = await api.patch(`/products/${productId}`, updates);
        this.invalidateCaches(['products', 'activity']);
        this.emit('products');
        return res;
    }

    async deleteProduct(productId) {
        const res = await api.delete(`/products/${productId}`);
        this.invalidateCaches(['products', 'activity']);
        this.emit('products');
        return res;
    }

    async redeemProduct(productId) {
        const res = await api.post('/redemptions', { productId });
        this.invalidateCaches(['redemptions', 'familyUsers', 'stats', 'activity']);
        this.emit('redemptions');
        return res;
    }

    async getRedemptions(status = null) {
        const qs = status ? `?status=${status}` : '';
        return this.fetchShared(
            `redemptions:${status || 'all'}`,
            async () => {
                const data = await api.get(`/redemptions${qs}`);
                return Array.isArray(data) ? data.map(normalizeRedemption) : [];
            },
            { ttl: 5000 }
        );
    }

    async confirmRedemption(redemptionId) {
        const res = await api.patch(`/redemptions/${redemptionId}`, {});
        this.invalidateCaches(['redemptions', 'stats', 'activity']);
        this.emit('redemptions');
        return res;
    }

    async getStats() {
        return this.fetchShared('stats', () => api.get('/stats'), { ttl: 10000 });
    }

    async getActivityLog(limit = 20) {
        return this.fetchShared(`activity:${limit}`, () => api.get(`/activity?limit=${limit}`), { ttl: 5000 });
    }

    async getFamilyUsers() {
        return this.fetchShared(
            'familyUsers',
            async () => {
                const data = await api.get('/users/family');
                return Array.isArray(data) ? data.map(normalizeFamilyUser) : [];
            },
            { ttl: 15000 }
        );
    }

    async getFamilyChildren(familyCode) {
        const users = await this.getFamilyUsers();
        return users.filter((user) => user.role === 'child');
    }

    async getChildPoints(childId) {
        const users = await this.getFamilyUsers();
        const user = users.find((item) => item.id === childId);
        return user?.points || 0;
    }

    async getChildSubmissions(childId) {
        return this.getSubmissions(null, childId);
    }

    async getUser(userId) {
        const users = await this.getFamilyUsers();
        return users.find((user) => user.id === userId);
    }

    async getTaskById(taskId) {
        const tasks = await this.getTasks();
        return tasks.find((task) => task.id === taskId);
    }

    async getNotificationTemplates() {
        return this.fetchShared('notificationTemplates', () => api.get('/notifications/templates'), { ttl: 60000 });
    }

    async sendNotification(childId, title, message, type) {
        return api.post('/notifications', { childId, title, message, type });
    }

    async broadcastNotification(title, message, type, childIds) {
        return api.post('/notifications/broadcast', { title, message, type, childIds });
    }

    async getNotifications(since = 0) {
        return api.get(`/notifications?since=${since}`);
    }

    async markNotificationRead(notifId) {
        return api.patch(`/notifications/${notifId}`);
    }

    async resetData() {
        throw new Error('当前云端版本暂不支持一键重置全部家庭数据。');
    }
}

function generateFamilyCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const store = new Store();
export { generateFamilyCode };
