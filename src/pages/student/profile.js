// ========================================
// Student profile page
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { toast } from '../../utils/notification.js';
import { animateNumber } from '../../utils/animations.js';
import { toggleTheme } from '../../main.js';
import { showBottomNav } from '../../utils/nav.js';
import { api } from '../../utils/api.js';
import { getPhoto } from '../../utils/camera.js';
import { AVATAR_EMOJIS, sanitizeEmoji } from '../../utils/emoji.js';
import { canPreviewReviewedSubmissionPhotos, getSubmissionPhotoKeys, getSubmissionPhotoState } from '../../utils/submission-photos.js';
import { escapeHtml } from '../../utils/escape.js';
import {
  registerCollapseTransitionEnd,
  registerExpandTransitionEnd,
} from '../../utils/expandable-transition.js';

export async function renderStudentProfile(container) {
  container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>`;

  await auth.refreshUser();
  const user = auth.requireUser();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  const [points, submissions, redemptions] = await Promise.all([
    store.getChildPoints(user.id),
    store.getChildSubmissions(user.id),
    store.getRedemptions(),
  ]);

  const childRedemptions = redemptions.filter((item) => item.childId === user.id);
  const approvedSubs = submissions.filter((item) => item.status === 'approved');
  const totalEarned = approvedSubs.reduce((sum, item) => sum + (item.points || 0), 0);
  const totalSpent = childRedemptions.reduce((sum, item) => sum + (item.price || 0), 0);
  const reviewedSubmissions = submissions
    .filter((item) => item.status !== 'pending')
    .sort((a, b) => (b.reviewedAt || b.createdAt || 0) - (a.reviewedAt || a.createdAt || 0))
    .slice(0, 6);

  const state = {
    expandedSubmissionId: null,
    photoCache: new Map(),
    viewerPhotos: [],
    viewerIndex: 0,
    viewerKeyHandler: null,
  };

  renderContent();

  function renderContent() {
    container.innerHTML = `
      <div class="page profile-page">
        <div class="page-header">
          <h1 class="page-title">个人中心</h1>
        </div>

        <div class="profile-card animate-fade-in-up">
          <div class="profile-avatar-lg" id="change-avatar-btn" style="cursor:pointer;position:relative">
            <span id="user-avatar-display">${sanitizeEmoji(user.avatar, '🙂')}</span>
            <div class="profile-avatar-edit">
              ${icon('edit', 10)}
            </div>
          </div>
          <h2 class="profile-name">${escapeHtml(user.username)}</h2>
          <p class="profile-role">学生</p>
        </div>

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

        ${renderReviewSection(reviewedSubmissions, state.expandedSubmissionId)}

        ${childRedemptions.length > 0 ? `
          <section class="profile-section animate-fade-in-up stagger-4">
            <h3 class="section-title" style="margin-bottom:var(--space-3)">最近兑换</h3>
            <div class="list-group">
              ${childRedemptions.slice(0, 5).map((item) => `
                <div class="list-item">
                  <span style="font-size:1.5rem">${sanitizeEmoji(item.productEmoji, '🎁')}</span>
                  <div class="list-item-content">
                    <div class="list-item-title">${escapeHtml(item.productName || '商品')}</div>
                    <div class="list-item-subtitle">
                      ${item.status === 'pending' ? '等待家长确认' : '已兑换'} ·
                      ${new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span class="badge ${item.status === 'pending' ? 'badge-warning' : 'badge-success'}">
                    ${item.status === 'pending' ? '待确认' : '已兑换'}
                  </span>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}

        <section class="profile-section animate-fade-in-up stagger-5">
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

      <div class="modal-overlay modal-centered" id="avatar-modal" style="display:none">
        <div class="modal-content">
          <div id="avatar-modal-body"></div>
        </div>
      </div>

      <div class="photo-viewer-overlay" id="photo-viewer" style="display:none">
        <div class="photo-viewer-header">
          <span class="photo-viewer-counter" id="photo-counter"></span>
          <button class="photo-viewer-close" id="close-viewer" type="button">×</button>
        </div>
        <div class="photo-viewer-body" id="photo-viewer-body">
          <img class="photo-viewer-img" id="photo-viewer-img" alt="审核照片预览" />
        </div>
        <div class="photo-viewer-nav">
          <button class="photo-viewer-arrow photo-viewer-prev" id="viewer-prev" type="button">${icon('chevronLeft', 28)}</button>
          <div class="photo-viewer-dots" id="photo-dots"></div>
          <button class="photo-viewer-arrow photo-viewer-next" id="viewer-next" type="button">${icon('chevronRight', 28)}</button>
        </div>
      </div>

      <style>
        .profile-page { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }
        .profile-card { text-align: center; padding: var(--space-6); margin-bottom: var(--space-4); }
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
        .profile-avatar-edit {
          position: absolute;
          right: -2px;
          bottom: -2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          box-shadow: var(--shadow-sm);
        }
        .profile-name { font-size: var(--text-xl); font-weight: var(--weight-bold); }
        .profile-role { font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: var(--space-1); }
        .profile-section { margin-bottom: var(--space-6); }
        .student-review-list { display: grid; gap: 8px; }
        .student-review-card {
          background: var(--color-surface);
          border-radius: 18px;
          border: 1px solid color-mix(in srgb, var(--color-text-primary) 6%, transparent);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }
        .student-review-trigger {
          width: 100%;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 14px;
          text-align: left;
        }
        .student-review-main {
          min-width: 0;
          display: grid;
          gap: 4px;
          flex: 1;
        }
        .student-review-title {
          font-size: 14px;
          font-weight: var(--weight-semibold);
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .student-review-subtitle { font-size: 11px; color: var(--color-text-secondary); }
        .student-review-side {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .student-review-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 999px;
          padding: 5px 8px;
          font-size: 11px;
          font-weight: var(--weight-semibold);
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          color: var(--color-primary);
          white-space: nowrap;
        }
        .student-review-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          color: var(--color-text-secondary);
          line-height: 1.5;
        }
        .student-review-row strong {
          min-width: 32px;
          font-size: 11px;
          color: var(--color-text-primary);
        }
        .student-review-reason { color: var(--color-danger); }
        .student-review-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: var(--weight-semibold);
          flex-shrink: 0;
        }
        .student-review-pill.approved { background: var(--color-success-soft); color: var(--color-success); }
        .student-review-pill.rejected { background: var(--color-danger-soft); color: var(--color-danger); }
        .student-review-arrow {
          display: inline-flex;
          align-items: center;
          color: var(--color-text-tertiary);
          transition: transform .32s var(--ease-out);
        }
        .student-review-card.expanded .student-review-arrow {
          transform: rotate(90deg);
        }
        .student-review-detail {
          max-height: 0;
          overflow: hidden;
          padding: 0 14px;
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
          transition:
            max-height .34s cubic-bezier(0.4, 0, 0.2, 1),
            padding-top .34s cubic-bezier(0.4, 0, 0.2, 1),
            padding-bottom .34s cubic-bezier(0.4, 0, 0.2, 1),
            opacity .24s ease,
            transform .34s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: max-height, opacity, transform;
        }
        .student-review-card.expanded .student-review-detail {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .student-review-photo-strip {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(88px, 96px);
          gap: 8px;
          overflow-x: auto;
          padding-top: 10px;
          scrollbar-width: none;
        }
        .student-review-photo-strip::-webkit-scrollbar { display: none; }
        .student-review-photo-cell {
          position: relative;
          aspect-ratio: 4 / 3;
          border-radius: 14px;
          overflow: hidden;
          background: color-mix(in srgb, var(--color-text-primary) 6%, transparent);
          cursor: pointer;
        }
        .student-review-photo-cell img {
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
        .photo-viewer-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          flex-direction: column;
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
        }
        .photo-viewer-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-4);
          padding: var(--space-4);
          padding-bottom: max(var(--space-4), env(safe-area-inset-bottom, 20px));
        }
        .photo-viewer-dots { display: flex; gap: 6px; align-items: center; }
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
        @media (max-width: 640px) {
          .student-review-side {
            gap: 6px;
          }
          .student-review-chip {
            padding-inline: 7px;
          }
        }
      </style>
    `;

    setTimeout(() => {
      const el = container.querySelector('#current-points');
      if (el) animateNumber(el, 0, points);
    }, 400);

    bindEvents();
    restoreExpandedReviewCards();
    showBottomNav('child', 'profile');
  }

  function bindEvents() {
    container.querySelector('#toggle-theme').onclick = (event) => {
      toggleTheme(event);
      const nextDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const iconSpan = container.querySelector('#toggle-theme span');
      const titleSpan = container.querySelector('#toggle-theme .list-item-title');
      if (iconSpan) iconSpan.innerHTML = nextDark ? icon('sun', 20) : icon('moon', 20);
      if (titleSpan) titleSpan.textContent = nextDark ? '浅色模式' : '深色模式';
    };

    container.querySelector('#logout-btn').onclick = () => {
      auth.logout();
      toast('已退出登录', 'info');
    };

    container.querySelector('#change-avatar-btn').onclick = () => showAvatarModal(container, user);

    container.querySelectorAll('[data-review-toggle]').forEach((button) => {
      button.addEventListener('click', () => toggleReviewCard(button.dataset.reviewToggle));
    });
  }

  async function getPhotoUrlCached(photoKey) {
    if (!photoKey) return null;

    if (!state.photoCache.has(photoKey)) {
      state.photoCache.set(photoKey, getPhoto(photoKey).catch(() => null));
    }

    return state.photoCache.get(photoKey);
  }

  async function hydrateStudentPhotoCells(scope = container) {
    const cells = Array.from(scope.querySelectorAll('.student-review-photo-cell[data-photo-key]'));
    await Promise.all(cells.map(async (cell) => {
      if (cell.dataset.hydrated === 'true') return;
      const photoKey = cell.dataset.photoKey;
      const dataUrl = await getPhotoUrlCached(photoKey);

      if (dataUrl) {
        cell.innerHTML = `<img src="${dataUrl}" alt="审核照片" />`;
        cell.dataset.loadedUrl = dataUrl;
      } else {
        cell.innerHTML = '<span class="photo-loading">照片已清理</span>';
      }

      cell.dataset.hydrated = 'true';
    }));

    cells.forEach((cell) => {
      if (cell.dataset.bound === 'true') return;
      cell.addEventListener('click', () => {
        const holder = cell.closest('[data-photo-keys]');
        if (!holder) return;

        const photoKeys = JSON.parse(holder.dataset.photoKeys || '[]');
        const startIndex = Number(cell.dataset.photoIdx) || 0;
        if (photoKeys.length) {
          openPhotoViewer(photoKeys, startIndex);
        }
      });
      cell.dataset.bound = 'true';
    });
  }

  function toggleReviewCard(submissionId) {
    const nextCard = container.querySelector(`.student-review-card[data-submission-id="${submissionId}"]`);
    if (!nextCard) return;

    const openCards = Array.from(container.querySelectorAll('.student-review-card.expanded'));
    const shouldCollapseCurrent = nextCard.classList.contains('expanded');

    openCards.forEach((card) => {
      if (card === nextCard && !shouldCollapseCurrent) return;
      collapseReviewCard(card);
    });

    if (shouldCollapseCurrent) {
      state.expandedSubmissionId = null;
      return;
    }

    state.expandedSubmissionId = submissionId;
    expandReviewCard(nextCard);
  }

  function restoreExpandedReviewCards() {
    const expandedCards = Array.from(container.querySelectorAll('.student-review-card.expanded'));
    expandedCards.forEach((card) => {
      const detail = card.querySelector('.student-review-detail');
      if (!detail) return;

      detail.hidden = false;
      detail.style.paddingTop = '10px';
      detail.style.paddingBottom = '12px';
      detail.style.opacity = '1';
      detail.style.transform = 'translateY(0)';
      detail.style.pointerEvents = 'auto';
      detail.style.maxHeight = 'none';
      hydrateStudentPhotoCells(card);
    });
  }

  function expandReviewCard(card) {
    const detail = card.querySelector('.student-review-detail');
    if (!detail) return;

    detail.hidden = false;
    detail.style.maxHeight = '0';
    detail.style.paddingTop = '0';
    detail.style.paddingBottom = '0';
    detail.style.opacity = '0';
    detail.style.transform = 'translateY(-6px)';
    detail.style.pointerEvents = 'none';

    card.classList.add('expanded');

    requestAnimationFrame(() => {
      detail.style.paddingTop = '10px';
      detail.style.paddingBottom = '12px';
      const targetHeight = detail.scrollHeight;
      detail.style.maxHeight = `${targetHeight}px`;
      detail.style.opacity = '1';
      detail.style.transform = 'translateY(0)';
      detail.style.pointerEvents = 'auto';
    });

    registerExpandTransitionEnd(detail, () => card.classList.contains('expanded'));

    hydrateStudentPhotoCells(card);
  }

  function collapseReviewCard(card) {
    const detail = card.querySelector('.student-review-detail');
    if (!detail) return;

    detail.hidden = false;
    detail.style.maxHeight = `${detail.scrollHeight}px`;
    detail.style.opacity = '1';
    detail.style.transform = 'translateY(0)';
    detail.style.pointerEvents = 'auto';

    requestAnimationFrame(() => {
      card.classList.remove('expanded');
      detail.style.maxHeight = '0';
      detail.style.paddingTop = '0';
      detail.style.paddingBottom = '0';
      detail.style.opacity = '0';
      detail.style.transform = 'translateY(-6px)';
      detail.style.pointerEvents = 'none';
    });

    registerCollapseTransitionEnd(detail, () => !card.classList.contains('expanded'));
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
      const cell = container.querySelector(`.student-review-photo-cell[data-photo-key="${item.key}"]`);
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
    } else {
      img.removeAttribute('src');
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

function renderReviewSection(submissions, expandedSubmissionId) {
  if (!submissions.length) {
    return `
      <section class="profile-section animate-fade-in-up stagger-3">
        <h3 class="section-title" style="margin-bottom:var(--space-3)">审核记录</h3>
        <div class="empty-state">
          ${icon('clock', 32)}
          <h3>还没有审核记录</h3>
          <p>任务提交并完成审核后，会在这里保留当天可查看的照片记录。</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="profile-section animate-fade-in-up stagger-3">
      <h3 class="section-title" style="margin-bottom:var(--space-3)">审核记录</h3>
      <div class="student-review-list">
        ${submissions.map((submission) => {
          const reviewMeta = parseReviewMeta(submission.rejectReason);
          const photoKeys = getSubmissionPhotoKeys(submission);
          const canPreviewPhotos = canPreviewReviewedSubmissionPhotos(submission);
          const photoState = canPreviewPhotos ? 'available' : getSubmissionPhotoState(submission);
          const isExpanded = expandedSubmissionId === submission.id;
          const submittedAt = formatRecordTime(submission.createdAt || Date.now());
          const reviewText = buildReviewText(submission, reviewMeta);

          return `
            <article class="student-review-card ${isExpanded ? 'expanded' : ''}" data-submission-id="${submission.id}" data-stagger>
              <button class="student-review-trigger" data-review-toggle="${submission.id}" type="button">
                <div class="student-review-main">
                  <div class="student-review-title">${escapeHtml(submission.taskTitle || '任务')}</div>
                  <div class="student-review-subtitle">${escapeHtml(submittedAt)}</div>
                </div>
                <div class="student-review-side">
                  ${photoState === 'available' ? `
                    <span class="student-review-chip">
                      ${icon('image', 12)}
                      照片 ${photoKeys.length}
                    </span>
                  ` : ''}
                  <span class="student-review-pill ${submission.status}">
                    ${escapeHtml(recordStatusLabel(submission.status, submission.points || submission.taskPoints || 0))}
                  </span>
                  <span class="student-review-arrow">${icon('chevronRight', 14)}</span>
                </div>
              </button>

              <div class="student-review-detail" ${isExpanded ? '' : 'hidden'}>
                <div class="student-review-row">
                  <strong>审核</strong>
                  <span>${escapeHtml(reviewText)}</span>
                </div>
                ${submission.status === 'rejected' && reviewMeta.reason ? `
                  <div class="student-review-row student-review-reason">
                    <strong>原因</strong>
                    <span>${escapeHtml(reviewMeta.reason)}</span>
                  </div>
                ` : ''}
                ${photoState === 'available' && photoKeys.length ? `
                  <div class="student-review-photo-strip" data-photo-keys='${JSON.stringify(photoKeys)}'>
                    ${photoKeys.map((key, index) => `
                      <div class="student-review-photo-cell" data-photo-key="${key}" data-photo-idx="${index}">
                        <span class="photo-loading">${icon('image', 18)}</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function showAvatarModal(container, user) {
  const modal = container.querySelector('#avatar-modal');
  const body = container.querySelector('#avatar-modal-body');
  const currentAvatar = sanitizeEmoji(user.avatar, '🙂');
  modal.style.display = 'flex';

  body.innerHTML = `
    <h2 class="modal-title" style="text-align:center">选择头像</h2>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:var(--space-2);margin-bottom:var(--space-4)">
      ${AVATAR_EMOJIS.map((emoji) => `
        <button class="avatar-opt" data-emoji="${emoji}" style="
          width:100%;aspect-ratio:1;border-radius:var(--radius-lg);
          font-size:1.6rem;display:flex;align-items:center;justify-content:center;
          background:var(--color-divider);border:2px solid ${emoji === currentAvatar ? 'var(--color-primary)' : 'transparent'};
          cursor:pointer;transition:all var(--duration-fast) var(--ease-out);
        ">${emoji}</button>
      `).join('')}
    </div>
    <button class="btn btn-secondary btn-block" id="close-avatar">关闭</button>
  `;

  body.querySelectorAll('.avatar-opt').forEach((button) => {
    button.onclick = async () => {
      const emoji = sanitizeEmoji(button.dataset.emoji, '🙂');
      body.querySelectorAll('.avatar-opt').forEach((item) => {
        item.style.borderColor = 'transparent';
      });
      button.style.borderColor = 'var(--color-primary)';
      container.querySelector('#user-avatar-display').textContent = emoji;
      user.avatar = emoji;

      try {
        await api.patch('/users/avatar', { avatar: emoji });
        auth.updateUserField('avatar', emoji);
        toast('头像已更新', 'success');
      } catch (error) {
        toast(`更新失败: ${error.message || '请重试'}`, 'error');
      }
    };
  });

  body.querySelector('#close-avatar').onclick = () => closeModal(modal);
  modal.onclick = (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  };
}

function closeModal(modal) {
  modal.classList.add('closing');
  setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('closing');
  }, 300);
}

function parseReviewMeta(raw) {
  if (!raw) {
    return { reviewer: '', reason: '' };
  }

  const normalized = String(raw).trim();

  if (normalized.startsWith('approved_by:')) {
    return { reviewer: normalized.replace('approved_by:', ''), reason: '' };
  }

  if (normalized.startsWith('rejected_by:')) {
    const [reviewer, reason] = normalized.replace('rejected_by:', '').split('|');
    return { reviewer: reviewer || '', reason: reason || '' };
  }

  return { reviewer: '', reason: normalized };
}

function buildReviewText(submission, reviewMeta) {
  const actor = reviewMeta.reviewer ? `家长 ${reviewMeta.reviewer}` : '家长';
  const reviewedAt = formatRecordTime(submission.reviewedAt || submission.createdAt || Date.now());

  if (submission.status === 'approved') {
    return `${actor}已通过 · ${reviewedAt}`;
  }

  if (submission.status === 'rejected') {
    return `${actor}已驳回 · ${reviewedAt}`;
  }

  return `${submission.status || '已记录'} · ${reviewedAt}`;
}

function recordStatusLabel(status, points) {
  if (status === 'approved') return `通过 +${points}`;
  if (status === 'rejected') return '已驳回';
  return '待审核';
}

function formatTime(timestamp) {
  const value = Number(timestamp) || Date.now();
  const diff = Date.now() - value;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return new Date(value).toLocaleDateString();
}

function formatRecordTime(timestamp) {
  const value = Number(timestamp) || Date.now();
  return new Date(value).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', '');
}
