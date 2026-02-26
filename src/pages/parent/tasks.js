// ========================================
// 家长端 — 任务管理
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { router } from '../../utils/router.js';
import { toast } from '../../utils/notification.js';
import { staggerIn, haptic } from '../../utils/animations.js';
import { showBottomNav } from '../../utils/nav.js';

export async function renderParentTasks(container) {
  container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>`;

  await auth.refreshUser();
  const familyCode = auth.getFamilyCode();
  const userId = auth.getUserId();

  const tasks = await store.getTasks();

  function render() {

    container.innerHTML = `
      <div class="page parent-tasks-page">
        <div class="page-header" style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <h1 class="page-title">任务管理</h1>
            <p class="page-subtitle">${tasks.length} 个进行中的任务</p>
          </div>
          <button class="btn btn-primary" id="add-task-btn">
            ${icon('plus', 18)} 新建
          </button>
        </div>

        <div class="task-manage-list" id="task-list">
          ${tasks.map(task => `
            <div class="manage-task-card" data-stagger>
              <div class="manage-task-header">
                <span class="badge badge-${task.type === 'daily' ? 'primary' : task.type === 'weekly' ? 'warning' : task.type === 'semester' ? 'danger' : 'success'}">
                  ${task.type === 'daily' ? '每日' : task.type === 'weekly' ? '每周' : task.type === 'semester' ? '学期' : '单次'}
                </span>
                <span class="points-display">+${task.points}</span>
              </div>
              <h3 class="manage-task-title">${task.title}</h3>
              <p class="manage-task-desc">${task.description || '无描述'}</p>
              <div class="manage-task-actions">
                <button class="btn btn-ghost btn-sm edit-task-btn" data-task-id="${task.id}">
                  ${icon('edit', 14)} 编辑
                </button>
                <button class="btn btn-ghost btn-sm delete-task-btn" data-task-id="${task.id}" style="color:var(--color-danger)">
                  ${icon('trash', 14)} 删除
                </button>
              </div>
            </div>
          `).join('')}
          ${tasks.length === 0 ? `
            <div class="empty-state">
              ${icon('tasks', 48)}
              <h3>还没有创建任务</h3>
              <p>点击"新建"发布任务给孩子</p>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- 新建/编辑任务弹窗 -->
      <div class="modal-overlay" id="task-modal" style="display:none">
        <div class="modal-content">
          <div class="modal-handle"></div>
          <div id="task-modal-body"></div>
        </div>
      </div>

      <style>
        .parent-tasks-page { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }

        .task-manage-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .manage-task-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          box-shadow: var(--shadow-sm);
        }

        .manage-task-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-2);
        }

        .manage-task-title {
          font-size: var(--text-md);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--space-1);
        }

        .manage-task-desc {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin-bottom: var(--space-3);
        }

        .manage-task-actions {
          display: flex;
          gap: var(--space-2);
          justify-content: flex-end;
        }
      </style>
    `;

    // 新建任务
    container.querySelector('#add-task-btn').onclick = () => showTaskModal();

    // 编辑
    container.querySelectorAll('.edit-task-btn').forEach(btn => {
      btn.onclick = () => {
        const task = store.getTaskById(btn.dataset.taskId);
        if (task) showTaskModal(task);
      };
    });

    // 删除
    container.querySelectorAll('.delete-task-btn').forEach(btn => {
      btn.onclick = async () => {
        if (confirm('确定删除这个任务吗？')) {
          const btnEl = btn;
          btnEl.disabled = true;
          await store.deleteTask(btn.dataset.taskId);
          haptic('medium');
          toast('任务已删除', 'info');
          renderParentTasks(container);
        }
      };
    });

    staggerIn(container, '[data-stagger]');
    showBottomNav('parent', 'tasks');
  }

  function showTaskModal(editTask = null) {
    const modal = container.querySelector('#task-modal');
    const body = container.querySelector('#task-modal-body');
    modal.style.display = 'flex';

    body.innerHTML = `
      <h2 class="modal-title">${editTask ? '编辑任务' : '新建任务'}</h2>
      <form id="task-form">
        <div class="input-group">
          <label class="input-label">任务名称</label>
          <input class="input" type="text" id="task-title" placeholder="如：完成数学作业" value="${editTask?.title || ''}" required />
        </div>
        <div class="input-group">
          <label class="input-label">任务描述</label>
          <textarea class="input" id="task-desc" placeholder="详细描述任务要求" rows="3" style="resize:none">${editTask?.description || ''}</textarea>
        </div>
        <div class="input-group">
          <label class="input-label">任务类型</label>
          <div class="tabs" style="margin-bottom:0">
            <button class="tab ${(!editTask || editTask.type === 'daily') ? 'active' : ''}" type="button" data-type="daily">每日</button>
            <button class="tab ${editTask?.type === 'weekly' ? 'active' : ''}" type="button" data-type="weekly">每周</button>
            <button class="tab ${editTask?.type === 'once' ? 'active' : ''}" type="button" data-type="once">单次</button>
            <button class="tab ${editTask?.type === 'semester' ? 'active' : ''}" type="button" data-type="semester">学期</button>
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">积分奖励</label>
          <input class="input" type="number" id="task-points" placeholder="如：20" value="${editTask?.points || ''}" min="1" max="9999" required />
        </div>
        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4)">
          <button class="btn btn-secondary btn-lg" style="flex:1" type="button" id="cancel-task">取消</button>
          <button class="btn btn-primary btn-lg" style="flex:1" type="submit">${editTask ? '保存' : '发布'}</button>
        </div>
      </form>
    `;

    let selectedType = editTask?.type || 'daily';

    body.querySelectorAll('.tab[data-type]').forEach(tab => {
      tab.onclick = () => {
        body.querySelectorAll('.tab[data-type]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        selectedType = tab.dataset.type;
      };
    });

    body.querySelector('#cancel-task').onclick = () => closeModal();
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };

    body.querySelector('#task-form').onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = body.querySelector('button[type="submit"]');
      const title = body.querySelector('#task-title').value.trim();
      const description = body.querySelector('#task-desc').value.trim();
      const points = parseInt(body.querySelector('#task-points').value);

      if (!title || !points) {
        toast('请填写完整信息', 'warning');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '处理中...';

      if (editTask) {
        await store.updateTask(editTask.id, { title, description, type: selectedType, points });
        toast('任务已更新', 'success');
      } else {
        await store.createTask({ title, description, type: selectedType, points, creatorId: userId, familyCode });
        haptic('success');
        toast('任务已发布！', 'success');
      }

      closeModal();
      renderParentTasks(container);
    };

    function closeModal() {
      modal.classList.add('closing');
      setTimeout(() => { modal.style.display = 'none'; modal.classList.remove('closing'); }, 300);
    }
  }

  render();
}
