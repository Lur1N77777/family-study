// ========================================
// 学生端 — 个人中心
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { router } from '../../utils/router.js';
import { toast } from '../../utils/notification.js';
import { animateNumber, staggerIn } from '../../utils/animations.js';
import { toggleTheme } from '../../main.js';
import { showBottomNav } from '../../utils/nav.js';

export function renderStudentProfile(container) {
  auth.refreshUser();
  const user = auth.currentUser;
  const points = store.getChildPoints(user.id);
  const submissions = store.getChildSubmissions(user.id);
  const approvedSubs = submissions.filter(s => s.status === 'approved');
  const totalEarned = approvedSubs.reduce((sum, s) => sum + (s.points || 0), 0);
  const redemptions = store.getRedemptions(auth.getFamilyCode()).filter(r => r.childId === user.id);
  const totalSpent = redemptions.reduce((sum, r) => sum + r.price, 0);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  container.innerHTML = `
    <div class="page profile-page">
      <div class="page-header">
        <h1 class="page-title">个人中心</h1>
      </div>

      <!-- 用户卡片 -->
      <div class="profile-card animate-fade-in-up">
        <div class="profile-avatar-lg">${user.avatar}</div>
        <h2 class="profile-name">${user.username}</h2>
        <p class="profile-role">学生</p>
      </div>

      <!-- 积分统计 -->
      <div class="grid-3 animate-fade-in-up stagger-2" style="margin-bottom:var(--space-6)">
        <div class="stat-card">
          <div class="stat-value points-display" id="current-points">0</div>
          <div class="stat-label">当前积分</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--color-success)">${totalEarned}</div>
          <div class="stat-label">累计获得</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--color-warning)">${totalSpent}</div>
          <div class="stat-label">累计消费</div>
        </div>
      </div>

      <!-- 最近兑换 -->
      ${redemptions.length > 0 ? `
        <section class="profile-section animate-fade-in-up stagger-3">
          <h3 class="section-title" style="margin-bottom:var(--space-3)">最近兑换</h3>
          <div class="list-group">
            ${redemptions.slice(0, 5).map(r => `
              <div class="list-item">
                <span style="font-size:1.5rem">${r.productEmoji || '🎁'}</span>
                <div class="list-item-content">
                  <div class="list-item-title">${r.productName}</div>
                  <div class="list-item-subtitle">
                    ${r.status === 'pending' ? '等待家长确认' : '已兑现'} · 
                    ${new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span class="badge ${r.status === 'pending' ? 'badge-warning' : 'badge-success'}">
                  ${r.status === 'pending' ? '待确认' : '已兑现'}
                </span>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <!-- 设置 -->
      <section class="profile-section animate-fade-in-up stagger-4">
        <h3 class="section-title" style="margin-bottom:var(--space-3)">设置</h3>
        <div class="list-group">
          <div class="list-item" id="toggle-theme">
            <span style="color:var(--color-text-secondary)">${isDark ? icon('sun', 20) : icon('moon', 20)}</span>
            <div class="list-item-content">
              <div class="list-item-title">${isDark ? '浅色模式' : '深色模式'}</div>
            </div>
            ${icon('chevronRight', 18)}
          </div>
          <div class="list-item" id="logout-btn" style="color:var(--color-danger)">
            ${icon('logout', 20)}
            <div class="list-item-content">
              <div class="list-item-title" style="color:var(--color-danger)">退出登录</div>
            </div>
            ${icon('chevronRight', 18)}
          </div>
        </div>
      </section>
    </div>

    <style>
      .profile-page { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }

      .profile-card {
        text-align: center;
        padding: var(--space-6);
        margin-bottom: var(--space-4);
      }

      .profile-avatar-lg {
        font-size: 4rem;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto var(--space-3);
        background: var(--color-primary-soft);
        border-radius: var(--radius-full);
      }

      .profile-name {
        font-size: var(--text-xl);
        font-weight: var(--weight-bold);
      }

      .profile-role {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        margin-top: var(--space-1);
      }

      .profile-section { margin-bottom: var(--space-6); }
    </style>
  `;

  // 积分动画
  setTimeout(() => {
    const el = container.querySelector('#current-points');
    if (el) animateNumber(el, 0, points);
  }, 400);

  // 事件
  container.querySelector('#toggle-theme').onclick = () => {
    toggleTheme();
    renderStudentProfile(container);
  };

  container.querySelector('#logout-btn').onclick = () => {
    auth.logout();
    toast('已退出登录', 'info');
  };

  showBottomNav('child', 'profile');
}
