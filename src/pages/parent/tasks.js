import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { toast } from '../../utils/notification.js';
import { staggerIn, haptic } from '../../utils/animations.js';
import { showBottomNav } from '../../utils/nav.js';
import { escapeHtml } from '../../utils/escape.js';
import {
  cancelExpandableAnimations,
  queueExpandableFrame,
  registerHeightTransitionEnd,
} from '../../utils/expandable-transition.js';

const TASK_TYPES = ['all', 'daily', 'weekly', 'once', 'semester'];

export async function renderParentTasks(container) {
  container.innerHTML = '<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>';
  await auth.refreshUser();

  const state = {
    tasks: [],
    children: [],
    activeType: 'all',
    expandedTaskId: null,
  };

  await loadData();
  render();

  async function loadData() {
    const [tasks, users] = await Promise.all([store.getTasks(), store.getFamilyUsers()]);
    state.tasks = tasks || [];
    state.children = (users || []).filter((user) => user.role === 'child');
  }

  function getVisibleTasks() {
    return state.activeType === 'all'
      ? state.tasks
      : state.tasks.filter((task) => task.type === state.activeType);
  }

  function render() {
    const tasks = getVisibleTasks();

    if (state.expandedTaskId && !tasks.some((task) => task.id === state.expandedTaskId)) {
      state.expandedTaskId = null;
    }

    const overdueCount = state.tasks.filter((task) => (task.completion_overview?.overdueChildren || 0) > 0).length;

    container.innerHTML = `
      <div class="page parent-tasks-page">
        <div class="page-header parent-tasks-head">
          <div>
            <h1 class="page-title">任务管理</h1>
            <p class="page-subtitle">默认收起，卡片只保留必要信息，点开再看完整状态</p>
          </div>
          <button class="btn btn-primary btn-sm" id="task-add-btn">${icon('plus', 16)} 新建任务</button>
        </div>

        <div class="task-summary-strip">
          <span class="summary-chip">${state.tasks.length} 个任务</span>
          <span class="summary-chip">${state.children.length} 个孩子</span>
          <span class="summary-chip ${overdueCount ? 'is-alert' : ''}">${overdueCount} 个逾期</span>
        </div>

        <div class="tabs task-tabs compact-task-tabs">
          ${TASK_TYPES.map((type) => `
            <button class="tab ${state.activeType === type ? 'active' : ''}" data-filter="${type}" type="button">
              ${taskTypeLabel(type)}
              <span class="tab-count">${type === 'all' ? state.tasks.length : state.tasks.filter((task) => task.type === type).length}</span>
            </button>
          `).join('')}
        </div>

        <div class="task-manage-list">
          ${tasks.length ? tasks.map((task) => taskCard(task, task.id === state.expandedTaskId)).join('') : `
            <div class="empty-state">
              ${icon('tasks', 48)}
              <h3>还没有任务</h3>
              <p>支持给单个孩子布置任务，也支持全部孩子一起完成。</p>
            </div>
          `}
        </div>
      </div>

      <div class="modal-overlay" id="task-modal" style="display:none">
        <div class="modal-content task-modal">
          <div class="modal-handle"></div>
          <div id="task-modal-body"></div>
        </div>
      </div>

      <style>
        .parent-tasks-page { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }
        .parent-tasks-head { display:flex; justify-content:space-between; align-items:flex-start; gap:var(--space-3); padding-bottom:var(--space-3); }
        .task-summary-strip { display:flex; flex-wrap:wrap; gap:var(--space-2); margin-bottom:var(--space-3); }
        .summary-chip { display:inline-flex; align-items:center; padding:6px 11px; border-radius:999px; background:color-mix(in srgb, var(--color-text-primary) 6%, transparent); color:var(--color-text-secondary); font-size:11px; font-weight:var(--weight-semibold); }
        .summary-chip.is-alert { background:var(--color-danger-soft); color:var(--color-danger); }
        .task-tabs { margin-bottom:var(--space-3); overflow:auto; padding-bottom:2px; }
        .task-manage-list { display:grid; gap:10px; }
        .manage-task-card { background:var(--color-surface); border-radius:22px; border:1px solid color-mix(in srgb, var(--color-text-primary) 7%, transparent); box-shadow:var(--shadow-sm); overflow:hidden; transform:translateZ(0); will-change:transform, box-shadow; transition:border-color .34s cubic-bezier(.16, 1, .3, 1), box-shadow .34s cubic-bezier(.16, 1, .3, 1), transform .34s cubic-bezier(.16, 1, .3, 1); }
        .manage-task-card.is-expanded { border-color:color-mix(in srgb, var(--color-primary) 22%, transparent); box-shadow:0 22px 44px rgba(15, 23, 42, .1); transform:translateY(-2px); }
        .manage-task-body { padding:12px 14px; }
        .manage-task-strip { display:flex; align-items:center; gap:10px; }
        .manage-task-main { min-width:0; flex:1; display:grid; gap:7px; }
        .manage-task-headline { display:flex; align-items:center; gap:8px; min-width:0; }
        .task-type-badge { flex-shrink:0; }
        .manage-task-title { margin:0; min-width:0; font-size:14px; line-height:1.25; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .manage-task-brief { font-size:11px; color:var(--color-text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .manage-task-requirement { font-size:13px; line-height:1.45; color:var(--color-text-primary); font-weight:var(--weight-medium); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .manage-task-side { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .task-points-pill, .task-status-mini, .task-toggle-btn { display:inline-flex; align-items:center; gap:4px; height:30px; border-radius:999px; padding:0 10px; font-size:11px; font-weight:var(--weight-semibold); }
        .task-points-pill { background:color-mix(in srgb, var(--color-primary) 10%, transparent); color:var(--color-primary); }
        .task-status-mini { background:color-mix(in srgb, var(--color-text-primary) 6%, transparent); color:var(--color-text-secondary); }
        .task-status-mini.is-good { background:var(--color-success-soft); color:var(--color-success); }
        .task-status-mini.is-warn { background:var(--color-warning-soft); color:var(--color-warning); }
        .task-status-mini.is-bad { background:var(--color-danger-soft); color:var(--color-danger); }
        .task-status-mini.is-live { background:color-mix(in srgb, var(--color-primary) 12%, transparent); color:var(--color-primary); }
        .task-toggle-btn { border:none; background:color-mix(in srgb, var(--color-text-primary) 6%, transparent); color:var(--color-text-secondary); }
        .task-toggle-label { letter-spacing:.01em; }
        .task-toggle-icon { display:inline-flex; transition:transform .42s cubic-bezier(.16, 1, .3, 1); }
        .manage-task-card.is-expanded .task-toggle-icon { transform:rotate(90deg); }
        .task-detail-shell { overflow:hidden; }
        .task-detail-panel { min-height:0; height:0; opacity:0; transform:translateY(-10px); overflow:hidden; will-change:height, opacity, transform; transition:height .42s cubic-bezier(.16, 1, .3, 1), opacity .24s ease, transform .42s cubic-bezier(.16, 1, .3, 1); }
        .manage-task-card.is-expanded .task-detail-panel { opacity:1; transform:translateY(0); }
        .task-detail { padding:12px 14px 14px; border-top:1px solid color-mix(in srgb, var(--color-text-primary) 7%, transparent); display:grid; gap:10px; }
        .detail-meta { display:flex; flex-wrap:wrap; gap:6px; }
        .detail-chip { display:inline-flex; align-items:center; gap:5px; padding:5px 10px; border-radius:999px; background:color-mix(in srgb, var(--color-text-primary) 6%, transparent); color:var(--color-text-secondary); font-size:11px; }
        .detail-chip.is-danger { background:var(--color-danger-soft); color:var(--color-danger); }
        .child-status-list { display:grid; gap:4px; }
        .child-status-row { display:grid; grid-template-columns:minmax(0, 170px) minmax(0, 1fr); gap:12px; align-items:center; padding:9px 0; border-top:1px solid color-mix(in srgb, var(--color-text-primary) 6%, transparent); }
        .child-status-row:first-child { border-top:none; padding-top:2px; }
        .child-status-name { display:flex; align-items:center; gap:9px; min-width:0; }
        .child-avatar { width:28px; height:28px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; background:color-mix(in srgb, var(--color-primary) 10%, transparent); font-size:14px; flex-shrink:0; }
        .child-name-wrap { min-width:0; }
        .child-name { font-size:13px; font-weight:var(--weight-semibold); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .child-caption { font-size:11px; color:var(--color-text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .child-slot-row { display:flex; flex-wrap:nowrap; justify-content:flex-end; gap:6px; min-width:0; overflow-x:auto; overflow-y:hidden; scrollbar-width:none; -ms-overflow-style:none; padding-bottom:2px; }
        .child-slot-row::-webkit-scrollbar { display:none; }
        .status-pill, .slot-pill { display:inline-flex; align-items:center; gap:4px; padding:5px 9px; border-radius:999px; font-size:11px; font-weight:var(--weight-semibold); flex:0 0 auto; white-space:nowrap; }
        .status-pill.completed, .slot-pill.completed { background:var(--color-success-soft); color:var(--color-success); }
        .status-pill.partial, .slot-pill.partial { background:color-mix(in srgb, var(--color-primary) 14%, transparent); color:var(--color-primary); }
        .status-pill.pending, .slot-pill.pending { background:var(--color-warning-soft); color:var(--color-warning); }
        .status-pill.overdue, .slot-pill.overdue, .slot-pill.missed { background:var(--color-danger-soft); color:var(--color-danger); }
        .status-pill.todo, .status-pill.rejected, .status-pill.upcoming, .slot-pill.todo, .slot-pill.rejected, .slot-pill.upcoming { background:color-mix(in srgb, var(--color-text-primary) 7%, transparent); color:var(--color-text-secondary); }
        .child-empty { padding:6px 0 2px; color:var(--color-text-secondary); font-size:12px; }
        .manage-task-actions { display:flex; justify-content:flex-end; gap:8px; padding-top:2px; }
        .task-modal { max-height:86vh; overflow:auto; width:min(680px, calc(100vw - 24px)); }
        .task-form-head { margin-bottom:2px; }
        .task-form-caption { font-size:12px; color:var(--color-text-secondary); margin-top:4px; }
        .option-grid { display:grid; gap:12px; }
        .option-grid.two { grid-template-columns:repeat(2, minmax(0, 1fr)); }
        .option-grid.tight { gap:8px; }
        .form-block { padding:12px; border-radius:18px; border:1px solid color-mix(in srgb, var(--color-text-primary) 8%, transparent); background:color-mix(in srgb, var(--color-surface) 96%, white); display:grid; gap:10px; }
        .form-block.soft { background:color-mix(in srgb, var(--color-primary) 5%, transparent); }
        .form-block.danger { border-color:color-mix(in srgb, var(--color-danger) 24%, transparent); background:color-mix(in srgb, var(--color-danger) 7%, transparent); }
        .form-block-title { font-size:12px; font-weight:var(--weight-semibold); color:var(--color-text-secondary); text-transform:uppercase; letter-spacing:.04em; }
        .choice-btn { border:1px solid color-mix(in srgb, var(--color-text-primary) 10%, transparent); border-radius:16px; background:var(--color-surface); padding:10px 11px; text-align:left; display:grid; gap:6px; }
        .choice-btn.active { border-color:color-mix(in srgb, var(--color-primary) 45%, transparent); background:color-mix(in srgb, var(--color-primary) 8%, transparent); }
        .choice-title { font-size:13px; font-weight:var(--weight-semibold); }
        .choice-help { font-size:11px; color:var(--color-text-secondary); line-height:1.45; }
        .toggle-card { border:1px solid color-mix(in srgb, var(--color-text-primary) 10%, transparent); border-radius:18px; padding:12px; display:grid; gap:10px; }
        .toggle-card.is-on { border-color:color-mix(in srgb, var(--color-danger) 35%, transparent); background:color-mix(in srgb, var(--color-danger) 8%, transparent); }
        .toggle-row { display:flex; justify-content:space-between; align-items:center; gap:var(--space-3); }
        .toggle-copy { display:grid; gap:4px; }
        .toggle-copy strong { font-size:14px; }
        .toggle-copy span { font-size:11px; color:var(--color-text-secondary); line-height:1.5; }
        .toggle-btn { width:52px; height:30px; border-radius:999px; border:none; background:color-mix(in srgb, var(--color-text-primary) 16%, transparent); position:relative; }
        .toggle-btn::after { content:''; position:absolute; top:4px; left:4px; width:24px; height:24px; border-radius:50%; background:#fff; box-shadow:var(--shadow-sm); transition:transform .2s ease; }
        .toggle-btn.is-on { background:var(--color-danger); }
        .toggle-btn.is-on::after { transform:translateX(20px); }
        .form-actions { display:flex; gap:10px; }
        .form-actions .btn { flex:1; }
        @media (max-width:760px) {
          .child-status-row { grid-template-columns:1fr; align-items:flex-start; }
          .child-slot-row { justify-content:flex-start; }
        }
        @media (max-width:640px) {
          .parent-tasks-head { flex-direction:column; }
          .manage-task-strip { align-items:flex-start; }
        .manage-task-side { flex-wrap:wrap; justify-content:flex-end; max-width:130px; }
        .option-grid.two { grid-template-columns:1fr; }
        }
      </style>
    `;

    bindTasks(tasks);
    primeExpandedCards();
    showBottomNav('parent', 'tasks');
    staggerIn(container, '[data-stagger]');
  }

  function bindTasks(visibleTasks) {
    container.querySelector('#task-add-btn')?.addEventListener('click', () => openTaskModal());

    container.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
      state.activeType = button.dataset.filter;
      render();
    }));

    container.querySelectorAll('[data-expand]').forEach((button) => button.addEventListener('click', () => {
      toggleTaskCard(button.dataset.expand);
    }));

    container.querySelectorAll('[data-edit]').forEach((button) => button.addEventListener('click', () => {
      const task = visibleTasks.find((item) => item.id === button.dataset.edit);
      if (task) openTaskModal(task);
    }));

    container.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', async () => {
      const task = visibleTasks.find((item) => item.id === button.dataset.delete);
      if (!task || !confirm(`确定删除“${task.title}”吗？`)) return;

      try {
        await store.deleteTask(task.id);
        toast('任务已删除', 'info');
        state.expandedTaskId = null;
        await loadData();
        render();
      } catch (error) {
        toast(error.message || '删除失败，请稍后重试', 'error');
      }
    }));
  }

  function toggleTaskCard(taskId) {
    const nextExpanded = state.expandedTaskId !== taskId;

    if (state.expandedTaskId && state.expandedTaskId !== taskId) {
      const currentCard = container.querySelector(`.manage-task-card[data-task-id="${state.expandedTaskId}"]`);
      if (currentCard) setCardExpanded(currentCard, false);
    }

    const targetCard = container.querySelector(`.manage-task-card[data-task-id="${taskId}"]`);
    if (!targetCard) return;

    setCardExpanded(targetCard, nextExpanded);
    state.expandedTaskId = nextExpanded ? taskId : null;
  }

  function setCardExpanded(card, expanded) {
    card.classList.toggle('is-expanded', expanded);
    animateTaskDetail(card, expanded);

    const toggleLabel = card.querySelector('.task-toggle-label');
    if (toggleLabel) {
      toggleLabel.textContent = expanded ? '收起' : '详情';
    }

    const toggleButton = card.querySelector('[data-expand]');
    if (toggleButton) {
      toggleButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
  }

  function primeExpandedCards() {
    container.querySelectorAll('.manage-task-card').forEach((card) => {
      const panel = card.querySelector('.task-detail-panel');
      const detail = card.querySelector('.task-detail');
      if (!panel || !detail) return;

      if (card.classList.contains('is-expanded')) {
        panel.style.height = 'auto';
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      } else {
        panel.style.height = '0px';
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(-10px)';
      }
    });
  }

  function animateTaskDetail(card, expanded) {
    const panel = card.querySelector('.task-detail-panel');
    const detail = card.querySelector('.task-detail');
    if (!panel || !detail) return;

    cancelExpandableAnimations(panel);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      panel.style.willChange = '';
      panel.style.height = expanded ? 'auto' : '0px';
      panel.style.opacity = expanded ? '1' : '0';
      panel.style.transform = expanded ? 'translateY(0)' : 'translateY(-10px)';
      return;
    }

    const computed = window.getComputedStyle(panel);
    const currentHeight = panel.style.height === 'auto'
      ? detail.scrollHeight
      : panel.offsetHeight;

    panel.style.willChange = 'height, opacity, transform';
    panel.style.height = `${currentHeight}px`;
    panel.style.opacity = computed.opacity;
    panel.style.transform = computed.transform !== 'none'
      ? computed.transform
      : (expanded ? 'translateY(-10px)' : 'translateY(0)');

    if (expanded) {
      queueExpandableFrame(panel, () => {
        panel.style.height = `${detail.scrollHeight}px`;
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      });
    } else {
      queueExpandableFrame(panel, () => {
        panel.style.height = '0px';
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(-10px)';
      });
    }

    registerHeightTransitionEnd(panel, () => {
      panel.style.willChange = '';
      if (card.classList.contains('is-expanded')) {
        panel.style.height = 'auto';
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
      } else {
        panel.style.height = '0px';
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(-10px)';
      }
    });
  }

  function openTaskModal(task = null) {
    const modal = container.querySelector('#task-modal');
    const body = container.querySelector('#task-modal-body');
    let selectedType = task?.type || 'daily';
    let weeklyRule = task?.weekly_rule || 'sunday';
    let penaltyEnabled = Boolean(task?.penalty_enabled);
    const draft = {
      title: task?.title || '',
      description: task?.description || '',
      points: Number(task?.points) || '',
      targetChildId: task?.target_child_id || '',
      penaltyPoints: Number(task?.penalty_points) || '',
    };

    modal.style.display = 'flex';
    paint();
    modal.onclick = (event) => {
      if (event.target === modal) closeModal();
    };

    async function submitForm(event) {
      event.preventDefault();

      const submitBtn = body.querySelector('#task-submit');
      const title = body.querySelector('#task-title').value.trim();
      const description = body.querySelector('#task-description').value.trim();
      const points = Number(body.querySelector('#task-points').value);
      const penaltyPoints = Number(body.querySelector('#task-penalty-points').value || 0);
      const payload = {
        title,
        description,
        type: selectedType,
        weekly_rule: weeklyRule,
        points,
        target_child_id: body.querySelector('#task-target').value || null,
        penalty_enabled: penaltyEnabled,
        penalty_points: penaltyEnabled ? penaltyPoints : 0,
      };

      if (!title) return toast('请填写任务名称', 'warning');
      if (!Number.isInteger(points) || points < 1) return toast('奖励积分至少为 1 分', 'warning');
      if (penaltyEnabled && (!Number.isInteger(penaltyPoints) || penaltyPoints < 1)) {
        return toast('请填写有效的惩罚扣分', 'warning');
      }

      submitBtn.disabled = true;
      submitBtn.textContent = task ? '保存中...' : '创建中...';

      try {
        if (task) {
          await store.updateTask(task.id, payload);
          toast('任务已更新', 'success');
        } else {
          await store.createTask(payload);
          haptic('success');
          toast('任务已创建', 'success');
        }

        closeModal();
        await loadData();
        render();
      } catch (error) {
        submitBtn.disabled = false;
        submitBtn.textContent = task ? '保存修改' : '创建任务';
        toast(error.message || '保存失败，请稍后重试', 'error');
      }
    }

    function closeModal() {
      modal.style.display = 'none';
      modal.onclick = null;
    }

    function paint() {
      draft.title = body.querySelector('#task-title')?.value ?? draft.title;
      draft.description = body.querySelector('#task-description')?.value ?? draft.description;
      draft.points = body.querySelector('#task-points')?.value ?? draft.points;
      draft.targetChildId = body.querySelector('#task-target')?.value ?? draft.targetChildId;
      draft.penaltyPoints = body.querySelector('#task-penalty-points')?.value ?? draft.penaltyPoints;

      body.innerHTML = `
        <div class="task-form-head">
          <h2 class="modal-title">${task ? '编辑任务' : '新建任务'}</h2>
          <p class="task-form-caption">关键信息都在这里，更多完成状态留在任务详情里查看。</p>
        </div>
        <form id="task-form" class="option-grid">
          <div class="option-grid two">
            <div class="input-group" style="margin:0">
              <label class="input-label">任务名称</label>
              <input class="input" id="task-title" maxlength="60" value="${escapeHtml(draft.title)}" placeholder="例如：完成数学作业" required />
            </div>
            <div class="input-group" style="margin:0">
              <label class="input-label">奖励积分</label>
              <input class="input" id="task-points" type="number" min="1" max="9999" value="${draft.points}" placeholder="20" required />
            </div>
          </div>

          <div class="form-block soft">
            <div class="form-block-title">任务周期</div>
            <div class="option-grid two tight">
              ${typeOption('daily', selectedType, '每日', '每天一次')}
              ${typeOption('weekly', selectedType, '每周', '支持三种规则')}
              ${typeOption('once', selectedType, '单次', '当天完成')}
              ${typeOption('semester', selectedType, '学期', '长期目标')}
            </div>
          </div>

          <div class="form-block" id="weekly-wrap" style="${selectedType === 'weekly' ? '' : 'display:none'}">
            <div class="form-block-title">每周规则</div>
            <div class="option-grid tight">
              ${ruleOption('sunday', weeklyRule, '周日结束前完成', '本周内完成一次即可')}
              ${ruleOption('saturday', weeklyRule, '周六结束前完成', '周六 24:00 后就算逾期')}
              ${ruleOption('weekend_twice', weeklyRule, '周六和周日都要完成一次', '系统会拆成两个周末时段统计')}
            </div>
          </div>

          <div class="option-grid two">
            <div class="input-group" style="margin:0">
              <label class="input-label">需要谁完成</label>
              <select class="input" id="task-target">
                <option value="">全部孩子一起完成</option>
                ${state.children.map((child) => `
                  <option value="${child.id}" ${draft.targetChildId === child.id ? 'selected' : ''}>
                    ${escapeHtml(child.avatar || '🙂')} ${escapeHtml(child.username)}
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="input-group" style="margin:0">
              <label class="input-label">补充说明</label>
              <input class="input" id="task-description" maxlength="200" value="${escapeHtml(draft.description)}" placeholder="可选，展开详情后再看" />
            </div>
          </div>

          <div class="toggle-card ${penaltyEnabled ? 'is-on form-block danger' : 'form-block'}">
            <div class="toggle-row">
              <div class="toggle-copy">
                <strong>未完成惩罚 ${penaltyEnabled ? '已启用' : '已关闭'}</strong>
                <span>${escapeHtml(penaltyHint(selectedType, weeklyRule))}</span>
              </div>
              <button type="button" class="toggle-btn ${penaltyEnabled ? 'is-on' : ''}" id="penalty-toggle" aria-label="切换惩罚"></button>
            </div>
            <div class="input-group" id="penalty-fields" style="${penaltyEnabled ? '' : 'display:none'};margin:0">
              <label class="input-label">扣分值</label>
              <input class="input" id="task-penalty-points" type="number" min="1" max="9999" value="${draft.penaltyPoints}" placeholder="例如 5" />
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-secondary" type="button" id="task-cancel">取消</button>
            <button class="btn btn-primary" type="submit" id="task-submit">${task ? '保存修改' : '创建任务'}</button>
          </div>
        </form>
      `;

      body.querySelectorAll('[data-type-option]').forEach((button) => button.addEventListener('click', () => {
        selectedType = button.dataset.typeOption;
        paint();
      }));

      body.querySelectorAll('[data-rule-option]').forEach((button) => button.addEventListener('click', () => {
        weeklyRule = button.dataset.ruleOption;
        paint();
      }));

      body.querySelector('#task-form').addEventListener('submit', submitForm);
      body.querySelector('#task-cancel').addEventListener('click', closeModal);
      body.querySelector('#penalty-toggle').addEventListener('click', () => {
        penaltyEnabled = !penaltyEnabled;
        paint();
      });
    }
  }
}

function taskCard(task, expanded) {
  const overview = task.completion_overview || {};
  const children = task.target_children_statuses || [];
  const totalChildren = task.target_child_id ? 1 : Math.max(children.length, 0);
  const compactStatusState = compactStatus(overview, totalChildren);

  return `
    <article class="manage-task-card ${expanded ? 'is-expanded' : ''}" data-stagger data-task-id="${task.id}">
      <div class="manage-task-body">
        <div class="manage-task-strip">
          <div class="manage-task-main">
            <div class="manage-task-headline">
              <span class="badge badge-${taskBadge(task.type)} task-type-badge">${taskTypeLabel(task.type)}</span>
              <h3 class="manage-task-title">${escapeHtml(task.title)}</h3>
            </div>
            <div class="manage-task-brief">${escapeHtml(compactTaskBrief(task, children))}</div>
            ${task.description ? `<div class="manage-task-requirement">${escapeHtml(task.description)}</div>` : ''}
          </div>
          <div class="manage-task-side">
            <span class="task-points-pill">+${task.points}</span>
            <span class="task-status-mini ${compactStatusState.tone}">${escapeHtml(compactStatusState.text)}</span>
            <button class="task-toggle-btn" type="button" data-expand="${task.id}" aria-expanded="${expanded ? 'true' : 'false'}">
              <span class="task-toggle-label">${expanded ? '收起' : '详情'}</span>
              <span class="task-toggle-icon">${icon('chevronRight', 14)}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="task-detail-shell">
        <div class="task-detail-panel">
          <div class="task-detail">
            <div class="detail-meta">
              <span class="detail-chip">${icon('users', 14)} ${escapeHtml(targetDetailLabel(task, children))}</span>
              <span class="detail-chip">${icon('repeat', 14)} ${escapeHtml(taskRuleLabel(task))}</span>
              <span class="detail-chip ${task.penalty_enabled ? 'is-danger' : ''}">
                ${task.penalty_enabled ? `未完成扣 ${task.penalty_points} 分` : '未开启惩罚'}
              </span>
            </div>

            ${children.length ? `
              <div class="child-status-list">
                ${children.map((child) => `
                  <div class="child-status-row">
                    <div class="child-status-name">
                      <span class="child-avatar">${escapeHtml(child.child_avatar || '🙂')}</span>
                      <div class="child-name-wrap">
                        <div class="child-name">${escapeHtml(child.child_name || '未命名')}</div>
                        <div class="child-caption">${escapeHtml(caption(child.completion_summary))}</div>
                      </div>
                    </div>
                    <div class="child-slot-row">
                      ${(child.completion_summary?.slots || []).map((slot) => `
                        <span class="slot-pill ${slot.status}">${escapeHtml(slotLabel(slot.label))} · ${escapeHtml(statusLabel(slot.status))}</span>
                      `).join('')}
                      <span class="status-pill ${child.completion_status}">${escapeHtml(statusLabel(child.completion_status))}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : '<div class="child-empty">当前还没有孩子成员。</div>'}

            <div class="manage-task-actions">
              <button class="btn btn-ghost btn-sm" type="button" data-edit="${task.id}">${icon('edit', 14)} 编辑</button>
              <button class="btn btn-ghost btn-sm" type="button" data-delete="${task.id}" style="color:var(--color-danger)">${icon('trash', 14)} 删除</button>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function typeOption(value, active, title, help) {
  return `
    <button type="button" class="choice-btn ${active === value ? 'active' : ''}" data-type-option="${value}">
      <span class="choice-title">${title}</span>
      <span class="choice-help">${help}</span>
    </button>
  `;
}

function ruleOption(value, active, title, help) {
  return `
    <button type="button" class="choice-btn ${active === value ? 'active' : ''}" data-rule-option="${value}">
      <span class="choice-title">${title}</span>
      <span class="choice-help">${help}</span>
    </button>
  `;
}

function taskTypeLabel(type) {
  return ({ all: '全部', daily: '每日', weekly: '每周', once: '单次', semester: '学期' })[type] || type;
}

function taskBadge(type) {
  return ({ daily: 'primary', weekly: 'warning', once: 'success', semester: 'danger' })[type] || 'primary';
}

function taskRuleLabel(task) {
  if (task.type === 'weekly') {
    if (task.weekly_rule === 'saturday') return '每周任务 · 周六截止';
    if (task.weekly_rule === 'weekend_twice') return '每周任务 · 周六和周日各一次';
    return '每周任务 · 周日截止';
  }

  if (task.type === 'daily') return '每日任务 · 每天一次';
  if (task.type === 'once') return '单次任务 · 当天截止';
  return '学期任务 · 学期内完成';
}

function compactTaskBrief(task, children) {
  const target = task.target_child_id
    ? (children[0]?.child_name || '指定孩子')
    : `${Math.max(children.length, 0)} 人任务`;

  return `${target} · ${compactRuleLabel(task)}`;
}

function compactRuleLabel(task) {
  if (task.type === 'weekly') {
    if (task.weekly_rule === 'saturday') return '周六前完成';
    if (task.weekly_rule === 'weekend_twice') return '周末两次';
    return '周日前完成';
  }

  if (task.type === 'daily') return '每天一次';
  if (task.type === 'once') return '当天完成';
  return '学期内完成';
}

function targetDetailLabel(task, children) {
  if (task.target_child_id) {
    return children[0]?.child_name || '指定孩子';
  }

  return children.length ? `全部孩子 (${children.length}人)` : '全部孩子';
}

function compactStatus(overview = {}, totalChildren = 0) {
  if (overview.overdueChildren > 0) {
    return { tone: 'is-bad', text: `逾期 ${overview.overdueChildren}` };
  }

  if (overview.pendingChildren > 0) {
    return { tone: 'is-warn', text: `待审 ${overview.pendingChildren}` };
  }

  if (overview.partialChildren > 0) {
    return { tone: 'is-live', text: `进行中 ${overview.partialChildren}` };
  }

  if (overview.completedChildren > 0 && totalChildren > 0 && overview.completedChildren >= totalChildren) {
    return { tone: 'is-good', text: '全部完成' };
  }

  if (overview.completedChildren > 0) {
    return { tone: 'is-live', text: `完成 ${overview.completedChildren}/${Math.max(totalChildren, overview.completedChildren)}` };
  }

  return { tone: 'is-muted', text: '未提交' };
}

function penaltyHint(type, weeklyRule) {
  if (type === 'daily') return '每日任务在当天 24:00 后检查，未完成才会扣分。';
  if (type === 'once') return '单次任务在创建当天 24:00 后检查，过期后自动扣分。';
  if (type === 'semester') return '学期任务会在当前学期结束后统一检查并扣分。';
  if (weeklyRule === 'saturday') return '每周任务会在周六 24:00 后检查，未完成则自动扣分。';
  if (weeklyRule === 'weekend_twice') return '系统会在周六和周日结束后各检查一次，缺一次就扣一次分。';
  return '每周任务会在周日 24:00 后检查，未完成才会扣分。';
}

function statusLabel(status) {
  return ({
    completed: '已完成',
    partial: '部分完成',
    pending: '待审核',
    overdue: '已逾期',
    rejected: '待重提',
    missed: '未完成',
    todo: '未提交',
    upcoming: '未开始',
  })[status] || '未提交';
}

function slotLabel(label) {
  return ({
    saturday_deadline: '周六前',
    saturday: '周六',
    sunday: '周日',
    daily: '今天',
    once: '单次',
    semester: '学期',
  })[label] || '本周期';
}

function caption(summary = {}) {
  const required = Number(summary.requiredCount) || 0;
  const completed = Number(summary.completedCount) || 0;
  const pending = Number(summary.pendingCount) || 0;

  if (!required) return '当前周期暂无要求';
  if (pending > 0) return `已完成 ${completed}/${required}，还有内容待审核`;
  return `已完成 ${completed}/${required}`;
}
