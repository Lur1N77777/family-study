// ========================================
// 家长端 — 看板
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { router } from '../../utils/router.js';
import { animateNumber, staggerIn } from '../../utils/animations.js';
import { toast } from '../../utils/notification.js';
import { showBottomNav } from '../../utils/nav.js';

export async function renderParentOverview(container) {
  container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>`;

  await auth.refreshUser();
  const user = auth.currentUser;
  const familyCode = auth.getFamilyCode();

  const [stats, users, activities] = await Promise.all([
    store.getStats(),
    store.getFamilyUsers(),
    store.getActivityLog(10)
  ]);

  const children = users.filter(u => u.role === 'child');

  container.innerHTML = `
    <div class="page parent-overview">
      <div class="page-header">
        <div class="greeting">
          <span class="greeting-emoji">${user.avatar}</span>
          <div>
            <h1 class="page-title">你好，${user.username}</h1>
            <p class="page-subtitle">家庭学习管理中心</p>
          </div>
        </div>
      </div>

      <!-- 家庭码 -->
      <div class="family-code-card animate-fade-in-up">
        <div class="fc-left">
          <span class="fc-label">家庭码</span>
          <span class="fc-code" id="family-code">${familyCode}</span>
        </div>
        <button class="btn btn-icon" id="copy-code" title="复制">${icon('copy', 18)}</button>
      </div>

      <!-- 统计卡片 -->
      <div class="grid-2 animate-fade-in-up stagger-2" style="margin-bottom:var(--space-6)">
        <div class="stat-card">
          <div class="stat-value" id="stat-tasks">${stats?.totalTasks || 0}</div>
          <div class="stat-label">发布任务</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-pending" style="color:var(--color-warning)">${stats?.pendingReview || 0}</div>
          <div class="stat-label">待审核</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-rate" style="color:var(--color-success)">${stats?.completionRate || 0}%</div>
          <div class="stat-label">完成率</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-redemptions" style="color:var(--color-primary)">${stats?.pendingRedemptions || 0}</div>
          <div class="stat-label">待兑现</div>
        </div>
      </div>

      <!-- 孩子列表 -->
      ${children.length > 0 ? `
        <section class="overview-section animate-fade-in-up stagger-3">
          <h2 class="section-title" style="margin-bottom:var(--space-3)">我的孩子</h2>
          <div class="list-group">
            ${children.map(child => `
              <div class="list-item">
                <div class="avatar">${child.avatar}</div>
                <div class="list-item-content">
                  <div class="list-item-title">${child.username}</div>
                  <div class="list-item-subtitle">积分: ${child.points || 0}</div>
                </div>
                <span class="points-display" style="font-size:var(--text-md)">${child.points || 0}</span>
              </div>
            `).join('')}
          </div>
        </section>
      ` : `
        <section class="overview-section animate-fade-in-up stagger-3">
          <div class="empty-invite-card">
            ${icon('users', 32)}
            <p>还没有孩子加入</p>
            <p class="text-secondary">分享家庭码 <strong>${familyCode}</strong> 给孩子注册</p>
          </div>
        </section>
      `}

      <!-- 近期动态 -->
      <section class="overview-section animate-fade-in-up stagger-4">
        <h2 class="section-title" style="margin-bottom:var(--space-3)">近期动态</h2>
        ${activities.length > 0 ? `
          <div class="timeline">
            ${activities.map(a => `
              <div class="timeline-item" data-stagger>
                <div class="timeline-dot ${a.type === 'task_approved' ? 'dot-success' : a.type === 'task_rejected' ? 'dot-danger' : 'dot-primary'}"></div>
                <div class="timeline-content">
                  <p class="timeline-message">${a.message}</p>
                  <span class="timeline-time">${formatTime(a.timestamp)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state" style="padding:var(--space-8)">
            ${icon('clock', 32)}
            <h3>暂无动态</h3>
          </div>
        `}
      </section>
    </div>

    <style>
      .parent-overview { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }

      .greeting {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .greeting-emoji { font-size: 2.5rem; }

      .family-code-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--space-3) var(--space-4);
        margin-bottom: var(--space-4);
        box-shadow: var(--shadow-sm);
      }

      .fc-left { display: flex; align-items: center; gap: var(--space-3); }
      .fc-label { font-size: var(--text-sm); color: var(--color-text-secondary); }
      .fc-code {
        font-family: var(--font-mono);
        font-size: var(--text-lg);
        font-weight: var(--weight-bold);
        letter-spacing: 0.15em;
        color: var(--color-primary);
      }

      .overview-section { margin-bottom: var(--space-6); }

      .empty-invite-card {
        text-align: center;
        padding: var(--space-8);
        background: var(--color-surface);
        border-radius: var(--radius-xl);
        color: var(--color-text-secondary);
      }

      .empty-invite-card svg { margin: 0 auto var(--space-3); opacity: 0.4; }
      .empty-invite-card p { font-size: var(--text-sm); margin-bottom: var(--space-1); }
      .text-secondary { color: var(--color-text-tertiary); }

      /* 时间线 */
      .timeline { position: relative; padding-left: var(--space-6); }

      .timeline::before {
        content: '';
        position: absolute;
        left: 7px;
        top: 4px;
        bottom: 4px;
        width: 2px;
        background: var(--color-border);
      }

      .timeline-item {
        position: relative;
        padding-bottom: var(--space-4);
      }

      .timeline-dot {
        position: absolute;
        left: calc(-1 * var(--space-6) + 2px);
        top: 4px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid var(--color-surface);
      }

      .dot-success { background: var(--color-success); }
      .dot-danger { background: var(--color-danger); }
      .dot-primary { background: var(--color-primary); }

      .timeline-message { font-size: var(--text-sm); line-height: 1.5; }
      .timeline-time { font-size: var(--text-xs); color: var(--color-text-tertiary); }
    </style>
  `;

  // 统计动画
  setTimeout(() => {
    animateNumber(container.querySelector('#stat-tasks'), 0, stats.totalTasks, 600);
    animateNumber(container.querySelector('#stat-pending'), 0, stats.pendingReview, 600);
    const rateEl = container.querySelector('#stat-rate');
    animateNumber(rateEl, 0, stats.completionRate, 600);
    setTimeout(() => { if (rateEl) rateEl.textContent += '%'; }, 650);
    animateNumber(container.querySelector('#stat-redemptions'), 0, stats.pendingRedemptions, 600);
  }, 300);

  staggerIn(container, '[data-stagger]');

  // 复制家庭码
  container.querySelector('#copy-code').onclick = () => {
    navigator.clipboard?.writeText(familyCode).then(() => {
      toast('家庭码已复制', 'success');
    }).catch(() => {
      toast(`家庭码: ${familyCode}`, 'info');
    });
  };

  showBottomNav('parent', 'home');
}

function formatTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${Math.floor(diff / 86400000)}天前`;
}
