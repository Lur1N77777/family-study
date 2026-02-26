// ========================================
// 家长端 — 审核中心
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { router } from '../../utils/router.js';
import { toast } from '../../utils/notification.js';
import { staggerIn, haptic } from '../../utils/animations.js';
import { getPhoto } from '../../utils/camera.js';
import { showBottomNav } from '../../utils/nav.js';

export async function renderParentReview(container) {
  container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>`;

  await auth.refreshUser();
  const familyCode = auth.getFamilyCode();

  const allUsers = await store.getFamilyUsers();
  const children = allUsers.filter(u => u.role === 'child');

  let activeTab = 'tasks'; // tasks | redemptions
  let filterChildId = 'all'; // 'all' or specific childId

  const [allSubs, allRedemptions] = await Promise.all([
    store.getSubmissions(),
    store.getRedemptions()
  ]);

  function render() {
    let pendingSubs = allSubs.filter(s => s.status === 'pending');
    let pendingRedemptions = allRedemptions.filter(r => r.status === 'pending');
    let recentSubs = allSubs.filter(s => s.status !== 'pending').slice(0, 10);

    // 按孩子筛选
    if (filterChildId !== 'all') {
      pendingSubs = pendingSubs.filter(s => s.childId === filterChildId);
      pendingRedemptions = pendingRedemptions.filter(r => r.childId === filterChildId);
      recentSubs = recentSubs.filter(s => s.childId === filterChildId);
    }

    container.innerHTML = `
      <div class="page review-page">
        <div class="page-header">
          <h1 class="page-title">审核中心</h1>
          <p class="page-subtitle">${pendingSubs.length} 个任务 · ${pendingRedemptions.length} 个兑换待审核</p>
        </div>

        ${children.length > 1 ? `
          <div class="child-filter animate-fade-in-up">
            <button class="child-chip ${filterChildId === 'all' ? 'active' : ''}" data-child="all">
              全部
            </button>
            ${children.map(c => `
              <button class="child-chip ${filterChildId === c.id ? 'active' : ''}" data-child="${c.id}">
                <span class="child-chip-avatar">${c.avatar}</span>
                ${c.username}
              </button>
            `).join('')}
          </div>
        ` : ''}

        <div class="tabs">
          <button class="tab ${activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks">
            任务审核 ${pendingSubs.length > 0 ? `<span class="nav-badge" style="position:static;margin-left:4px">${pendingSubs.length}</span>` : ''}
          </button>
          <button class="tab ${activeTab === 'redemptions' ? 'active' : ''}" data-tab="redemptions">
            兑换审核 ${pendingRedemptions.length > 0 ? `<span class="nav-badge" style="position:static;margin-left:4px">${pendingRedemptions.length}</span>` : ''}
          </button>
        </div>

        <div id="review-content">
          ${activeTab === 'tasks' ? renderTaskReview(pendingSubs, recentSubs) : renderRedemptionReview(pendingRedemptions)}
        </div>
      </div>

      <!-- 驳回原因弹窗 -->
      <div class="modal-overlay" id="reject-modal" style="display:none">
        <div class="modal-content">
          <div class="modal-handle"></div>
          <div id="reject-body"></div>
        </div>
      </div>

      <!-- 照片预览弹窗 -->
      <div class="modal-overlay" id="photo-modal" style="display:none">
        <div class="modal-content" style="padding:0;background:black">
          <img id="photo-preview-img" style="width:100%;border-radius:var(--radius-2xl) var(--radius-2xl) 0 0" />
          <div style="padding:var(--space-4);background:var(--color-surface);border-radius:0">
            <button class="btn btn-secondary btn-block" id="close-photo">关闭</button>
          </div>
        </div>
      </div>

      <style>
        .review-page { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }

        .review-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          margin-bottom: var(--space-3);
          box-shadow: var(--shadow-sm);
        }

        .review-card-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
        }

        .review-child-name {
          font-size: var(--text-sm);
          font-weight: var(--weight-semibold);
        }

        .review-time {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
        }

        .review-task-title {
          font-size: var(--text-md);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--space-1);
        }

        .review-task-points {
          font-size: var(--text-sm);
          color: var(--color-primary);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--space-3);
        }

        .review-photo-thumb {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--color-divider);
          margin-bottom: var(--space-3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-tertiary);
        }

        .review-photo-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .review-actions {
          display: flex;
          gap: var(--space-3);
        }

        .review-actions .btn { flex: 1; }

        .history-title {
          font-size: var(--text-sm);
          font-weight: var(--weight-semibold);
          color: var(--color-text-secondary);
          margin: var(--space-6) 0 var(--space-3);
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) 0;
          border-bottom: 0.5px solid var(--color-border);
        }

        .history-status {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .redemption-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          margin-bottom: var(--space-3);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .redemption-emoji {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .redemption-info { flex: 1; }
        .redemption-name { font-weight: var(--weight-semibold); margin-bottom: 2px; }
        .redemption-detail { font-size: var(--text-sm); color: var(--color-text-secondary); }

        /* 孩子筛选芯片 */
        .child-filter {
          display: flex;
          gap: var(--space-2);
          overflow-x: auto;
          padding-bottom: var(--space-3);
          margin-bottom: var(--space-1);
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .child-filter::-webkit-scrollbar { display: none; }

        .child-chip {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: var(--weight-medium);
          white-space: nowrap;
          background: var(--color-surface);
          color: var(--color-text-secondary);
          box-shadow: var(--shadow-sm);
          transition: all var(--duration-fast) var(--ease-out);
          flex-shrink: 0;
        }

        .child-chip.active {
          background: var(--color-primary);
          color: white;
          box-shadow: var(--shadow-md);
        }

        .child-chip-avatar {
          font-size: 1.1rem;
          line-height: 1;
        }
      </style>
    `;

    // Tab 事件
    container.querySelectorAll('.tab[data-tab]').forEach(tab => {
      tab.onclick = () => {
        activeTab = tab.dataset.tab;
        render();
      };
    });

    // 孩子筛选事件
    container.querySelectorAll('.child-chip').forEach(chip => {
      chip.onclick = () => {
        filterChildId = chip.dataset.child;
        render();
      };
    });

    // 审核按钮事件 - 通过
    container.querySelectorAll('.approve-btn').forEach(btn => {
      btn.onclick = async () => {
        btn.disabled = true;
        btn.innerHTML = '处理中...';
        await store.approveSubmission(btn.dataset.id);
        haptic('success');
        toast('已通过！积分已发放', 'success');
        renderParentReview(container);
      };
    });

    // 审核按钮事件 - 驳回
    container.querySelectorAll('.reject-btn').forEach(btn => {
      btn.onclick = () => showRejectModal(btn.dataset.id);
    });

    // 兑换确认
    container.querySelectorAll('.confirm-redeem-btn').forEach(btn => {
      btn.onclick = async () => {
        btn.disabled = true;
        btn.innerHTML = '处理中...';
        await store.confirmRedemption(btn.dataset.id);
        haptic('success');
        toast('已确认兑现', 'success');
        renderParentReview(container);
      };
    });

    // 照片相关
    loadPhotos();

    staggerIn(container, '[data-stagger]');
    showBottomNav('parent', 'review');
  }

  async function loadPhotos() {
    const thumbs = container.querySelectorAll('.review-photo-thumb[data-photo-id]');
    for (const thumb of thumbs) {
      const photoId = thumb.dataset.photoId;
      if (photoId) {
        try {
          const dataUrl = await getPhoto(photoId);
          if (dataUrl) {
            thumb.innerHTML = `<img src="${dataUrl}" alt="证据照片" />`;
            thumb.onclick = () => showPhotoPreview(dataUrl);
          }
        } catch (e) {
          // 照片不存在
        }
      }
    }
  }

  function showPhotoPreview(dataUrl) {
    const modal = container.querySelector('#photo-modal');
    modal.querySelector('#photo-preview-img').src = dataUrl;
    modal.style.display = 'flex';

    modal.onclick = (e) => {
      if (e.target === modal || e.target.id === 'close-photo') {
        modal.style.display = 'none';
      }
    };
    container.querySelector('#close-photo').onclick = () => {
      modal.style.display = 'none';
    };
  }

  function showRejectModal(submissionId) {
    const modal = container.querySelector('#reject-modal');
    const body = container.querySelector('#reject-body');
    modal.style.display = 'flex';

    body.innerHTML = `
      <h2 class="modal-title">驳回原因</h2>
      <div class="input-group">
        <textarea class="input" id="reject-reason" placeholder="请输入驳回原因（选填）" rows="3" style="resize:none"></textarea>
      </div>
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn-secondary btn-lg" style="flex:1" id="cancel-reject">取消</button>
        <button class="btn btn-danger btn-lg" style="flex:1" id="confirm-reject">确认驳回</button>
      </div>
    `;

    body.querySelector('#cancel-reject').onclick = () => {
      modal.classList.add('closing');
      setTimeout(() => { modal.style.display = 'none'; modal.classList.remove('closing'); }, 300);
    };

    body.querySelector('#confirm-reject').onclick = async () => {
      const btn = body.querySelector('#confirm-reject');
      const reason = body.querySelector('#reject-reason').value.trim();
      btn.disabled = true;
      btn.innerHTML = '驳回中...';
      await store.rejectSubmission(submissionId, reason);
      haptic('medium');
      toast('已驳回', 'warning');
      modal.classList.add('closing');
      setTimeout(() => { modal.style.display = 'none'; modal.classList.remove('closing'); renderParentReview(container); }, 300);
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.classList.add('closing');
        setTimeout(() => { modal.style.display = 'none'; modal.classList.remove('closing'); }, 300);
      }
    };
  }

  function renderTaskReview(pending, recent) {
    if (pending.length === 0 && recent.length === 0) {
      return `
        <div class="empty-state">
          ${icon('checkCircle', 48)}
          <h3>暂无审核任务</h3>
          <p>等待学生提交任务</p>
        </div>
      `;
    }

    return `
      ${pending.map(sub => {
      const child = store.getUser(sub.childId);
      const task = store.getTaskById(sub.taskId);
      return `
          <div class="review-card" data-stagger>
            <div class="review-card-header">
              <div class="avatar">${child?.avatar || '👦'}</div>
              <div>
                <div class="review-child-name">${child?.username || '学生'}</div>
                <div class="review-time">${formatTime(sub.createdAt)}</div>
              </div>
            </div>
            <div class="review-task-title">${task?.title || '任务'}</div>
            <div class="review-task-points">+${task?.points || 0} 积分</div>
            ${sub.photoId ? `
              <div class="review-photo-thumb" data-photo-id="${sub.photoId}">
                ${icon('image', 32)}
                <span style="margin-left:8px;font-size:var(--text-sm)">加载中...</span>
              </div>
            ` : ''}
            <div class="review-actions">
              <button class="btn btn-danger reject-btn" data-id="${sub.id}">
                ${icon('x', 16)} 驳回
              </button>
              <button class="btn btn-primary approve-btn" data-id="${sub.id}">
                ${icon('check', 16)} 通过
              </button>
            </div>
          </div>
        `;
    }).join('')}

      ${recent.length > 0 ? `
        <div class="history-title">历史记录</div>
        ${recent.map(sub => {
      const child = store.getUser(sub.childId);
      const task = store.getTaskById(sub.taskId);
      return `
            <div class="history-item">
              <div class="history-status" style="background:${sub.status === 'approved' ? 'var(--color-success)' : 'var(--color-danger)'}"></div>
              <div style="flex:1;min-width:0">
                <div style="font-size:var(--text-sm);font-weight:500">${child?.username || ''} — ${task?.title || ''}</div>
                <div style="font-size:var(--text-xs);color:var(--color-text-tertiary)">${sub.status === 'approved' ? '已通过' : '已驳回'} · ${formatTime(sub.reviewedAt || sub.createdAt)}</div>
              </div>
              <span class="badge ${sub.status === 'approved' ? 'badge-success' : 'badge-danger'}">${sub.status === 'approved' ? '+' + sub.points : '驳回'}</span>
            </div>
          `;
    }).join('')}
      ` : ''}
    `;
  }

  function renderRedemptionReview(pending) {
    if (pending.length === 0) {
      return `
        <div class="empty-state">
          ${icon('gift', 48)}
          <h3>暂无兑换申请</h3>
          <p>等待学生兑换商品</p>
        </div>
      `;
    }

    return pending.map(r => {
      const child = store.getUser(r.childId);
      return `
        <div class="redemption-card" data-stagger>
          <div class="redemption-emoji">${r.productEmoji || '🎁'}</div>
          <div class="redemption-info">
            <div class="redemption-name">${r.product_name || r.productName}</div>
            <div class="redemption-detail">${r.child_name || r.childName || '学生'} · ${r.price} 积分 · ${formatTime(r.created_at || r.createdAt)}</div>
          </div>
          <button class="btn btn-primary btn-sm confirm-redeem-btn" data-id="${r.id}">
            确认
          </button>
        </div>
      `;
    }).join('');
  }

  render();
}

function formatTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return new Date(ts).toLocaleDateString();
}
