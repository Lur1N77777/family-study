// ========================================
// 认证与会话管理 (使用后端 API)
// ========================================

import { api } from './api.js';
import { router } from './router.js';

const SESSION_KEY = 'family_study_user';

class Auth {
    constructor() {
        this.currentUser = null;
        this.loadSession();
    }

    loadSession() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (raw) {
                this.currentUser = JSON.parse(raw);
            }
        } catch (e) {
            this.currentUser = null;
        }
    }

    saveSession(user, token) {
        if (token) api.setToken(token);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        this.currentUser = user;
    }

    async login(username, password) {
        const result = await api.post('/auth/login', { username, password });
        if (result.error) return result;

        this.saveSession(result.user, result.token);
        return result;
    }

    async register(username, password, role, familyCode, joinExisting = false) {
        const result = await api.post('/auth/register', { username, password, role, familyCode, joinExisting });
        if (result.error) return result;

        this.saveSession(result.user, result.token);
        return result;
    }

    logout() {
        sessionStorage.removeItem(SESSION_KEY);
        api.setToken(null);
        this.currentUser = null;
        router.navigate('/');
    }

    isLoggedIn() {
        return !!this.currentUser && !!api.token;
    }

    getRole() {
        return this.currentUser?.role || null;
    }

    getUserId() {
        return this.currentUser?.id || null;
    }

    getFamilyCode() {
        return this.currentUser?.familyCode || null;
    }

    async refreshUser() {
        // 在新版架构中，刷新用户积分可以复用统计接口，或单独的用户接口。
        // 这里只是更新本地缓存，真实获取发生在各个页面渲染时。
        return this.currentUser;
    }
}

export const auth = new Auth();
