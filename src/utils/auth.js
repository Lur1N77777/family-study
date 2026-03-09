// ========================================
// Auth and session state
// ========================================

import { api } from './api.js';
import { router } from './router.js';
import { isJwtExpired } from './session.js';
import { sanitizeEmoji } from './emoji.js';

const SESSION_KEY = 'family_study_user';
const AUTH_MESSAGE_KEY = 'family_study_auth_message';

function normalizeSessionUser(user) {
    if (!user || typeof user !== 'object') {
        return user;
    }

    return {
        ...user,
        avatar: sanitizeEmoji(user.avatar, user.role === 'parent' ? '🧑' : '🙂'),
    };
}

function safeSessionGet(key) {
    try {
        return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
    } catch {
        return null;
    }
}

function safeSessionSet(key, value) {
    try {
        if (typeof sessionStorage === 'undefined') return;
        if (value == null) {
            sessionStorage.removeItem(key);
        } else {
            sessionStorage.setItem(key, value);
        }
    } catch {
        // Ignore storage failures.
    }
}

class Auth {
    constructor() {
        this.currentUser = null;
        this.handleAuthExpired = this.handleAuthExpired.bind(this);
        if (typeof window !== 'undefined') {
            window.addEventListener('app:auth-expired', this.handleAuthExpired);
        }
        this.loadSession();
    }

    loadSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw || !api.token || isJwtExpired(api.token)) {
                this.clearSession();
                return;
            }

            this.currentUser = normalizeSessionUser(JSON.parse(raw));
        } catch {
            this.clearSession();
        }
    }

    saveSession(user, token) {
        if (token) api.setToken(token);
        const normalizedUser = normalizeSessionUser(user);
        localStorage.setItem(SESSION_KEY, JSON.stringify(normalizedUser));
        safeSessionSet(AUTH_MESSAGE_KEY, null);
        this.currentUser = normalizedUser;
    }

    clearSession() {
        localStorage.removeItem(SESSION_KEY);
        api.setToken(null);
        this.currentUser = null;
    }

    async login(username, password) {
        const result = await api.post('/auth/login', { username, password });
        this.saveSession(result.user, result.token);
        return result;
    }

    async register(username, password, role, familyCode, joinExisting = false) {
        const result = await api.post('/auth/register', { username, password, role, familyCode, joinExisting });
        this.saveSession(result.user, result.token);
        return result;
    }

    logout({ redirectTo = '/', reason = null } = {}) {
        this.clearSession();
        if (reason) {
            safeSessionSet(AUTH_MESSAGE_KEY, reason);
        }
        if (redirectTo) {
            router.navigate(redirectTo);
        }
    }

    isLoggedIn() {
        if (!this.currentUser || !api.token) {
            return false;
        }

        if (isJwtExpired(api.token)) {
            this.clearSession();
            return false;
        }

        return true;
    }

    requireUser() {
        if (!this.currentUser) {
            throw new Error('登录状态已失效，请重新登录');
        }

        return this.currentUser;
    }

    consumeAuthMessage() {
        const message = safeSessionGet(AUTH_MESSAGE_KEY);
        if (message) {
            safeSessionSet(AUTH_MESSAGE_KEY, null);
        }
        return message;
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
        if (!this.isLoggedIn()) {
            return null;
        }

        const users = await api.get('/users/family');
        const me = users.find((user) => user.id === this.currentUser?.id);
        if (me) {
            this.currentUser = normalizeSessionUser({ ...this.currentUser, ...me });
            localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentUser));
        }
        return this.currentUser;
    }

    updatePoints(points) {
        if (this.currentUser) {
            this.currentUser.points = points;
            localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentUser));
        }
    }

    updateUserField(key, value) {
        if (this.currentUser) {
            this.currentUser[key] = key === 'avatar'
                ? sanitizeEmoji(value, this.currentUser.role === 'parent' ? '🧑' : '🙂')
                : value;
            localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentUser));
        }
    }

    handleAuthExpired(event) {
        const message = event?.detail?.message || '登录已过期，请重新登录';
        if (!this.currentUser && !api.token) {
            return;
        }

        this.logout({ redirectTo: '/login', reason: message });
    }
}

export const auth = new Auth();
