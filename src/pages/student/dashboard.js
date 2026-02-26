// ========================================
// 学生端 — 仪表盘
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { router } from '../../utils/router.js';
import { animateNumber, staggerIn } from '../../utils/animations.js';
import { showBottomNav } from '../../utils/nav.js';

export async function renderStudentDashboard(container) {
  container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>`;

  await auth.refreshUser();
  const user = auth.currentUser;

  const [tasks, submissions, products] = await Promise.all([
    store.getTasks(),
    store.getSubmissions(null, user.id),
    store.getProducts()
  ]);

  const points = user.points || 0;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const todayApproved = submissions.filter(s =>
    s.status === 'approved' &&
    new Date(s.created_at || s.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const displayProducts = products.slice(0, 3);

  container.innerHTML = `
    <div class="page student-dashboard">
      <!-- 顶部问候 -->
      <div class="page-header">
        <div class="greeting">
          <span class="greeting-emoji">${user.avatar}</span>
          <div>
            <h1 class="page-title">你好，${user.username}</h1>
            <p class="page-subtitle">今天也要加油哦 💪</p>
          </div>
        </div>
      </div>

      <!-- 积分卡 -->
      <div class="points-card animate-fade-in-up">
        <div class="points-card-bg"></div>
        <div class="points-card-content">
          <p class="points-label">我的积分</p>
          <h2 class="points-value" id="points-display">0</h2>
          <div class="points-stats">
            <div class="points-stat">
              <span class="points-stat-value">${pendingCount}</span>
              <span class="points-stat-label">审核中</span>
            </div>
            <div class="points-stat-divider"></div>
            <div class="points-stat">
              <span class="points-stat-value">${todayApproved}</span>
              <span class="points-stat-label">今日完成</span>
            </div>
            <div class="points-stat-divider"></div>
            <div class="points-stat">
              <span class="points-stat-value">${tasks.length}</span>
              <span class="points-stat-label">待做任务</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 今日任务 -->
      <section class="dashboard-section animate-fade-in-up stagger-2">
        <div class="section-header">
          <h2 class="section-title">今日任务</h2>
          <button class="btn btn-ghost btn-sm" id="view-all-tasks">
            查看全部 ${icon('chevronRight', 16)}
          </button>
        </div>
        <div class="task-list" id="task-list">
          ${tasks.slice(0, 3).map(task => `
            <div class="task-card" data-stagger>
              <div class="task-card-left">
                <div class="task-type-badge badge badge-${task.type === 'daily' ? 'primary' : task.type === 'weekly' ? 'warning' : 'success'}">
                  ${task.type === 'daily' ? '每日' : task.type === 'weekly' ? '每周' : task.type === 'semester' ? '学期' : '单次'}
                </div>
                <h3 class="task-card-title">${task.title}</h3>
                <p class="task-card-points">+${task.points} 积分</p>
              </div>
              <button class="btn btn-primary btn-sm task-submit-btn" data-task-id="${task.id}">
                提交
              </button>
            </div>
          `).join('')}
          ${tasks.length === 0 ? `
            <div class="empty-state" style="padding:var(--space-8)">
              ${icon('tasks', 40)}
              <h3>暂无任务</h3>
              <p>等待家长发布新任务</p>
            </div>
          ` : ''}
        </div>
      </section>

      <!-- 热门奖励 -->
      <section class="dashboard-section animate-fade-in-up stagger-4">
        <div class="section-header">
          <h2 class="section-title">热门奖励</h2>
          <button class="btn btn-ghost btn-sm" id="view-shop">
            商城 ${icon('chevronRight', 16)}
          </button>
        </div>
        <div class="reward-scroll">
          ${displayProducts.map(p => `
            <div class="reward-card" data-stagger>
              <div class="reward-emoji">${p.emoji || '🎁'}</div>
              <h4 class="reward-name">${p.name}</h4>
              <span class="reward-price">${p.price} 积分</span>
            </div>
          `).join('')}
        </div>
      </section>
    </div>

    <style>
      .student-dashboard { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }

      .greeting {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .greeting-emoji {
        font-size: 2.5rem;
      }

      /* 积分卡 */
      .points-card {
        position: relative;
        border-radius: var(--radius-2xl);
        padding: var(--space-6);
        overflow: hidden;
        margin-bottom: var(--space-6);
      }

      .points-card-bg {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, #4A7DFF 0%, #6B5CE7 50%, #A855F7 100%);
        background-size: 200% 200%;
        animation: gradientShift 6s ease infinite;
      }

      .points-card-content {
        position: relative;
        z-index: 1;
        color: white;
      }

      .points-label {
        font-size: var(--text-sm);
        opacity: 0.85;
        margin-bottom: var(--space-1);
      }

      .points-value {
        font-size: 3rem;
        font-weight: var(--weight-bold);
        font-family: var(--font-mono);
        letter-spacing: -0.03em;
        margin-bottom: var(--space-5);
        line-height: 1;
      }

      .points-stats {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        background: rgba(255,255,255,0.15);
        border-radius: var(--radius-lg);
        padding: var(--space-3) var(--space-4);
        backdrop-filter: blur(10px);
      }

      .points-stat {
        flex: 1;
        text-align: center;
      }

      .points-stat-value {
        display: block;
        font-size: var(--text-lg);
        font-weight: var(--weight-bold);
      }

      .points-stat-label {
        font-size: var(--text-xs);
        opacity: 0.8;
      }

      .points-stat-divider {
        width: 1px;
        height: 24px;
        background: rgba(255,255,255,0.25);
      }

      /* 段落 */
      .dashboard-section { margin-bottom: var(--space-6); }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-3);
      }

      .section-title {
        font-size: var(--text-lg);
        font-weight: var(--weight-semibold);
      }

      /* 任务卡 */
      .task-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        margin-bottom: var(--space-2);
        box-shadow: var(--shadow-sm);
        transition: transform var(--duration-fast) var(--ease-out);
      }

      .task-card:active { transform: scale(0.98); }

      .task-card-title {
        font-size: var(--text-base);
        font-weight: var(--weight-medium);
        margin-top: var(--space-1);
      }

      .task-card-points {
        font-size: var(--text-sm);
        color: var(--color-primary);
        font-weight: var(--weight-semibold);
        margin-top: 2px;
      }

      /* 奖励卡滚动 */
      .reward-scroll {
        display: flex;
        gap: var(--space-3);
        overflow-x: auto;
        padding-bottom: var(--space-2);
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }

      .reward-scroll::-webkit-scrollbar { display: none; }

      .reward-card {
        min-width: 120px;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        text-align: center;
        box-shadow: var(--shadow-sm);
        flex-shrink: 0;
      }

      .reward-emoji { font-size: 2rem; margin-bottom: var(--space-2); }

      .reward-name {
        font-size: var(--text-sm);
        font-weight: var(--weight-medium);
        margin-bottom: var(--space-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .reward-price {
        font-size: var(--text-xs);
        color: var(--color-primary);
        font-weight: var(--weight-semibold);
      }
    </style>
  `;

  // 积分计数动画
  setTimeout(() => {
    const el = container.querySelector('#points-display');
    if (el) animateNumber(el, 0, points);
  }, 300);

  // 交错渐显
  staggerIn(container, '[data-stagger]');

  // 事件
  container.querySelector('#view-all-tasks')?.addEventListener('click', () => router.navigate('/student/tasks'));
  container.querySelector('#view-shop')?.addEventListener('click', () => router.navigate('/student/shop'));

  container.querySelectorAll('.task-submit-btn').forEach(btn => {
    btn.onclick = () => router.navigate('/student/tasks');
  });

  // 底部导航
  showBottomNav('child', 'home');
}
