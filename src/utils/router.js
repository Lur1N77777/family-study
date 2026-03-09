// ========================================
// Lightweight hash router
// ========================================

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.currentRole = null;
        this.beforeEach = null;
        this._navigating = false;
        this._pendingCleanup = null;
        this._resolveToken = 0;
        window.addEventListener('hashchange', () => {
            void this.resolve();
        });
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

    async resolve() {
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

        if (this._pendingCleanup) {
            clearTimeout(this._pendingCleanup);
            this._pendingCleanup = null;
        }

        const existingChildren = Array.from(app.children);
        if (!oldRoute || oldRoute === hash) {
            existingChildren.forEach((child) => child.remove());
        } else {
            existingChildren.forEach((child, index) => {
                if (index < existingChildren.length - 1) {
                    child.remove();
                }
            });
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'page-wrapper';

        if (oldRoute && oldRoute !== hash) {
            const direction = this.getDirection(oldRoute, hash);

            if (direction === 'forward') {
                wrapper.style.animation = 'slideInRight var(--duration-slow) var(--ease-out) both';
            } else if (direction === 'back') {
                wrapper.style.animation = 'slideInLeft var(--duration-slow) var(--ease-out) both';
            } else {
                wrapper.style.animation = 'fadeInScale var(--duration-base) var(--ease-out) both';
            }

            wrapper.addEventListener('animationend', () => {
                wrapper.style.animation = '';
            }, { once: true });

            const oldPage = app.firstElementChild;
            if (oldPage && oldPage !== wrapper) {
                const exitDirection = direction === 'forward' ? 'slideOutLeft' : 'slideOutRight';
                oldPage.style.animation = `${exitDirection} 200ms ease-out forwards`;
                oldPage.style.pointerEvents = 'none';
                this._pendingCleanup = setTimeout(() => oldPage.remove(), 200);
            }
        }

        app.appendChild(wrapper);

        try {
            const resolveToken = ++this._resolveToken;
            await Promise.resolve(handler(wrapper));
            if (resolveToken === this._resolveToken) {
                window.scrollTo(0, 0);
            }
        } catch (error) {
            console.error(`Route render failed [${hash}]`, error);
            if (error?.status === 401) {
                return;
            }

            wrapper.innerHTML = `
                <div class="page" style="padding:var(--space-8);display:grid;place-items:center;min-height:60vh">
                    <div class="empty-state" style="max-width:420px">
                        <h3>页面加载失败</h3>
                        <p style="margin-top:var(--space-2);line-height:1.6">${error?.message || '请稍后重试'}</p>
                        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-5);justify-content:center;flex-wrap:wrap">
                            <button class="btn btn-primary" id="route-retry-btn">重新加载</button>
                            <button class="btn btn-secondary" id="route-home-btn">回到首页</button>
                        </div>
                    </div>
                </div>
            `;

            wrapper.querySelector('#route-retry-btn')?.addEventListener('click', () => {
                void this.resolve();
            });
            wrapper.querySelector('#route-home-btn')?.addEventListener('click', () => {
                this.navigate('/');
            });
        }
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
        void this.resolve();
    }
}

export const router = new Router();
