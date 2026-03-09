import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { router } from '../../utils/router.js';
import { animateNumber, staggerIn } from '../../utils/animations.js';
import { showBottomNav } from '../../utils/nav.js';
import { escapeHtml } from '../../utils/escape.js';

export async function renderStudentDashboard(container) {
  container.innerHTML = '<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>';

  await auth.refreshUser();
  const user = auth.requireUser();

  const [tasks, submissions, products, familyUsers] = await Promise.all([
    store.getTasks(),
    store.getSubmissions(null, user.id),
    store.getProducts(),
    store.getFamilyUsers(),
  ]);

  const tasksWithStatus = tasks
    .map((task) => decorateDashboardTask(task))
    .sort((a, b) => dashboardTaskRank(a) - dashboardTaskRank(b));

  const parents = familyUsers.filter((member) => member.role === 'parent');
  const siblings = familyUsers.filter((member) => member.role === 'child' && member.id !== user.id);

  const points = user.points || 0;
  const pendingCount = submissions.filter((item) => item.status === 'pending').length;
  const todayApproved = submissions.filter((item) => (
    item.status === 'approved' &&
    new Date(item.created_at || item.createdAt).toDateString() === new Date().toDateString()
  )).length;
  const openTaskCount = tasksWithStatus.filter((task) => task.canSubmitNow).length;
  const displayProducts = products.slice(0, 3);

  container.innerHTML = `
    <div class="page student-dashboard">
      <div class="page-header">
        <div class="greeting">
          <span class="greeting-emoji">${escapeHtml(user.avatar || '🙂')}</span>
          <div>
            <h1 class="page-title">你好，${escapeHtml(user.username)}</h1>
            <p class="page-subtitle">今天也要加油，先把能完成的任务拿下。</p>
          </div>
        </div>
      </div>

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
              <span class="points-stat-value">${openTaskCount}</span>
              <span class="points-stat-label">当前可提交</span>
            </div>
          </div>
        </div>
      </div>

      <section class="dashboard-section animate-fade-in-up stagger-2">
        <div class="section-header">
          <h2 class="section-title">当前任务</h2>
          <button class="btn btn-ghost btn-sm" id="view-all-tasks">
            查看全部 ${icon('chevronRight', 16)}
          </button>
        </div>
        <div class="task-list" id="task-list">
          ${tasksWithStatus.slice(0, 3).map((task) => `
            <div class="task-card ${task.cardClass}" data-stagger>
              <div class="task-card-left">
                <div class="task-type-badge badge badge-${task.type === 'daily' ? 'primary' : task.type === 'weekly' ? 'warning' : task.type === 'semester' ? 'danger' : 'success'}">
                  ${task.type === 'daily' ? '每日' : task.type === 'weekly' ? '每周' : task.type === 'semester' ? '学期' : '单次'}
                </div>
                <h3 class="task-card-title ${task.isCompleted ? 'is-done' : ''}">${escapeHtml(task.title)}</h3>
                ${task.description ? `<p class="task-card-desc ${task.isCompleted ? 'is-done' : ''}">${escapeHtml(task.description)}</p>` : ''}
                <p class="task-card-status ${task.statusClass}">${escapeHtml(task.statusText)}</p>
                <p class="task-card-points">+${task.points} 积分</p>
              </div>
              ${renderDashboardTaskAction(task)}
            </div>
          `).join('')}
          ${tasksWithStatus.length === 0 ? `
            <div class="empty-state" style="padding:var(--space-8)">
              ${icon('tasks', 40)}
              <h3>暂时没有任务</h3>
              <p>等家长发布任务后，这里会第一时间出现。</p>
            </div>
          ` : ''}
        </div>
      </section>

      ${(parents.length > 0 || siblings.length > 0) ? `
        <section class="dashboard-section animate-fade-in-up stagger-3">
          <div class="section-header">
            <h2 class="section-title">家庭成员</h2>
          </div>
          <div class="family-members-scroll">
            ${parents.map((parent) => `
              <div class="family-member-card" data-stagger>
                <div class="family-member-avatar">${escapeHtml(parent.avatar || '👨')}</div>
                <div class="family-member-name">${escapeHtml(parent.username)}</div>
                <div class="family-member-role">家长</div>
              </div>
            `).join('')}
            ${siblings.map((sibling) => `
              <div class="family-member-card" data-stagger>
                <div class="family-member-avatar">${escapeHtml(sibling.avatar || '🙂')}</div>
                <div class="family-member-name">${escapeHtml(sibling.username)}</div>
                <div class="family-member-role">积分: ${sibling.points || 0}</div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <section class="dashboard-section animate-fade-in-up stagger-4">
        <div class="section-header">
          <h2 class="section-title">热门奖励</h2>
          <button class="btn btn-ghost btn-sm" id="view-shop">
            商城 ${icon('chevronRight', 16)}
          </button>
        </div>
        <div class="reward-scroll">
          ${displayProducts.map((product) => `
            <div class="reward-card" data-stagger>
              <div class="reward-emoji">${escapeHtml(product.emoji || '🎁')}</div>
              <h4 class="reward-name">${escapeHtml(product.name)}</h4>
              <span class="reward-price">${product.price} 积分</span>
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
      .greeting-emoji { font-size: 2.5rem; }

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
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
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
        opacity: 0.85;
      }
      .points-stat-divider {
        width: 1px;
        height: 24px;
        background: rgba(255,255,255,0.25);
        justify-self: center;
      }

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

      .task-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        margin-bottom: var(--space-2);
        box-shadow: var(--shadow-sm);
        transition: transform var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out);
      }
      .task-card:active { transform: scale(0.98); }
      .task-card-left {
        min-width: 0;
        flex: 1;
        display: grid;
        gap: 4px;
      }
      .task-card.is-completed {
        background: color-mix(in srgb, var(--color-success) 5%, var(--color-surface));
        border: 1px solid color-mix(in srgb, var(--color-success) 18%, transparent);
      }
      .task-card.is-pending {
        border: 1px solid color-mix(in srgb, var(--color-warning) 18%, transparent);
      }
      .task-card.is-rejected {
        border: 1px solid color-mix(in srgb, var(--color-danger) 18%, transparent);
      }
      .task-card-title {
        font-size: var(--text-base);
        font-weight: var(--weight-medium);
        margin-top: var(--space-1);
        line-height: 1.35;
      }
      .task-card-title.is-done {
        color: var(--color-text-tertiary);
        text-decoration: line-through;
        text-decoration-thickness: 2px;
      }
      .task-card-desc {
        font-size: 12px;
        color: var(--color-text-secondary);
        line-height: 1.45;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .task-card-desc.is-done {
        color: var(--color-text-tertiary);
        text-decoration: line-through;
      }
      .task-card-status {
        font-size: 11px;
        font-weight: var(--weight-semibold);
      }
      .task-card-status.status-completed { color: var(--color-success); }
      .task-card-status.status-pending { color: var(--color-warning); }
      .task-card-status.status-rejected { color: var(--color-danger); }
      .task-card-status.status-todo { color: var(--color-primary); }
      .task-card-status.status-muted { color: var(--color-text-tertiary); }
      .task-card-points {
        font-size: var(--text-sm);
        color: var(--color-primary);
        font-weight: var(--weight-semibold);
        margin-top: 2px;
      }
      .task-card-action {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 11px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: var(--weight-semibold);
        flex-shrink: 0;
      }
      .task-card-action.state-completed {
        background: var(--color-success-soft);
        color: var(--color-success);
      }
      .task-card-action.state-pending {
        background: var(--color-warning-soft);
        color: var(--color-warning);
      }
      .task-card-action.state-muted {
        background: color-mix(in srgb, var(--color-text-primary) 7%, transparent);
        color: var(--color-text-tertiary);
      }

      .reward-scroll,
      .family-members-scroll {
        display: flex;
        gap: var(--space-3);
        overflow-x: auto;
        padding-bottom: var(--space-2);
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .reward-scroll::-webkit-scrollbar,
      .family-members-scroll::-webkit-scrollbar { display: none; }

      .reward-card,
      .family-member-card {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        flex-shrink: 0;
      }
      .reward-card {
        min-width: 120px;
        padding: var(--space-4);
        text-align: center;
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

      .family-member-card {
        min-width: 80px;
        padding: var(--space-3);
        text-align: center;
      }
      .family-member-avatar { font-size: 1.75rem; margin-bottom: var(--space-1); }
      .family-member-name {
        font-size: var(--text-sm);
        font-weight: var(--weight-medium);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .family-member-role {
        font-size: var(--text-xs);
        color: var(--color-text-tertiary);
        margin-top: 2px;
      }

      @media (max-width: 640px) {
        .points-stats {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-2);
          padding: var(--space-3);
        }
        .task-card {
          align-items: flex-start;
        }
      }
    </style>
  `;

  setTimeout(() => {
    const display = container.querySelector('#points-display');
    if (display) animateNumber(display, 0, points);
  }, 300);

  staggerIn(container, '[data-stagger]');

  container.querySelector('#view-all-tasks')?.addEventListener('click', () => router.navigate('/student/tasks'));
  container.querySelector('#view-shop')?.addEventListener('click', () => router.navigate('/student/shop'));
  container.querySelectorAll('.task-submit-btn').forEach((button) => {
    button.addEventListener('click', () => router.navigate('/student/tasks'));
  });

  showBottomNav('child', 'home');
}

function decorateDashboardTask(task) {
  const completionSummary = task.completion_summary || task.completionSummary || {};
  const completionStatus = task.completion_status || task.completionStatus || completionSummary.status || 'todo';
  const currentSubmission = task.currentSubmission || task.todaySubmission || completionSummary.currentSubmission || null;
  const canSubmitNow = typeof completionSummary.canSubmitNow === 'boolean'
    ? completionSummary.canSubmitNow
    : (!currentSubmission || currentSubmission.status === 'rejected');

  return {
    ...task,
    completionStatus,
    currentSubmission,
    canSubmitNow,
    isCompleted: completionStatus === 'completed',
    cardClass: dashboardTaskCardClass(completionStatus),
    statusClass: dashboardTaskStatusClass(completionStatus),
    statusText: dashboardTaskStatusText(completionStatus),
  };
}

function dashboardTaskRank(task) {
  if (task.canSubmitNow) return 0;
  if (task.completionStatus === 'pending') return 1;
  if (task.completionStatus === 'completed') return 2;
  return 3;
}

function dashboardTaskCardClass(status) {
  return ({
    completed: 'is-completed',
    pending: 'is-pending',
    rejected: 'is-rejected',
  })[status] || '';
}

function dashboardTaskStatusClass(status) {
  return ({
    completed: 'status-completed',
    pending: 'status-pending',
    rejected: 'status-rejected',
    partial: 'status-todo',
    todo: 'status-todo',
    overdue: 'status-muted',
    upcoming: 'status-muted',
  })[status] || 'status-muted';
}

function dashboardTaskStatusText(status) {
  return ({
    completed: '本周期已完成，不能重复提交',
    pending: '已经提交，等待家长审核',
    rejected: '被驳回了，可以重新提交',
    partial: '还差一部分，继续完成',
    todo: '还没提交，完成后去打卡',
    overdue: '这个周期已经结束',
    upcoming: '还没到可提交时间',
  })[status] || '查看任务详情';
}

function renderDashboardTaskAction(task) {
  if (task.isCompleted) {
    return `<span class="task-card-action state-completed">${icon('checkCircle', 14)} 已完成</span>`;
  }

  if (task.completionStatus === 'pending') {
    return `<span class="task-card-action state-pending">${icon('clock', 14)} 审核中</span>`;
  }

  if (!task.canSubmitNow) {
    return `<span class="task-card-action state-muted">${task.completionStatus === 'upcoming' ? '未开始' : '暂不可交'}</span>`;
  }

  const cta = task.completionStatus === 'rejected'
    ? '去重提'
    : task.completionStatus === 'partial'
      ? '继续完成'
      : '去提交';

  return `<button class="btn btn-primary btn-sm task-submit-btn" data-task-id="${task.id}">${cta}</button>`;
}
