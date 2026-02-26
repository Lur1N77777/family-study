// ========================================
// 状态管理 (连接 Cloudflare API)
// ========================================

import { api } from './api.js';

class Store {
    constructor() {
        this.listeners = new Map();
    }

    // 订阅变更 (UI 可选，主要用于跨组件通信)
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
        fns.forEach(fn => fn(data));
    }

    // ── 任务操作 ──

    async getTasks() {
        const res = await api.get('/tasks');
        return res.error ? [] : res;
    }

    async createTask(task) {
        const res = await api.post('/tasks', task);
        if (!res.error) this.emit('tasks');
        return res;
    }

    async updateTask(taskId, updates) {
        const res = await api.patch(`/tasks/${taskId}`, updates);
        if (!res.error) this.emit('tasks');
        return res;
    }

    async deleteTask(taskId) {
        const res = await api.delete(`/tasks/${taskId}`);
        if (!res.error) this.emit('tasks');
        return res;
    }

    // ── 提交操作 ──

    async submitTask(taskId, photoKey) {
        const res = await api.post('/submissions', { taskId, photoKey });
        if (!res.error) this.emit('submissions');
        return res;
    }

    async getSubmissions(status = null, childId = null) {
        let q = [];
        if (status) q.push(`status=${status}`);
        if (childId) q.push(`childId=${childId}`);
        const qs = q.length ? '?' + q.join('&') : '';

        const res = await api.get(`/submissions${qs}`);
        return res.error ? [] : res;
    }

    async approveSubmission(submissionId) {
        const res = await api.patch(`/submissions/${submissionId}`, { action: 'approve' });
        if (!res.error) this.emit('submissions');
        return res;
    }

    async rejectSubmission(submissionId, reason) {
        const res = await api.patch(`/submissions/${submissionId}`, { action: 'reject', reason });
        if (!res.error) this.emit('submissions');
        return res;
    }

    // ── 商品操作 ──

    async getProducts() {
        const res = await api.get('/products');
        return res.error ? [] : res;
    }

    async createProduct(product) {
        const res = await api.post('/products', product);
        if (!res.error) this.emit('products');
        return res;
    }

    async updateProduct(productId, updates) {
        const res = await api.patch(`/products/${productId}`, updates);
        if (!res.error) this.emit('products');
        return res;
    }

    async deleteProduct(productId) {
        const res = await api.delete(`/products/${productId}`);
        if (!res.error) this.emit('products');
        return res;
    }

    // ── 兑换操作 ──

    async redeemProduct(productId) {
        const res = await api.post('/redemptions', { productId });
        if (!res.error) this.emit('redemptions');
        return res;
    }

    async getRedemptions(status = null) {
        const qs = status ? `?status=${status}` : '';
        const res = await api.get(`/redemptions${qs}`);
        return res.error ? [] : res;
    }

    async confirmRedemption(redemptionId) {
        const res = await api.patch(`/redemptions/${redemptionId}`, {});
        if (!res.error) this.emit('redemptions');
        return res;
    }

    // ── 统计与活动 ──

    async getStats() {
        const res = await api.get('/stats');
        return res.error ? null : res;
    }

    async getActivityLog(limit = 20) {
        const res = await api.get(`/activity?limit=${limit}`);
        return res.error ? [] : res;
    }

    async getFamilyUsers() {
        const res = await api.get('/users/family');
        return res.error ? [] : res;
    }
}

export const store = new Store();
