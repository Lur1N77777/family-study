// ========================================
// 轻量级 Hash 路由器
// ========================================

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.currentRole = null;
        this.beforeEach = null;
        this._navigating = false;
        this._pendingCleanup = null;
        window.addEventListener('hashchange', () => this.resolve());
    }

    add(path, handler) {
        this.routes[path] = handler;
        return this;
    }

    guard(fn) {
        this.beforeEach = fn;
        return this;
    }

    navigate(path) {
        window.location.hash = path;
    }

    resolve() {
        const hash = window.location.hash.slice(1) || '/';

        if (this.beforeEach) {
            const allowed = this.beforeEach(hash);
            if (!allowed) return;
        }

        const handler = this.routes[hash];
        if (!handler) {
            this.navigate('/');
            return;
        }

        const app = document.getElementById('app');
        const oldRoute = this.currentRoute;
        this.currentRoute = hash;

        // 取消之前还没完成的清理定时器
        if (this._pendingCleanup) {
            clearTimeout(this._pendingCleanup);
            this._pendingCleanup = null;
        }

        // 立即清理所有旧页面（防止重叠）
        const existingChildren = Array.from(app.children);

        // 如果是从同一个路由刷新，或者首次加载，直接替换
        if (!oldRoute || oldRoute === hash) {
            existingChildren.forEach(child => child.remove());
        } else {
            // 只保留最后一个旧页面做退出动画，其余立即清除
            existingChildren.forEach((child, i) => {
                if (i < existingChildren.length - 1) {
                    child.remove(); // 多余的旧页面立即清除
                }
            });
        }

        // 创建新页面容器 — 改用 relative 定位，不再用 absolute 以允许自然滚动
        const wrapper = document.createElement('div');
        wrapper.className = 'page-wrapper';

        if (oldRoute && oldRoute !== hash) {
            const direction = this.getDirection(oldRoute, hash);

            // 新页面入场动画
            if (direction === 'forward' || direction === 'back') {
                wrapper.style.animation = direction === 'forward'
                    ? 'fadeInScale var(--duration-slow) var(--ease-out) both'
                    : 'fadeInScale var(--duration-slow) var(--ease-out) both';
            } else {
                wrapper.style.animation = 'fadeIn var(--duration-base) var(--ease-out) both';
            }

            // 旧页面退出
            const oldPage = app.firstElementChild;
            if (oldPage && oldPage !== wrapper) {
                oldPage.style.opacity = '0';
                oldPage.style.transition = 'opacity 200ms ease-out';
                oldPage.style.pointerEvents = 'none';
                this._pendingCleanup = setTimeout(() => oldPage.remove(), 200);
            }
        }

        app.appendChild(wrapper);
        handler(wrapper);

        // 滚动到顶部
        window.scrollTo(0, 0);
    }

    getDirection(from, to) {
        if (!from) return 'none';
        const pageOrder = ['/', '/login', '/register',
            '/student', '/student/tasks', '/student/shop', '/student/profile',
            '/parent', '/parent/review', '/parent/tasks', '/parent/products', '/parent/settings'
        ];
        const fromIdx = pageOrder.indexOf(from);
        const toIdx = pageOrder.indexOf(to);
        if (fromIdx === -1 || toIdx === -1) return 'fade';
        return toIdx > fromIdx ? 'forward' : 'back';
    }

    start() {
        this.resolve();
    }
}

export const router = new Router();
