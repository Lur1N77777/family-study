import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { toast } from '../../utils/notification.js';
import { staggerIn, haptic } from '../../utils/animations.js';
import { getPhoto, parsePhotoKeys } from '../../utils/camera.js';
import { canPreviewReviewedSubmissionPhotos, getSubmissionPhotoKeys, getSubmissionPhotoState } from '../../utils/submission-photos.js';
import { showBottomNav, refreshNavBadge } from '../../utils/nav.js';
import { escapeHtml } from '../../utils/escape.js';
import {
  cancelExpandableAnimations,
  queueExpandableFrame,
  registerCollapseTransitionEnd,
  registerExpandTransitionEnd,
} from '../../utils/expandable-transition.js';

export async function renderParentReview(container) {
  container.innerHTML = '<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>';

  await auth.refreshUser();
  const currentUser = auth.requireUser();

  const [allUsers, submissions, redemptions] = await Promise.all([
    store.getFamilyUsers(),
    store.getSubmissions(),
    store.getRedemptions(),
  ]);

  const state = {
    children: allUsers.filter((user) => user.role === 'child'),
    submissions: [...submissions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    redemptions: [...redemptions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    activeTab: 'tasks',
    activeChildId: 'all',
    taskView: 'pending',
    expandedRecordId: null,
    photoCache: new Map(),
    viewerPhotos: [],
    viewerIndex: 0,
    viewerKeyHandler: null,
  };

  render();

  function render() {
    const selectedChild = state.activeChildId === 'all'
      ? null
      : state.children.find((child) => child.id === state.activeChildId) || null;

    const filteredSubmissions = state.activeChildId === 'all'
      ? state.submissions
      : state.submissions.filter((submission) => submission.childId === state.activeChildId);

    const filteredRedemptions = state.activeChildId === 'all'
      ? state.redemptions
      : state.redemptions.filter((redemption) => redemption.childId === state.activeChildId);

    const pendingSubmissions = filteredSubmissions.filter((submission) => submission.status === 'pending');
    const submissionRecords = filteredSubmissions.slice(0, 50);
    const pendingRedemptions = filteredRedemptions.filter((redemption) => redemption.status === 'pending');

    container.innerHTML = `
      <div class="page review-page">
        <div class="page-header review-head">
          <div>
            <h1 class="page-title">审核中心</h1>
            <p class="page-subtitle">${escapeHtml(buildSubtitle(state, selectedChild, pendingSubmissions, submissionRecords, pendingRedemptions))}</p>
          </div>
        </div>

        ${state.children.length > 1 ? `
          <div class="child-filter" data-stagger>
            <button class="child-chip ${state.activeChildId === 'all' ? 'active' : ''}" data-child="all" type="button">全部孩子</button>
            ${state.children.map((child) => `
              <button class="child-chip ${state.activeChildId === child.id ? 'active' : ''}" data-child="${child.id}" type="button">
                <span class="child-chip-avatar">${escapeHtml(child.avatar || '🙂')}</span>
                ${escapeHtml(child.username)}
              </button>
            `).join('')}
          </div>
        ` : ''}

        <div class="tabs review-tabs" data-stagger>
          <button class="tab ${state.activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks" type="button">
            任务审核
            ${pendingSubmissions.length ? `<span class="tab-count">${pendingSubmissions.length}</span>` : ''}
          </button>
          <button class="tab ${state.activeTab === 'redemptions' ? 'active' : ''}" data-tab="redemptions" type="button">
            商品兑换
            ${pendingRedemptions.length ? `<span class="tab-count">${pendingRedemptions.length}</span>` : ''}
          </button>
        </div>

        ${state.activeTab === 'tasks' ? `
          <div class="review-switch" data-stagger>
            <button class="review-switch-btn ${state.taskView === 'pending' ? 'active' : ''}" data-task-view="pending" type="button">
              待审核 <span>${pendingSubmissions.length}</span>
            </button>
            <button class="review-switch-btn ${state.taskView === 'records' ? 'active' : ''}" data-task-view="records" type="button">
              完成记录
              <span>${submissionRecords.length}</span>
            </button>
          </div>
        ` : ''}

        <div id="review-content">
          ${state.activeTab === 'tasks'
            ? (state.taskView === 'pending'
              ? renderPendingTaskReview(pendingSubmissions)
              : renderSubmissionRecords(submissionRecords, selectedChild, state.expandedRecordId))
            : renderPendingRedemptions(pendingRedemptions, state.children)}
        </div>
      </div>

      <div class="modal-overlay modal-centered" id="reject-modal" style="display:none">
        <div class="modal-content review-modal">
          <div id="reject-body"></div>
        </div>
      </div>

      <div class="photo-viewer-overlay" id="photo-viewer" style="display:none">
        <div class="photo-viewer-header">
          <span class="photo-viewer-counter" id="photo-counter"></span>
          <button class="photo-viewer-close" id="close-viewer" type="button">关闭</button>
        </div>
        <div class="photo-viewer-body" id="photo-viewer-body">
          <img class="photo-viewer-img" id="photo-viewer-img" alt="任务照片预览" />
        </div>
        <div class="photo-viewer-nav">
          <button class="photo-viewer-arrow photo-viewer-prev" id="viewer-prev" type="button">${icon('chevronLeft', 28)}</button>
          <div class="photo-viewer-dots" id="photo-dots"></div>
          <button class="photo-viewer-arrow photo-viewer-next" id="viewer-next" type="button">${icon('chevronRight', 28)}</button>
        </div>
      </div>

      <style>
        .review-page { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }
        .review-head { padding-bottom: var(--space-3); }
        .review-tabs { margin-bottom: var(--space-3); }
        .review-switch {
          display: inline-flex;
          gap: 6px;
          padding: 4px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-text-primary) 5%, transparent);
          margin-bottom: var(--space-3);
        }
        .review-switch-btn {
          border: none;
          background: transparent;
          color: var(--color-text-secondary);
          padding: 9px 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: var(--weight-semibold);
        }
        .review-switch-btn span {
          min-width: 18px;
          height: 18px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          background: color-mix(in srgb, var(--color-text-primary) 7%, transparent);
        }
        .review-switch-btn.active {
          background: var(--color-surface);
          color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }
        .review-switch-btn.active span {
          background: color-mix(in srgb, var(--color-primary) 12%, transparent);
        }
        .child-filter {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: var(--space-3);
          margin-bottom: 2px;
          scrollbar-width: none;
        }
        .child-filter::-webkit-scrollbar { display: none; }
        .child-chip {
          border: none;
          background: var(--color-surface);
          color: var(--color-text-secondary);
          border-radius: 999px;
          padding: 9px 12px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          box-shadow: var(--shadow-sm);
          font-size: 12px;
          font-weight: var(--weight-semibold);
        }
        .child-chip.active {
          background: var(--color-primary);
          color: #fff;
          box-shadow: var(--shadow-md);
        }
        .child-chip-avatar { font-size: 14px; line-height: 1; }
        .review-card,
        .record-card,
        .redemption-card {
          background: var(--color-surface);
          border: 1px solid color-mix(in srgb, var(--color-text-primary) 6%, transparent);
          box-shadow: var(--shadow-sm);
        }
        .review-card {
          border-radius: 22px;
          padding: 14px;
          margin-bottom: 10px;
        }
        .review-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }
        .review-child-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .review-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          flex-shrink: 0;
        }
        .review-child-name {
          font-size: 13px;
          font-weight: var(--weight-semibold);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .review-time {
          font-size: 11px;
          color: var(--color-text-tertiary);
          margin-top: 2px;
        }
        .review-task-title {
          font-size: 15px;
          font-weight: var(--weight-semibold);
          margin-bottom: 2px;
        }
        .review-task-points {
          font-size: 12px;
          color: var(--color-primary);
          font-weight: var(--weight-semibold);
          margin-bottom: 10px;
        }
        .review-photos-grid {
          display: grid;
          gap: 8px;
          margin-bottom: 12px;
          border-radius: 16px;
          overflow: hidden;
        }
        .review-photos-grid.photos-1 { grid-template-columns: 1fr; }
        .review-photos-grid.photos-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .review-photos-grid.photos-3,
        .review-photos-grid.photos-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .review-photo-cell {
          position: relative;
          aspect-ratio: 4 / 3;
          border-radius: 14px;
          overflow: hidden;
          background: color-mix(in srgb, var(--color-text-primary) 6%, transparent);
          cursor: pointer;
        }
        .review-photo-cell img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .photo-loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-tertiary);
          font-size: 11px;
        }
        .review-actions {
          display: flex;
          gap: 10px;
        }
        .review-actions .btn { flex: 1; }
        .record-summary {
          display: grid;
          gap: 6px;
          margin-bottom: 10px;
        }
        .record-summary-title {
          font-size: 14px;
          font-weight: var(--weight-semibold);
        }
        .record-summary-copy {
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.55;
        }
        .record-list {
          display: grid;
          gap: 10px;
        }
        .record-card {
          border-radius: 20px;
          padding: 13px 14px;
          transition:
            border-color var(--duration-fast) var(--ease-out),
            box-shadow var(--duration-fast) var(--ease-out),
            transform var(--duration-fast) var(--ease-out);
        }
        .record-card.expanded {
          border-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }
        .record-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }
        .record-title-wrap {
          min-width: 0;
          flex: 1;
        }
        .record-head-side {
          min-width: fit-content;
          display: grid;
          justify-items: end;
          align-content: start;
          gap: 6px;
          flex-shrink: 0;
        }
        .record-footer { display: none; }
        .record-title {
          font-size: 14px;
          font-weight: var(--weight-semibold);
          line-height: 1.35;
        }
        .record-subtitle {
          margin-top: 3px;
          font-size: 11px;
          color: var(--color-text-secondary);
        }
        .record-flow {
          display: grid;
          gap: 6px;
        }
        .record-photo-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: var(--weight-semibold);
          border: none;
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          color: var(--color-primary);
          white-space: nowrap;
          transition:
            background var(--duration-fast) var(--ease-out),
            color var(--duration-fast) var(--ease-out),
            transform var(--duration-fast) var(--ease-out);
        }
        .record-photo-toggle:hover {
          background: color-mix(in srgb, var(--color-primary) 16%, transparent);
          transform: translateY(-1px);
        }
        .record-photo-toggle-icon,
        .record-photo-toggle-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .record-photo-toggle-arrow {
          transition: transform .32s var(--ease-out);
        }
        .record-photo-toggle.expanded .record-photo-toggle-arrow {
          transform: rotate(90deg);
        }
        .record-photo-detail {
          max-height: 0;
          overflow: hidden;
          padding: 0 1px;
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
          transition:
            max-height .34s cubic-bezier(0.4, 0, 0.2, 1),
            padding-top .34s cubic-bezier(0.4, 0, 0.2, 1),
            padding-bottom .34s cubic-bezier(0.4, 0, 0.2, 1),
            opacity .22s ease,
            transform .34s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: max-height, opacity, transform;
        }
        .record-card.expanded .record-photo-detail {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .record-photo-strip {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(88px, 96px);
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .record-photo-strip::-webkit-scrollbar { display: none; }
        .record-photo-cell {
          position: relative;
          aspect-ratio: 4 / 3;
          border-radius: 14px;
          overflow: hidden;
          background: color-mix(in srgb, var(--color-text-primary) 6%, transparent);
          cursor: pointer;
        }
        .record-photo-cell img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .record-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }
        .record-row strong {
          min-width: 32px;
          color: var(--color-text-primary);
          font-size: 11px;
          letter-spacing: .02em;
        }
        .record-reason {
          color: var(--color-danger);
        }
        .record-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: var(--weight-semibold);
          flex-shrink: 0;
        }
        .record-status-pill.pending { background: var(--color-warning-soft); color: var(--color-warning); }
        .record-status-pill.approved { background: var(--color-success-soft); color: var(--color-success); }
        .record-status-pill.rejected { background: var(--color-danger-soft); color: var(--color-danger); }
        .redemption-card {
          border-radius: 22px;
          padding: 14px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .redemption-emoji {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: color-mix(in srgb, var(--color-primary) 8%, transparent);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }
        .redemption-info { min-width: 0; flex: 1; }
        .redemption-name { font-size: 14px; font-weight: var(--weight-semibold); }
        .redemption-detail {
          margin-top: 4px;
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }
        .review-modal { width: min(460px, calc(100vw - 24px)); }
        .photo-viewer-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          flex-direction: column;
          animation: fadeIn 0.2s ease-out;
        }
        .photo-viewer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4) var(--space-5);
          padding-top: max(var(--space-4), env(safe-area-inset-top, 20px));
          color: #fff;
        }
        .photo-viewer-counter { font-size: 13px; opacity: .8; }
        .photo-viewer-close,
        .photo-viewer-arrow {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, .14);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .photo-viewer-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          touch-action: pan-y;
        }
        .photo-viewer-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
          transition: opacity .15s ease;
        }
        .photo-viewer-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          padding: var(--space-4);
          padding-bottom: max(var(--space-4), env(safe-area-inset-bottom, 20px));
        }
        .photo-viewer-dots {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .photo-viewer-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, .3);
          transition: all var(--duration-fast);
        }
        .photo-viewer-dot.active {
          background: #fff;
          transform: scale(1.3);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (max-width: 640px) {
          .review-card-header,
          .redemption-card { align-items: flex-start; }
          .review-card-header { flex-direction: column; }
        }
      </style>
    `;

    bindEvents();
    if (state.activeTab === 'tasks') {
      if (state.taskView === 'pending') {
        hydratePhotoCells('.review-photo-cell[data-photo-key]');
      } else {
        restoreExpandedRecordCards();
      }
    }
    staggerIn(container, '[data-stagger]');
    showBottomNav('parent', 'review');
    refreshNavBadge();
  }

  function bindEvents() {
    container.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => {
      state.activeTab = button.dataset.tab;
      render();
    }));

    container.querySelectorAll('[data-child]').forEach((button) => button.addEventListener('click', () => {
      state.activeChildId = button.dataset.child;
      render();
    }));

    container.querySelectorAll('[data-task-view]').forEach((button) => button.addEventListener('click', () => {
      state.taskView = button.dataset.taskView;
      render();
    }));

    container.querySelectorAll('[data-record-toggle]').forEach((button) => button.addEventListener('click', () => {
      toggleRecordCard(button.dataset.recordToggle);
    }));

    container.querySelectorAll('.approve-btn').forEach((button) => button.addEventListener('click', async () => {
      const submissionId = button.dataset.id;
      button.disabled = true;
      const existingSubmission = state.submissions.find((item) => item.id === submissionId);
      const hasPhotos = Boolean(existingSubmission?.photoCount || getSubmissionPhotoKeys(existingSubmission).length);

      try {
        await store.approveSubmission(submissionId);
        applySubmissionUpdate(submissionId, {
          status: 'approved',
          points: existingSubmission?.taskPoints || 0,
          reviewedAt: Date.now(),
          rejectReason: currentUser?.username ? `approved_by:${currentUser.username}` : '',
          photoAccessStatus: hasPhotos ? 'available_today' : 'none',
          reviewPhotoAvailable: hasPhotos,
          photoClearedAt: null,
        });
        await auth.refreshUser();
        haptic('success');
        toast('已通过，积分已发放', 'success');
        render();
      } catch (error) {
        button.disabled = false;
        toast(error.message || '操作失败，请稍后重试', 'error');
      }
    }));

    container.querySelectorAll('.reject-btn').forEach((button) => button.addEventListener('click', () => {
      showRejectModal(button.dataset.id);
    }));

    container.querySelectorAll('.confirm-redeem-btn').forEach((button) => button.addEventListener('click', async () => {
      const redemptionId = button.dataset.id;
      button.disabled = true;

      try {
        await store.confirmRedemption(redemptionId);
        state.redemptions = state.redemptions.map((item) => (
          item.id === redemptionId ? { ...item, status: 'confirmed' } : item
        ));
        haptic('success');
        toast('\u5df2\u786e\u8ba4\u5151\u6362', 'success');
        render();
      } catch (error) {
        button.disabled = false;
        toast(error.message || '操作失败，请稍后重试', 'error');
      }
    }));
  }

  function applySubmissionUpdate(submissionId, patch) {
    state.submissions = state.submissions.map((item) => (
      item.id === submissionId ? { ...item, ...patch } : item
    )).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  function showRejectModal(submissionId) {
    const modal = container.querySelector('#reject-modal');
    const body = container.querySelector('#reject-body');
    modal.style.display = 'flex';

    body.innerHTML = `
      <h2 class="modal-title">填写驳回原因</h2>
      <div class="input-group">
        <textarea class="input" id="reject-reason" rows="3" style="resize:none" placeholder="例如：照片不清晰，或者没有拍到完成结果"></textarea>
      </div>
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn-secondary btn-lg" style="flex:1" id="cancel-reject" type="button">取消</button>
        <button class="btn btn-danger btn-lg" style="flex:1" id="confirm-reject" type="button">确认驳回</button>
      </div>
    `;

    const closeModal = () => {
      modal.style.display = 'none';
    };

    body.querySelector('#cancel-reject').addEventListener('click', closeModal);
    modal.onclick = (event) => {
      if (event.target === modal) closeModal();
    };

    body.querySelector('#confirm-reject').addEventListener('click', async () => {
      const confirmButton = body.querySelector('#confirm-reject');
      const reason = body.querySelector('#reject-reason').value.trim();
      const existingSubmission = state.submissions.find((item) => item.id === submissionId);
      const hasPhotos = Boolean(existingSubmission?.photoCount || getSubmissionPhotoKeys(existingSubmission).length);
      confirmButton.disabled = true;
      confirmButton.textContent = '处理中...';

      try {
        await store.rejectSubmission(submissionId, reason);
        applySubmissionUpdate(submissionId, {
          status: 'rejected',
          reviewedAt: Date.now(),
          photoAccessStatus: hasPhotos ? 'available_today' : 'none',
          rejectReason: currentUser?.username
            ? `rejected_by:${currentUser.username}|${reason || '\u672a\u8bf4\u660e\u539f\u56e0'}`
            : reason || '\u672a\u8bf4\u660e\u539f\u56e0',
        });
        haptic('medium');
        toast('\u5df2\u9a73\u56de', 'warning');
        closeModal();
        render();
      } catch (error) {
        confirmButton.disabled = false;
        confirmButton.textContent = '\u786e\u8ba4\u9a73\u56de';
        toast(error.message || '\u64cd\u4f5c\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5', 'error');
      }
    });
  }

  async function getPhotoUrlCached(photoKey) {
    if (!photoKey) return null;

    if (!state.photoCache.has(photoKey)) {
      state.photoCache.set(photoKey, getPhoto(photoKey).catch(() => null));
    }

    return state.photoCache.get(photoKey);
  }

  async function hydratePhotoCells(scopeOrSelector, selector) {
    const scope = typeof scopeOrSelector === 'string' || !scopeOrSelector
      ? container
      : scopeOrSelector;
    const resolvedSelector = typeof scopeOrSelector === 'string'
      ? scopeOrSelector
      : selector || '.review-photo-cell[data-photo-key], .record-photo-cell[data-photo-key]';
    const cells = Array.from(scope.querySelectorAll(resolvedSelector));
    await Promise.all(cells.map(async (cell) => {
      if (cell.dataset.hydrated === 'true') return;

      const photoKey = cell.dataset.photoKey;
      const dataUrl = await getPhotoUrlCached(photoKey);

      if (dataUrl) {
        cell.innerHTML = `<img src="${dataUrl}" alt="任务凭证照片" />`;
        cell.dataset.loadedUrl = dataUrl;
      } else {
        cell.innerHTML = '<span class="photo-loading">加载失败</span>';
      }

      cell.dataset.hydrated = 'true';
    }));

    cells.forEach((cell) => {
      if (cell.dataset.bound === 'true') return;

      cell.addEventListener('click', () => {
        const holder = cell.closest('[data-photo-keys]');
        if (!holder) return;

        try {
          const photoKeys = JSON.parse(holder.dataset.photoKeys || '[]');
          const startIndex = Number(cell.dataset.photoIdx) || 0;
          if (photoKeys.length) {
            openPhotoViewer(photoKeys, startIndex);
          }
        } catch {
          // Ignore malformed card payloads.
        }
      });

      cell.dataset.bound = 'true';
    });
  }

  function restoreExpandedRecordCards() {
    const expandedCards = Array.from(container.querySelectorAll('.record-card.expanded'));
    expandedCards.forEach((card) => {
      const detail = card.querySelector('.record-photo-detail');
      if (!detail) return;

      detail.hidden = false;
      detail.style.paddingTop = '10px';
      detail.style.paddingBottom = '14px';
      detail.style.opacity = '1';
      detail.style.transform = 'translateY(0)';
      detail.style.pointerEvents = 'auto';
      detail.style.maxHeight = 'none';
      syncRecordToggle(card, true);
      hydratePhotoCells(card, '.record-photo-cell[data-photo-key]');
    });
  }

  function toggleRecordCard(recordId) {
    const nextCard = container.querySelector(`.record-card[data-record-id="${recordId}"]`);
    if (!nextCard) return;

    const openedCards = Array.from(container.querySelectorAll('.record-card.expanded'));
    const shouldCollapseCurrent = nextCard.classList.contains('expanded');

    openedCards.forEach((card) => {
      if (card === nextCard && !shouldCollapseCurrent) return;
      collapseRecordCard(card);
    });

    if (shouldCollapseCurrent) {
      state.expandedRecordId = null;
      return;
    }

    state.expandedRecordId = recordId;
    expandRecordCard(nextCard);
  }

  function expandRecordCard(card) {
    const detail = card.querySelector('.record-photo-detail');
    if (!detail) return;

    cancelExpandableAnimations(detail);
    detail.hidden = false;
    const computed = window.getComputedStyle(detail);
    detail.style.maxHeight = `${detail.offsetHeight}px`;
    detail.style.paddingTop = computed.paddingTop === '0px' ? '0' : computed.paddingTop;
    detail.style.paddingBottom = computed.paddingBottom === '0px' ? '0' : computed.paddingBottom;
    detail.style.opacity = computed.opacity;
    detail.style.transform = computed.transform !== 'none' ? computed.transform : 'translateY(-6px)';
    detail.style.pointerEvents = 'none';

    card.classList.add('expanded');
    syncRecordToggle(card, true);

    queueExpandableFrame(detail, () => {
      detail.style.paddingTop = '10px';
      detail.style.paddingBottom = '14px';
      detail.style.maxHeight = `${detail.scrollHeight}px`;
      detail.style.opacity = '1';
      detail.style.transform = 'translateY(0)';
      detail.style.pointerEvents = 'auto';
    });

    registerExpandTransitionEnd(detail, () => card.classList.contains('expanded'));
    hydratePhotoCells(card, '.record-photo-cell[data-photo-key]');
  }

  function collapseRecordCard(card) {
    const detail = card.querySelector('.record-photo-detail');
    if (!detail) return;

    cancelExpandableAnimations(detail);
    detail.hidden = false;
    detail.style.maxHeight = `${detail.offsetHeight || detail.scrollHeight}px`;
    detail.style.opacity = window.getComputedStyle(detail).opacity;
    detail.style.transform = 'translateY(0)';
    detail.style.pointerEvents = 'auto';

    queueExpandableFrame(detail, () => {
      card.classList.remove('expanded');
      syncRecordToggle(card, false);
      detail.style.maxHeight = '0';
      detail.style.paddingTop = '0';
      detail.style.paddingBottom = '0';
      detail.style.opacity = '0';
      detail.style.transform = 'translateY(-6px)';
      detail.style.pointerEvents = 'none';
    });

    registerCollapseTransitionEnd(detail, () => !card.classList.contains('expanded'));
  }

  function syncRecordToggle(card, isExpanded) {
    const toggle = card.querySelector('[data-record-toggle]');
    if (!toggle) return;

    toggle.classList.toggle('expanded', isExpanded);
    toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');

    const label = toggle.querySelector('[data-record-toggle-label]');
    if (label) {
      label.textContent = isExpanded
        ? (toggle.dataset.expandedLabel || '收起')
        : (toggle.dataset.collapsedLabel || '查看照片');
    }
  }

  function openPhotoViewer(photoKeys, startIndex = 0) {
    state.viewerPhotos = photoKeys.map((key) => ({ key, url: null }));
    state.viewerIndex = startIndex;

    const viewer = container.querySelector('#photo-viewer');
    viewer.style.display = 'flex';

    loadViewerPhotos();
    updateViewer();

    container.querySelector('#close-viewer').onclick = closePhotoViewer;
    container.querySelector('#viewer-prev').onclick = () => {
      if (state.viewerIndex > 0) {
        state.viewerIndex -= 1;
        updateViewer();
      }
    };
    container.querySelector('#viewer-next').onclick = () => {
      if (state.viewerIndex < state.viewerPhotos.length - 1) {
        state.viewerIndex += 1;
        updateViewer();
      }
    };

    const viewerBody = container.querySelector('#photo-viewer-body');
    viewerBody.onclick = (event) => {
      if (event.target === viewerBody) closePhotoViewer();
    };

    const keyHandler = (event) => {
      if (event.key === 'Escape') closePhotoViewer();
      if (event.key === 'ArrowLeft' && state.viewerIndex > 0) {
        state.viewerIndex -= 1;
        updateViewer();
      }
      if (event.key === 'ArrowRight' && state.viewerIndex < state.viewerPhotos.length - 1) {
        state.viewerIndex += 1;
        updateViewer();
      }
    };

    document.addEventListener('keydown', keyHandler);
    state.viewerKeyHandler = keyHandler;

    let touchStartX = 0;
    viewerBody.ontouchstart = (event) => {
      touchStartX = event.changedTouches[0].screenX;
    };
    viewerBody.ontouchend = (event) => {
      const diff = touchStartX - event.changedTouches[0].screenX;
      if (Math.abs(diff) < 50) return;

      if (diff > 0 && state.viewerIndex < state.viewerPhotos.length - 1) {
        state.viewerIndex += 1;
        updateViewer();
      } else if (diff < 0 && state.viewerIndex > 0) {
        state.viewerIndex -= 1;
        updateViewer();
      }
    };
  }

  function closePhotoViewer() {
    const viewer = container.querySelector('#photo-viewer');
    if (!viewer) return;

    viewer.style.display = 'none';
    if (state.viewerKeyHandler) {
      document.removeEventListener('keydown', state.viewerKeyHandler);
      state.viewerKeyHandler = null;
    }
    state.viewerPhotos = [];
    state.viewerIndex = 0;
  }

  async function loadViewerPhotos() {
    for (let index = 0; index < state.viewerPhotos.length; index += 1) {
      const item = state.viewerPhotos[index];
      const cell = container.querySelector(`.review-photo-cell[data-photo-key="${item.key}"], .record-photo-cell[data-photo-key="${item.key}"]`);
      if (cell?.dataset.loadedUrl) {
        item.url = cell.dataset.loadedUrl;
      } else {
        item.url = await getPhotoUrlCached(item.key);
      }

      if (index === state.viewerIndex) {
        updateViewer();
      }
    }
  }

  function updateViewer() {
    const img = container.querySelector('#photo-viewer-img');
    const counter = container.querySelector('#photo-counter');
    const dots = container.querySelector('#photo-dots');
    const prev = container.querySelector('#viewer-prev');
    const next = container.querySelector('#viewer-next');

    if (!img) return;

    const current = state.viewerPhotos[state.viewerIndex];
    if (current?.url) {
      img.src = current.url;
      img.style.opacity = '1';
    } else {
      img.removeAttribute('src');
      img.style.opacity = '0.3';
    }

    counter.textContent = `${state.viewerIndex + 1} / ${state.viewerPhotos.length}`;
    prev.disabled = state.viewerIndex <= 0;
    next.disabled = state.viewerIndex >= state.viewerPhotos.length - 1;
    prev.style.visibility = state.viewerPhotos.length > 1 ? 'visible' : 'hidden';
    next.style.visibility = state.viewerPhotos.length > 1 ? 'visible' : 'hidden';
    dots.innerHTML = state.viewerPhotos.map((_, index) => (
      `<span class="photo-viewer-dot ${index === state.viewerIndex ? 'active' : ''}"></span>`
    )).join('');
  }
}

function renderPendingTaskReview(pending) {
  if (!pending.length) {
    return `
      <div class="empty-state">
        ${icon('checkCircle', 48)}
        <h3>当前没有待审核任务</h3>
        <p>孩子提交任务后，会先出现在这里等待家长审核。</p>
      </div>
    `;
  }

  return pending.map((submission) => {
    const photoKeys = parsePhotoKeys(submission.photoKey || submission.photo_key);
    const photoCount = photoKeys.length;
    const gridClass = photoCount <= 1 ? 'photos-1' : photoCount <= 2 ? 'photos-2' : 'photos-4';

    return `
      <div class="review-card" data-stagger data-photo-keys='${JSON.stringify(photoKeys)}'>
        <div class="review-card-header">
          <div class="review-child-meta">
            <span class="review-avatar">${escapeHtml(submission.childAvatar || '🙂')}</span>
            <div style="min-width:0">
              <div class="review-child-name">${escapeHtml(submission.childName || '学生')}</div>
              <div class="review-time">${escapeHtml(formatTime(submission.createdAt || Date.now()))}</div>
            </div>
          </div>
          <span class="record-status-pill pending">待审核</span>
        </div>

        <div class="review-task-title">${escapeHtml(submission.taskTitle || '任务')}</div>
        <div class="review-task-points">+${submission.taskPoints || 0} 积分</div>

        ${photoCount ? `
          <div class="review-photos-grid ${gridClass}">
            ${photoKeys.map((key, index) => `
              <div class="review-photo-cell" data-photo-key="${key}" data-photo-idx="${index}" data-sub-id="${submission.id}">
                <span class="photo-loading">${icon('image', 22)}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="review-actions">
          <button class="btn btn-danger reject-btn" data-id="${submission.id}" type="button">${icon('x', 16)} 驳回</button>
          <button class="btn btn-primary approve-btn" data-id="${submission.id}" type="button">${icon('check', 16)} 通过</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderSubmissionRecords(records, selectedChild, expandedRecordId) {
  if (!records.length) {
    return `
      <div class="empty-state">
        ${icon('clock', 48)}
        <h3>\u8fd8\u6ca1\u6709\u4efb\u52a1\u8bb0\u5f55</h3>
        <p>${selectedChild ? `${escapeHtml(selectedChild.username)} \u8fd8\u6ca1\u6709\u63d0\u4ea4\u8bb0\u5f55\u3002` : '\u5b69\u5b50\u63d0\u4ea4\u548c\u5ba1\u6838\u540e\u7684\u8bb0\u5f55\u4f1a\u663e\u793a\u5728\u8fd9\u91cc\u3002'}</p>
      </div>
    `;
  }

  return `
    <div class="record-summary" data-stagger>
      <div class="record-summary-title">${selectedChild ? `${escapeHtml(selectedChild.username)} \u7684\u5b8c\u6210\u4e0e\u5ba1\u6838\u8bb0\u5f55` : '\u5168\u90e8\u5b69\u5b50\u7684\u5b8c\u6210\u4e0e\u5ba1\u6838\u8bb0\u5f55'}</div>
      <div class="record-summary-copy">\u8fd9\u91cc\u4f1a\u540c\u65f6\u663e\u793a\u63d0\u4ea4\u65f6\u95f4\u3001\u5ba1\u6838\u72b6\u6001\u3001\u5ba1\u6838\u65f6\u95f4\u548c\u9a73\u56de\u539f\u56e0\uff0c\u6309\u5b69\u5b50\u5207\u6362\u540e\u5c31\u80fd\u53ea\u770b\u4e00\u4e2a\u5b69\u5b50\u3002</div>
    </div>

    <div class="record-list">
      ${records.map((submission) => {
        const reviewMeta = parseReviewMeta(submission.rejectReason);
        const photoKeys = getSubmissionPhotoKeys(submission);
        const canPreviewPhotos = canPreviewReviewedSubmissionPhotos(submission);
        const photoState = canPreviewPhotos ? 'available' : getSubmissionPhotoState(submission);
        const isExpanded = expandedRecordId === submission.id;

        return `
          <div class="record-card ${isExpanded ? 'expanded' : ''}" data-stagger data-record-id="${submission.id}">
            <div class="record-head">
              <div class="record-title-wrap">
                <div class="record-title">${escapeHtml(submission.taskTitle || '\u4efb\u52a1')}</div>
                <div class="record-subtitle">
                  ${escapeHtml(submission.childName || '\u5b66\u751f')} · ${escapeHtml(formatTime(submission.createdAt || Date.now()))}
                </div>
              </div>
              <div class="record-head-side">
                <span class="record-status-pill ${submission.status}">${escapeHtml(recordStatusLabel(submission.status, submission.points || submission.taskPoints || 0))}</span>
                ${photoState === 'available' ? `
                  <button
                    class="record-photo-toggle ${isExpanded ? 'expanded' : ''}"
                    data-record-toggle="${submission.id}"
                    data-collapsed-label="\u67e5\u770b\u7167\u7247 (${photoKeys.length})"
                    data-expanded-label="\u6536\u8d77"
                    aria-expanded="${isExpanded ? 'true' : 'false'}"
                    type="button"
                  >
                    <span class="record-photo-toggle-icon">${icon('image', 14)}</span>
                    <span data-record-toggle-label>${isExpanded ? '\u6536\u8d77' : `\u67e5\u770b\u7167\u7247 (${photoKeys.length})`}</span>
                    <span class="record-photo-toggle-arrow">${icon('chevronRight', 14)}</span>
                  </button>
                ` : ''}
              </div>
            </div>

            <div class="record-flow">
              <div class="record-row">
                <strong>\u63d0\u4ea4</strong>
                <span>${escapeHtml(formatTime(submission.createdAt || Date.now()))} \u63d0\u4ea4\u4e86\u8fd9\u6761\u4efb\u52a1\u8bb0\u5f55</span>
              </div>
              <div class="record-row">
                <strong>\u5ba1\u6838</strong>
                <span>${escapeHtml(buildReviewText(submission, reviewMeta))}</span>
              </div>
              ${reviewMeta.reason ? `
                <div class="record-row record-reason">
                  <strong>\u539f\u56e0</strong>
                  <span>${escapeHtml(reviewMeta.reason)}</span>
                </div>
              ` : ''}
            </div>

            ${photoState === 'available' ? `
              <div class="record-photo-detail" ${isExpanded ? '' : 'hidden'}>
                <div class="record-photo-strip" data-photo-keys='${JSON.stringify(photoKeys)}'>
                  ${photoKeys.map((key, index) => `
                    <div class="record-photo-cell" data-photo-key="${key}" data-photo-idx="${index}">
                      <span class="photo-loading">${icon('image', 18)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderPendingRedemptions(pending, children) {
  if (!pending.length) {
    return `
      <div class="empty-state">
        ${icon('gift', 48)}
        <h3>当前没有待确认兑换</h3>
        <p>孩子兑换商品后，会先出现在这里等待确认。</p>
      </div>
    `;
  }

  return pending.map((redemption) => {
    const child = children.find((item) => item.id === redemption.childId);
    const childName = redemption.childName || child?.username || '学生';
    return `
      <div class="redemption-card" data-stagger>
        <div class="redemption-emoji">${escapeHtml(redemption.productEmoji || '🎁')}</div>
        <div class="redemption-info">
          <div class="redemption-name">${escapeHtml(redemption.productName || '商品')}</div>
          <div class="redemption-detail">${escapeHtml(childName)} · ${redemption.price || 0} 积分 · ${escapeHtml(formatTime(redemption.createdAt || Date.now()))}</div>
        </div>
        <button class="btn btn-primary btn-sm confirm-redeem-btn" data-id="${redemption.id}" type="button">确认</button>
      </div>
    `;
  }).join('');
}

function buildSubtitle(state, selectedChild, pendingSubmissions, submissionRecords, pendingRedemptions) {
  const subject = selectedChild ? `${selectedChild.username}` : '全部孩子';

  if (state.activeTab === 'tasks') {
    if (state.taskView === 'records') {
      return `${subject} · ${submissionRecords.length} 条任务完成与审核记录`;
    }
    return `${subject} · ${pendingSubmissions.length} 个任务待审核`;
  }

  return `${subject} · ${pendingRedemptions.length} 个商品兑换待确认`;
}

function parseReviewMeta(raw) {
  if (!raw) {
    return { reviewer: '', reason: '' };
  }

  if (raw.startsWith('approved_by:')) {
    return { reviewer: raw.replace('approved_by:', ''), reason: '' };
  }

  if (raw.startsWith('rejected_by:')) {
    const [reviewer, reason] = raw.replace('rejected_by:', '').split('|');
    return { reviewer: reviewer || '', reason: reason || '' };
  }

  return { reviewer: '', reason: raw };
}

function buildReviewText(submission, reviewMeta) {
  if (submission.status === 'pending') {
    return '\u8fd8\u5728\u7b49\u5f85\u5bb6\u957f\u5ba1\u6838';
  }

  if (submission.status === 'approved') {
    return `${reviewMeta.reviewer ? `${reviewMeta.reviewer} 已通过` : '已通过'} · ${formatTime(submission.reviewedAt || submission.createdAt || Date.now())}`;
  }

  if (submission.status === 'rejected') {
    return `${reviewMeta.reviewer ? `${reviewMeta.reviewer} 已驳回` : '已驳回'} · ${formatTime(submission.reviewedAt || submission.createdAt || Date.now())}`;
  }

  return `${statusLabel(submission.status)} · ${formatTime(submission.reviewedAt || submission.createdAt || Date.now())}`;
}

function recordStatusLabel(status, points) {
  if (status === 'approved') return `\u901a\u8fc7 +${points}`;
  if (status === 'rejected') return '\u5df2\u9a73\u56de';
  return '\u5f85\u5ba1\u6838';
}

function statusLabel(status) {
  return ({
    pending: '\u5f85\u5ba1\u6838',
    approved: '\u5df2\u901a\u8fc7',
    rejected: '\u5df2\u9a73\u56de',
  })[status] || '\u5df2\u8bb0\u5f55';
}

function formatTime(timestamp) {
  const value = Number(timestamp) || Date.now();
  const diff = Date.now() - value;

  if (diff < 60000) return '\u521a\u521a';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} \u5206\u949f\u524d`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} \u5c0f\u65f6\u524d`;
  return new Date(value).toLocaleDateString('zh-CN');
}
