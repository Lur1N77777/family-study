// ========================================
// 学生端 — 任务列表
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { router } from '../../utils/router.js';
import { capturePhoto, getPhoto } from '../../utils/camera.js';
import { toast } from '../../utils/notification.js';
import { staggerIn, haptic } from '../../utils/animations.js';
import { showBottomNav } from '../../utils/nav.js';
import { api } from '../../utils/api.js';

export async function renderStudentTasks(container) {
  container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>`;

  await auth.refreshUser();
  const user = auth.currentUser;

  const [tasks, submissions] = await Promise.all([
    store.getTasks(),
    store.getSubmissions(null, user.id)
  ]);

  let activeTab = 'all';

  function render() {
    const filtered = activeTab === 'all' ? tasks : tasks.filter(t => t.type === activeTab);

    // 检查每个任务的提交状态
    const tasksWithStatus = filtered.map(task => {
      const taskSubs = submissions.filter(s => s.taskId === task.id);
      const latestSub = taskSubs[0]; // 最新的提交
      return { ...task, latestSub };
    });

    container.innerHTML = `
      <div class="page tasks-page">
        <div class="page-header">
          <h1 class="page-title">我的任务</h1>
          <p class="page-subtitle">${tasks.length} 个任务等你完成</p>
        </div>

        <!-- Tab 切换 -->
        <div class="tabs">
          <button class="tab ${activeTab === 'all' ? 'active' : ''}" data-tab="all">全部</button>
          <button class="tab ${activeTab === 'daily' ? 'active' : ''}" data-tab="daily">每日</button>
          <button class="tab ${activeTab === 'weekly' ? 'active' : ''}" data-tab="weekly">每周</button>
          <button class="tab ${activeTab === 'once' ? 'active' : ''}" data-tab="once">单次</button>
          <button class="tab ${activeTab === 'semester' ? 'active' : ''}" data-tab="semester">学期</button>
        </div>

        <!-- 任务列表 -->
        <div class="task-list-full" id="tasks-container">
          ${tasksWithStatus.map(task => {
      const statusClass = task.latestSub
        ? task.latestSub.status === 'pending' ? 'status-pending'
          : task.latestSub.status === 'approved' ? 'status-approved'
            : task.latestSub.status === 'rejected' ? 'status-rejected' : ''
        : '';
      const statusText = task.latestSub
        ? task.latestSub.status === 'pending' ? '审核中'
          : task.latestSub.status === 'approved' ? '已通过'
            : task.latestSub.status === 'rejected' ? '被驳回' : ''
        : '';

      return `
              <div class="task-item ${statusClass}" data-stagger>
                <div class="task-item-header">
                  <span class="badge badge-${task.type === 'daily' ? 'primary' : task.type === 'weekly' ? 'warning' : task.type === 'semester' ? 'danger' : 'success'}">
                    ${task.type === 'daily' ? '每日' : task.type === 'weekly' ? '每周' : task.type === 'semester' ? '学期' : '单次'}
                  </span>
                  <span class="task-points-tag">+${task.points}</span>
                </div>
                <h3 class="task-item-title">${task.title}</h3>
                <p class="task-item-desc">${task.description || ''}</p>
                ${statusText ? `
                  <div class="task-status-row">
                    <span class="task-status-text ${statusClass}">${statusText}</span>
                    ${task.latestSub?.status === 'rejected' ? `
                      <span class="task-reject-reason">${task.latestSub.rejectReason || ''}</span>
                    ` : ''}
                  </div>
                ` : ''}
                <div class="task-item-footer">
                  ${!task.latestSub || task.latestSub.status === 'rejected' ? `
                    <button class="btn btn-primary btn-sm task-complete-btn" data-task-id="${task.id}">
                      ${icon('camera', 16)} 拍照提交
                    </button>
                  ` : task.latestSub.status === 'pending' ? `
                    <span class="badge badge-warning">等待审核</span>
                  ` : `
                    <span class="badge badge-success">${icon('checkCircle', 14)} 已完成</span>
                  `}
                </div>
              </div>
            `;
    }).join('')}
          ${tasksWithStatus.length === 0 ? `
            <div class="empty-state">
              ${icon('tasks', 48)}
              <h3>暂无${activeTab === 'all' ? '' : '此类'}任务</h3>
              <p>等待家长发布新任务</p>
            </div>
          ` : ''}
        </div>
      </div>

      <style>
        .tasks-page { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }

        .task-list-full {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .task-item {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          box-shadow: var(--shadow-sm);
          transition: transform var(--duration-fast) var(--ease-out);
        }

        .task-item:active { transform: scale(0.98); }

        .task-item.status-approved { border-left: 3px solid var(--color-success); }
        .task-item.status-pending { border-left: 3px solid var(--color-warning); }
        .task-item.status-rejected { border-left: 3px solid var(--color-danger); }

        .task-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-2);
        }

        .task-points-tag {
          font-family: var(--font-mono);
          font-weight: var(--weight-bold);
          color: var(--color-primary);
          font-size: var(--text-sm);
        }

        .task-item-title {
          font-size: var(--text-md);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--space-1);
        }

        .task-item-desc {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          line-height: 1.5;
          margin-bottom: var(--space-3);
        }

        .task-status-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }

        .task-status-text.status-pending { color: var(--color-warning); font-weight: var(--weight-semibold); font-size: var(--text-sm); }
        .task-status-text.status-approved { color: var(--color-success); font-weight: var(--weight-semibold); font-size: var(--text-sm); }
        .task-status-text.status-rejected { color: var(--color-danger); font-weight: var(--weight-semibold); font-size: var(--text-sm); }

        .task-reject-reason {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          background: var(--color-danger-soft);
          padding: 2px var(--space-2);
          border-radius: var(--radius-sm);
        }

        .task-item-footer {
          display: flex;
          justify-content: flex-end;
        }
      </style>
    `;

    // Tab 事件
    container.querySelectorAll('.tab').forEach(tab => {
      tab.onclick = () => {
        activeTab = tab.dataset.tab;
        render();
      };
    });

    // 拍照提交
    container.querySelectorAll('.task-complete-btn').forEach(btn => {
      btn.onclick = async () => {
        const taskId = btn.dataset.taskId;
        try {
          haptic('medium');
          btn.innerHTML = '处理中...';
          btn.disabled = true;

          const photo = await capturePhoto();
          if (photo && photo.dataUrl) {
            toast('正在上传证据...', 'info');

            // Base64 转 File
            const arr = photo.dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            const u8arr = new Uint8Array(bstr.length);
            for (let i = 0; i < bstr.length; i++) { u8arr[i] = bstr.charCodeAt(i); }
            const file = new File([u8arr], 'evidence.jpg', { type: mime });

            const uploadRes = await api.uploadPhoto(file);
            if (uploadRes.error) throw new Error(uploadRes.error);

            const submitRes = await store.submitTask(taskId, uploadRes.key);
            if (submitRes.error) throw new Error(submitRes.error);

            toast('提交成功！等待家长审核', 'success');
            haptic('success');
            renderStudentTasks(container); // 重新加载数据
          } else {
            btn.innerHTML = `${icon('camera', 16)} 拍照提交`;
            btn.disabled = false;
          }
        } catch (err) {
          btn.innerHTML = `${icon('camera', 16)} 拍照提交`;
          btn.disabled = false;
          if (err.message !== '取消拍照') {
            toast(err.message || '拍照失败，请重试', 'error');
          }
        }
      };
    });

    staggerIn(container, '[data-stagger]');
    showBottomNav('child', 'tasks');
  }

  render();
}
