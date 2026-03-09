// ========================================
// 全局底部导航栏（独立于路由容器）
// ========================================

import { icon } from './icons.js';
import { router } from './router.js';
import { store } from './store.js';
import { auth } from './auth.js';

let navElement = null;
let currentActive = '';
let currentRole = '';

const studentTabs = [
    { key: 'home', route: '/student', icon: 'home', label: '首页' },
    { key: 'tasks', route: '/student/tasks', icon: 'tasks', label: '任务' },
    { key: 'shop', route: '/student/shop', icon: 'gift', label: '商城' },
    { key: 'profile', route: '/student/profile', icon: 'user', label: '我的' },
];

const parentTabs = [
    { key: 'home', route: '/parent', icon: 'home', label: '看板' },
    { key: 'review', route: '/parent/review', icon: 'checkCircle', label: '审核' },
    { key: 'tasks', route: '/parent/tasks', icon: 'tasks', label: '任务' },
    { key: 'products', route: '/parent/products', icon: 'gift', label: '商品' },
    { key: 'settings', route: '/parent/settings', icon: 'settings', label: '设置' },
];

async function getBadgeCount() {
    try {
        const stats = await store.getStats();
        if (!stats) return 0;
        return (stats.pendingReview || 0) + (stats.pendingRedemptions || 0);
    } catch {
        return 0;
    }
}

function buildNav(role, active) {
    const tabs = role === 'parent' ? parentTabs : studentTabs;

    return tabs.map(tab => `
    <button class="nav-item ${active === tab.key ? 'active' : ''}" data-route="${tab.route}">
      ${icon(tab.icon, 22)}
      <span>${tab.label}</span>
      ${tab.key === 'review' ? `<span class="nav-badge" style="display:none"></span>` : ''}
    </button>
  `).join('');
}

export function showBottomNav(role, active) {
    // 如果没有nav元素，创建并挂到body上
    if (!navElement) {
        navElement = document.createElement('nav');
        navElement.className = 'bottom-nav';
        navElement.id = 'global-bottom-nav';
        document.body.appendChild(navElement);
    }

    // 只在角色或激活tab变化时重新渲染
    if (role !== currentRole || active !== currentActive) {
        currentRole = role;
        currentActive = active;
        navElement.innerHTML = buildNav(role, active);

        // 绑定点击事件
        navElement.querySelectorAll('.nav-item').forEach(btn => {
            btn.onclick = () => {
                const route = btn.dataset.route;
                // 立即更新激活状态（视觉响应更快）
                navElement.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                router.navigate(route);
            };
        });

        // 异步加载 badge 数量
        if (role === 'parent') {
            getBadgeCount().then(count => {
                const badge = navElement.querySelector('.nav-badge');
                if (badge && count > 0) {
                    badge.textContent = count;
                    badge.style.display = '';
                }
            });
        }
    }

    navElement.style.display = 'flex';
}

export function hideBottomNav() {
    if (navElement) {
        navElement.style.display = 'none';
    }
    currentActive = '';
    currentRole = '';
}

export async function refreshNavBadge() {
    if (navElement && currentRole === 'parent') {
        const badge = await getBadgeCount();
        const reviewBtn = navElement.querySelector('[data-route="/parent/review"]');
        if (reviewBtn) {
            const existingBadge = reviewBtn.querySelector('.nav-badge');
            if (badge > 0) {
                if (existingBadge) {
                    existingBadge.textContent = badge;
                    existingBadge.style.display = '';
                } else {
                    reviewBtn.insertAdjacentHTML('beforeend', `<span class="nav-badge">${badge}</span>`);
                }
            } else if (existingBadge) {
                existingBadge.style.display = 'none';
            }
        }
    }
}
