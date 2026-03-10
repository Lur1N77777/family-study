// ========================================
// 鐎涳妇鏁撶粩?閳?娴犺濮熼崚妤勩€冮敍鍫熸暜閹镐礁顦块悡褏澧栭幓鎰唉閿?
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { router } from '../../utils/router.js';
import { selectMultiplePhotos, capturePhotoAsFile, compressImage, getPhoto } from '../../utils/camera.js';
import { toast } from '../../utils/notification.js';
import { staggerIn, haptic } from '../../utils/animations.js';
import { showBottomNav } from '../../utils/nav.js';
import { api } from '../../utils/api.js';
import { canPreviewReviewedSubmissionPhotos, getSubmissionPhotoKeys, getSubmissionPhotoState } from '../../utils/submission-photos.js';
import { escapeHtml } from '../../utils/escape.js';
import { enhanceSegmentedControls, runViewTransition } from '../../utils/segmented-control.js';
import {
  cancelExpandableAnimations,
  queueExpandableFrame,
  registerCollapseTransitionEnd,
  registerExpandTransitionEnd,
} from '../../utils/expandable-transition.js';

export async function renderStudentTasks(container) {
  container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>`;

  await auth.refreshUser();
  const user = auth.requireUser();

  const [tasks, submissions] = await Promise.all([
    store.getTasks(),
    store.getSubmissions(null, user.id)
  ]);

  let activeTab = 'all';
  let expandedId = null;
  let expandedRecordId = null;
  const photoCache = new Map();
  let viewerPhotos = [];
  let viewerIndex = 0;
  let viewerKeyHandler = null;
  let hasAnimatedIn = false;

  // 閳光偓閳光偓 閹绘劒姘?Modal 閻樿埖鈧?閳光偓閳光偓
  let submitTaskId = null;
  let pendingPhotos = []; // { file: File, previewUrl: string }[]

  function render() {
    const filtered = activeTab === 'all' ? tasks : tasks.filter(t => t.type === activeTab);

    const tasksWithStatus = filtered.map(task => {
      const todaySub = task.currentSubmission || task.todaySubmission;
      const allTaskSubs = submissions.filter(s => s.task_id === task.id);
      const latestSub = allTaskSubs[0];
      return { ...task, todaySubmission: todaySub, latestSub };
    });

    const counts = {
      all: tasks.length,
      daily: tasks.filter(t => t.type === 'daily').length,
      weekly: tasks.filter(t => t.type === 'weekly').length,
      once: tasks.filter(t => t.type === 'once').length,
      semester: tasks.filter(t => t.type === 'semester').length
    };

    const reviewRecords = [...submissions]
      .filter((submission) => submission.status !== 'pending')
      .sort((a, b) => ((b.reviewedAt || b.createdAt || 0) - (a.reviewedAt || a.createdAt || 0)))
      .slice(0, 10);

    container.innerHTML = `
      <div class="page tasks-page">
        <div class="page-header">
          <h1 class="page-title">任务</h1>
          <p class="page-subtitle">${tasks.length} 个任务，查看今天和本周期的完成情况</p>
        </div>

        <div class="tabs" data-segmented="student-tasks-type">
          <button class="tab ${activeTab === 'all' ? 'active' : ''}" data-tab="all">全部<span class="tab-count">${counts.all}</span></button>
          <button class="tab ${activeTab === 'daily' ? 'active' : ''}" data-tab="daily">每日<span class="tab-count">${counts.daily}</span></button>
          <button class="tab ${activeTab === 'weekly' ? 'active' : ''}" data-tab="weekly">每周<span class="tab-count">${counts.weekly}</span></button>
          <button class="tab ${activeTab === 'once' ? 'active' : ''}" data-tab="once">单次<span class="tab-count">${counts.once}</span></button>
          <button class="tab ${activeTab === 'semester' ? 'active' : ''}" data-tab="semester">学期<span class="tab-count">${counts.semester}</span></button>
        </div>

        <div class="task-list-compact" id="tasks-container">
          ${tasksWithStatus.map(task => {
      const todaySub = task.currentSubmission || task.todaySubmission;
      const canSubmit = !todaySub || todaySub.status === 'rejected';
      const isExpanded = expandedId === task.id;
      const statusText = todaySub
        ? todaySub.status === 'pending'
          ? '已提交，等待审核'
          : todaySub.status === 'approved'
            ? '本周期已完成，不可重复提交'
            : '已驳回，可重新提交'
        : '本周期还未提交';

      const statusClass = todaySub
        ? todaySub.status === 'pending' ? 'status-pending'
          : todaySub.status === 'approved' ? 'status-approved'
            : todaySub.status === 'rejected' ? 'status-rejected' : ''
        : '';

      const statusDot = todaySub
        ? todaySub.status === 'pending' ? 'var(--color-warning)'
          : todaySub.status === 'approved' ? 'var(--color-success)'
            : 'var(--color-danger)'
        : '';

      return `
              <div class="task-compact ${statusClass} ${isExpanded ? 'expanded' : ''}" data-task-id="${task.id}" data-stagger>
                <div class="task-compact-row" data-toggle="${task.id}">
                  <span class="task-type-dot badge-${task.type === 'daily' ? 'primary' : task.type === 'weekly' ? 'warning' : task.type === 'semester' ? 'danger' : 'success'}">
                    ${task.type === 'daily' ? '\u65e5' : task.type === 'weekly' ? '\u5468' : task.type === 'semester' ? '\u5b66' : '\u6b21'}
                  </span>
                  ${todaySub ? `<span class="task-status-indicator" style="background:${statusDot}"></span>` : ''}
                  <span class="task-compact-title ${todaySub?.status === 'approved' ? 'done' : ''}">${task.title}</span>
                  <span class="task-compact-pts">+${task.points}</span>
                  <span class="task-compact-arrow">${icon('chevronRight', 14)}</span>
                </div>
                <div class="task-compact-detail">
                  ${task.description ? `<p class="task-compact-desc">${task.description}</p>` : ''}
                  ${task.penalty_enabled ? `
                    <div class="task-penalty-note">
                      ${`\u672a\u5b8c\u6210\u5c06\u6263 ${task.penalty_points} \u5206\uff0c${getPenaltyScheduleText(task.type)}`}
                    </div>
                  ` : ''}
                  <div class="task-compact-status ${statusClass || 'status-idle'}">${statusText}</div>
                  ${todaySub ? `
                    ${todaySub.status === 'rejected' && todaySub.reject_reason ? `<div class="task-reject-reason">${todaySub.reject_reason}</div>` : ''}
                  ` : ''}
                  <div class="task-compact-actions">
                    ${canSubmit ? `
                      <button class="btn btn-primary btn-sm task-complete-btn" data-task-id="${task.id}">
                        ${icon('camera', 14)} 去提交
                      </button>
                    ` : todaySub.status === 'pending' ? `
                      <span class="badge badge-warning">审核中</span>
                    ` : `
                      <span class="badge badge-success">${icon('checkCircle', 12)} 已完成</span>
                    `}
                  </div>
                </div>
              </div>
            `;
    }).join('')}
          ${tasksWithStatus.length === 0 ? `
            <div class="empty-state">
              ${icon('tasks', 48)}
              <h3>${activeTab === 'all' ? '\u6682\u65e0' : '\u6682\u65e0\u6b64\u7c7b'}\u4efb\u52a1</h3>
              <p>\u7b49\u5f85\u5bb6\u957f\u53d1\u5e03\u65b0\u4efb\u52a1</p>
            </div>
          ` : ''}
        </div>

        <section class="student-review-section">
          <div class="student-review-head">
            <h2 class="section-title">审核记录</h2>
            <span class="student-review-count">${reviewRecords.length}</span>
          </div>
          ${renderStudentReviewRecords(reviewRecords, expandedRecordId)}
        </section>
      </div>

      <div class="modal-overlay" id="submit-modal" style="display:none">
        <div class="modal-content submit-modal-content">
          <div class="modal-handle"></div>
          <div id="submit-modal-body"></div>
        </div>
      </div>

      <div class="photo-viewer-overlay" id="photo-viewer" style="display:none">
        <div class="photo-viewer-header">
          <span class="photo-viewer-counter" id="photo-counter"></span>
          <button class="photo-viewer-close" id="close-viewer" type="button">关闭</button>
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
        .tasks-page { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }

        .task-list-compact { display: flex; flex-direction: column; gap: var(--space-2); }

        .task-compact {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .task-compact.status-approved { border-left: 3px solid var(--color-success); }
        .task-compact.status-pending { border-left: 3px solid var(--color-warning); }
        .task-compact.status-rejected { border-left: 3px solid var(--color-danger); }

        .task-compact-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .task-compact-row:active { background: var(--color-divider); }

        .task-type-dot {
          font-size: 10px;
          font-weight: var(--weight-bold);
          width: 22px; height: 22px;
          border-radius: var(--radius-full);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .task-type-dot.badge-primary { background: var(--color-primary-soft); color: var(--color-primary); }
        .task-type-dot.badge-warning { background: var(--color-warning-soft); color: var(--color-warning); }
        .task-type-dot.badge-success { background: var(--color-success-soft); color: var(--color-success); }
        .task-type-dot.badge-danger { background: var(--color-danger-soft); color: var(--color-danger); }

        .task-status-indicator { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        .task-compact-title {
          flex: 1; min-width: 0;
          font-size: var(--text-base);
          font-weight: var(--weight-semibold);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .task-compact-title.done {
          text-decoration: line-through;
          color: var(--color-text-secondary);
        }

        .task-compact-pts {
          font-family: var(--font-mono);
          font-weight: var(--weight-bold);
          color: var(--color-primary);
          font-size: var(--text-sm);
          flex-shrink: 0;
        }

        .task-compact-arrow {
          color: var(--color-text-tertiary);
          transition: transform 0.25s var(--ease-out);
          flex-shrink: 0; line-height: 0;
        }
        .task-compact.expanded .task-compact-arrow { transform: rotate(90deg); }

        .task-compact-detail {
          overflow: hidden;
          max-height: 0;
          padding: 0 var(--space-4);
          transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                      padding-bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: max-height;
        }

        .task-compact-desc {
          font-size: var(--text-sm); color: var(--color-text-secondary);
          line-height: 1.5; margin-bottom: var(--space-2);
        }
        .task-compact-status {
          font-size: var(--text-xs); font-weight: var(--weight-semibold); margin-bottom: var(--space-2);
        }
        .task-compact-status.status-pending { color: var(--color-warning); }
        .task-compact-status.status-approved { color: var(--color-success); }
        .task-compact-status.status-rejected { color: var(--color-danger); }
        .task-compact-status.status-idle { color: var(--color-text-tertiary); }

        .task-penalty-note {
          font-size: var(--text-xs);
          color: var(--color-danger);
          margin-bottom: var(--space-2);
          padding: var(--space-2);
          border-radius: var(--radius-sm);
          background: var(--color-danger-soft);
        }

        .task-reject-reason {
          font-size: var(--text-xs); color: var(--color-text-tertiary);
          background: var(--color-danger-soft);
          padding: 2px var(--space-2); border-radius: var(--radius-sm);
          margin-bottom: var(--space-2); display: inline-block;
        }

        .task-compact-actions { display: flex; justify-content: flex-end; }

        .student-review-section {
          margin-top: var(--space-5);
          display: grid;
          gap: var(--space-3);
        }

        .student-review-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-2);
        }

        .student-review-count {
          min-width: 28px;
          height: 28px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-xs);
          font-weight: var(--weight-semibold);
          color: var(--color-primary);
          background: var(--color-primary-soft);
        }

        .student-record-list {
          display: grid;
          gap: var(--space-2);
        }

        .student-record-card {
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid color-mix(in srgb, var(--color-text-primary) 6%, transparent);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .student-record-toggle {
          width: 100%;
          border: none;
          background: transparent;
          padding: var(--space-3) var(--space-4);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          text-align: left;
        }

        .student-record-main {
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .student-record-title {
          font-size: var(--text-sm);
          font-weight: var(--weight-semibold);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .student-record-meta {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .student-record-side {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .student-record-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 8px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          color: var(--color-primary);
          font-size: 11px;
          font-weight: var(--weight-semibold);
          white-space: nowrap;
        }

        .student-record-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: var(--weight-semibold);
        }

        .student-record-pill.approved { background: var(--color-success-soft); color: var(--color-success); }
        .student-record-pill.rejected { background: var(--color-danger-soft); color: var(--color-danger); }

        .student-record-arrow {
          color: var(--color-text-tertiary);
          transition: transform .32s var(--ease-out);
          display: inline-flex;
        }

        .student-record-card.expanded .student-record-arrow {
          transform: rotate(90deg);
        }

        .student-record-detail {
          max-height: 0;
          overflow: hidden;
          padding: 0 var(--space-4);
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

        .student-record-card.expanded .student-record-detail {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .student-record-copy {
          display: grid;
          gap: 6px;
          padding-top: 2px;
        }

        .student-record-row {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          line-height: 1.55;
        }

        .student-record-row strong {
          color: var(--color-text-primary);
        }

        .student-record-reason {
          color: var(--color-danger);
        }

        .student-record-note {
          display: none;
        }

        .student-record-note.expired {
          display: none;
        }

        .student-record-photos {
          display: flex;
          gap: var(--space-2);
          overflow-x: auto;
          margin-top: var(--space-2);
          padding-bottom: 2px;
          scrollbar-width: none;
        }

        .student-record-photos::-webkit-scrollbar { display: none; }

        .student-record-photo {
          position: relative;
          width: 78px;
          height: 78px;
          border-radius: var(--radius-md);
          overflow: hidden;
          flex: 0 0 auto;
          background: color-mix(in srgb, var(--color-text-primary) 6%, transparent);
          cursor: pointer;
          border: none;
          padding: 0;
        }

        .student-record-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .student-photo-loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: var(--color-text-tertiary);
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
        }

        .photo-viewer-dot.active {
          background: #fff;
          transform: scale(1.3);
        }

        /* 閳光偓閳光偓 閹绘劒姘?Modal 閺嶅嘲绱?閳光偓閳光偓 */
        .submit-modal-content {
          max-height: 85vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .submit-modal-title {
          font-size: var(--text-lg);
          font-weight: var(--weight-bold);
          margin-bottom: var(--space-4);
          text-align: center;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .photo-grid-item {
          position: relative;
          aspect-ratio: 1;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--color-bg-secondary, var(--color-divider));
        }

        .photo-grid-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-remove-btn {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(0,0,0,0.6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          line-height: 1;
          cursor: pointer;
          border: none;
          padding: 0;
          z-index: 2;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .photo-add-slot {
          aspect-ratio: 1;
          border-radius: var(--radius-lg);
          border: 2px dashed var(--color-border);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-1);
          cursor: pointer;
          color: var(--color-text-tertiary);
          font-size: var(--text-xs);
          transition: all var(--duration-fast) var(--ease-out);
          background: transparent;
          padding: 0;
        }

        .photo-add-slot:active {
          transform: scale(0.95);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .photo-source-btns {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-4);
        }

        .photo-source-btns .btn {
          flex: 1;
          font-size: var(--text-sm);
        }

        .photo-count-hint {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          text-align: center;
          margin-bottom: var(--space-3);
        }

        .submit-actions {
          display: flex;
          gap: var(--space-3);
        }
        .submit-actions .btn { flex: 1; }
      </style>
    `;

    // Tab 娴滃娆?
    enhanceSegmentedControls(container);

    container.querySelectorAll('.tab').forEach(tab => {
      tab.onclick = () => {
        if (activeTab === tab.dataset.tab) return;
        runViewTransition(() => {
          activeTab = tab.dataset.tab;
          render();
        });
      };
    });

    // 閹舵ê褰?鐏炴洖绱戦敍鍫滅喘閸栨牕濮╅悽缁樼ウ閻ｅ懏鈧嶇礆
    container.querySelectorAll('.task-compact-row[data-toggle]').forEach(row => {
      row.onclick = () => {
        const id = row.dataset.toggle;
        const card = row.closest('.task-compact');
        const detail = card.querySelector('.task-compact-detail');
        const computed = window.getComputedStyle(detail);

        if (expandedId === id) {
          // 閺€鎯版崳瑜版挸澧犻崡锛勫
          expandedId = null;
          cancelExpandableAnimations(detail);
          card.classList.remove('expanded');
          detail.style.maxHeight = `${detail.offsetHeight || detail.scrollHeight}px`;
          detail.style.paddingBottom = computed.paddingBottom === '0px' ? '0' : computed.paddingBottom;
          queueExpandableFrame(detail, () => {
            detail.style.maxHeight = '0';
            detail.style.paddingBottom = '0';
          });
        } else {
          // 閺€鎯版崳瀹告彃鐫嶅鈧惃鍕幢閻?
          container.querySelectorAll('.task-compact.expanded').forEach(c => {
            const d = c.querySelector('.task-compact-detail');
            cancelExpandableAnimations(d);
            d.style.maxHeight = `${d.offsetHeight || d.scrollHeight}px`;
            d.style.paddingBottom = window.getComputedStyle(d).paddingBottom;
            queueExpandableFrame(d, () => {
              d.style.maxHeight = '0';
              d.style.paddingBottom = '0';
            });
            c.classList.remove('expanded');
          });
          // 鐏炴洖绱戦弬鏉垮幢閻?
          expandedId = id;
          cancelExpandableAnimations(detail);
          card.classList.add('expanded');
          detail.style.maxHeight = `${detail.offsetHeight}px`;
          detail.style.paddingBottom = computed.paddingBottom === '0px' ? '0' : computed.paddingBottom;
          queueExpandableFrame(detail, () => {
            detail.style.paddingBottom = 'var(--space-3)';
            detail.style.maxHeight = `${detail.scrollHeight}px`;
          });
          registerExpandTransitionEnd(detail, () => card.classList.contains('expanded'));
        }
      };
    });

    // 閹绘劒姘﹂幐澶愭尦 閳?閹垫挸绱?Modal
    container.querySelectorAll('.task-complete-btn').forEach(btn => {
      btn.onclick = () => {
        haptic('medium');
        submitTaskId = btn.dataset.taskId;
        pendingPhotos = [];
        openSubmitModal();
      };
    });

    container.querySelectorAll('[data-record-toggle]').forEach((button) => {
      button.onclick = () => {
        toggleStudentRecord(button.dataset.recordToggle);
      };
    });

    restoreExpandedStudentRecords();

    if (!hasAnimatedIn) {
      staggerIn(container, '[data-stagger]');
      hasAnimatedIn = true;
    }
    showBottomNav('child', 'tasks');
  }

  async function getPhotoUrlCached(photoKey) {
    if (!photoKey) return null;

    if (!photoCache.has(photoKey)) {
      photoCache.set(photoKey, getPhoto(photoKey).catch(() => null));
    }

    return photoCache.get(photoKey);
  }

  async function hydrateReviewRecordPhotos(scope = container) {
    const cells = Array.from(scope.querySelectorAll('.student-record-photo[data-photo-key]'));
    await Promise.all(cells.map(async (cell) => {
      if (cell.dataset.hydrated === 'true') return;
      const photoKey = cell.dataset.photoKey;
      const dataUrl = await getPhotoUrlCached(photoKey);

      if (dataUrl) {
        cell.innerHTML = `<img src="${dataUrl}" alt="审核照片" />`;
        cell.dataset.loadedUrl = dataUrl;
      } else {
        cell.innerHTML = '<span class="student-photo-loading">加载失败</span>';
      }

      cell.dataset.hydrated = 'true';
    }));

    cells.forEach((cell) => {
      if (cell.dataset.bound === 'true') return;
      cell.onclick = () => {
        const holder = cell.closest('[data-photo-keys]');
        if (!holder) return;

        try {
          const photoKeys = JSON.parse(holder.dataset.photoKeys || '[]');
          const startIndex = Number(cell.dataset.photoIdx) || 0;
          if (photoKeys.length) {
            openPhotoViewer(photoKeys, startIndex);
          }
        } catch {
          // Ignore malformed payloads.
        }
      };
      cell.dataset.bound = 'true';
    });
  }

  function restoreExpandedStudentRecords() {
    const expandedCards = Array.from(container.querySelectorAll('.student-record-card.expanded'));
    expandedCards.forEach((card) => {
      const detail = card.querySelector('.student-record-detail');
      if (!detail) return;

      detail.hidden = false;
      detail.style.paddingTop = '6px';
      detail.style.paddingBottom = '16px';
      detail.style.opacity = '1';
      detail.style.transform = 'translateY(0)';
      detail.style.pointerEvents = 'auto';
      detail.style.maxHeight = 'none';
      hydrateReviewRecordPhotos(card);
    });
  }

  function toggleStudentRecord(recordId) {
    const nextCard = container.querySelector(`.student-record-card[data-record-id="${recordId}"]`);
    if (!nextCard) return;

    const openedCards = Array.from(container.querySelectorAll('.student-record-card.expanded'));
    const shouldCollapseCurrent = nextCard.classList.contains('expanded');

    openedCards.forEach((card) => {
      if (card === nextCard && !shouldCollapseCurrent) return;
      collapseStudentRecord(card);
    });

    if (shouldCollapseCurrent) {
      expandedRecordId = null;
      return;
    }

    expandedRecordId = recordId;
    expandStudentRecord(nextCard);
  }

  function expandStudentRecord(card) {
    const detail = card.querySelector('.student-record-detail');
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

    queueExpandableFrame(detail, () => {
      detail.style.paddingTop = '6px';
      detail.style.paddingBottom = '16px';
      const targetHeight = detail.scrollHeight;
      detail.style.maxHeight = `${targetHeight}px`;
      detail.style.opacity = '1';
      detail.style.transform = 'translateY(0)';
      detail.style.pointerEvents = 'auto';
    });

    registerExpandTransitionEnd(detail, () => card.classList.contains('expanded'));

    hydrateReviewRecordPhotos(card);
  }

  function collapseStudentRecord(card) {
    const detail = card.querySelector('.student-record-detail');
    if (!detail) return;

    cancelExpandableAnimations(detail);
    detail.hidden = false;
    detail.style.maxHeight = `${detail.offsetHeight || detail.scrollHeight}px`;
    detail.style.opacity = window.getComputedStyle(detail).opacity;
    detail.style.transform = 'translateY(0)';
    detail.style.pointerEvents = 'auto';

    queueExpandableFrame(detail, () => {
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
    viewerPhotos = photoKeys.map((key) => ({ key, url: null }));
    viewerIndex = startIndex;

    const viewer = container.querySelector('#photo-viewer');
    viewer.style.display = 'flex';

    loadViewerPhotos();
    updateViewer();

    container.querySelector('#close-viewer').onclick = closePhotoViewer;
    container.querySelector('#viewer-prev').onclick = () => {
      if (viewerIndex > 0) {
        viewerIndex -= 1;
        updateViewer();
      }
    };
    container.querySelector('#viewer-next').onclick = () => {
      if (viewerIndex < viewerPhotos.length - 1) {
        viewerIndex += 1;
        updateViewer();
      }
    };

    const viewerBody = container.querySelector('#photo-viewer-body');
    viewerBody.onclick = (event) => {
      if (event.target === viewerBody) closePhotoViewer();
    };

    viewerKeyHandler = (event) => {
      if (event.key === 'Escape') closePhotoViewer();
      if (event.key === 'ArrowLeft' && viewerIndex > 0) {
        viewerIndex -= 1;
        updateViewer();
      }
      if (event.key === 'ArrowRight' && viewerIndex < viewerPhotos.length - 1) {
        viewerIndex += 1;
        updateViewer();
      }
    };

    document.addEventListener('keydown', viewerKeyHandler);
  }

  function closePhotoViewer() {
    const viewer = container.querySelector('#photo-viewer');
    if (!viewer) return;

    viewer.style.display = 'none';
    if (viewerKeyHandler) {
      document.removeEventListener('keydown', viewerKeyHandler);
      viewerKeyHandler = null;
    }

    viewerPhotos = [];
    viewerIndex = 0;
  }

  async function loadViewerPhotos() {
    for (let index = 0; index < viewerPhotos.length; index += 1) {
      const item = viewerPhotos[index];
      const cell = container.querySelector(`.student-record-photo[data-photo-key="${item.key}"]`);
      if (cell?.dataset.loadedUrl) {
        item.url = cell.dataset.loadedUrl;
      } else {
        item.url = await getPhotoUrlCached(item.key);
      }

      if (index === viewerIndex) {
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

    const current = viewerPhotos[viewerIndex];
    if (current?.url) {
      img.src = current.url;
    } else {
      img.removeAttribute('src');
    }

    counter.textContent = `${viewerIndex + 1} / ${viewerPhotos.length}`;
    prev.style.visibility = viewerPhotos.length > 1 ? 'visible' : 'hidden';
    next.style.visibility = viewerPhotos.length > 1 ? 'visible' : 'hidden';
    prev.disabled = viewerIndex <= 0;
    next.disabled = viewerIndex >= viewerPhotos.length - 1;
    dots.innerHTML = viewerPhotos.map((_, index) => (
      `<span class="photo-viewer-dot ${index === viewerIndex ? 'active' : ''}"></span>`
    )).join('');
  }

  // 閳光偓閳光偓 閹绘劒姘?Modal 闁槒绶?閳光偓閳光偓
  function openSubmitModal() {
    const modal = container.querySelector('#submit-modal');
    modal.style.display = 'flex';
    renderSubmitModal();

    // 閻愮懓鍤柆顔惧兊閸忔娊妫?
    modal.onclick = (e) => {
      if (e.target === modal) closeSubmitModal();
    };
  }

  function closeSubmitModal() {
    const modal = container.querySelector('#submit-modal');
    modal.classList.add('closing');
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.remove('closing');
      // 濞撳懐鎮婃０鍕潔 URL
      pendingPhotos.forEach(p => URL.revokeObjectURL(p.previewUrl));
      pendingPhotos = [];
      submitTaskId = null;
    }, 300);
  }

  function renderSubmitModal() {
    const body = container.querySelector('#submit-modal-body');
    const remaining = 4 - pendingPhotos.length;

    body.innerHTML = `
      <h2 class="submit-modal-title">\u63d0\u4ea4\u4efb\u52a1</h2>

      <div class="photo-count-hint">
        \u5df2\u9009 ${pendingPhotos.length}/4 \u5f20\u7167\u7247${remaining > 0 ? `\uff0c\u8fd8\u53ef\u6dfb\u52a0 ${remaining} \u5f20` : '\uff08\u5df2\u8fbe\u4e0a\u9650\uff09'}
      </div>

      <div class="photo-grid">
        ${pendingPhotos.map((p, i) => `
          <div class="photo-grid-item">
            <img src="${p.previewUrl}" alt="照片 ${i + 1}" />
            <button class="photo-remove-btn" data-idx="${i}" type="button">×</button>
          </div>
        `).join('')}
        ${remaining > 0 ? `
          <button class="photo-add-slot" id="add-photo-slot" type="button">
            <span style="font-size:24px">+</span>
            <span>选择照片</span>
          </button>
        ` : ''}
      </div>

      ${remaining > 0 ? `
        <div class="photo-source-btns">
          <button class="btn btn-secondary btn-sm" id="btn-camera">
            ${icon('camera', 16)} \u62cd\u7167
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-album">
            ${icon('image', 16)} \u4ece\u76f8\u518c\u9009\u62e9
          </button>
        </div>
      ` : ''}

      <div class="submit-actions">
        <button class="btn btn-secondary btn-lg" id="btn-cancel-submit">\u53d6\u6d88</button>
        <button class="btn btn-primary btn-lg" id="btn-confirm-submit" ${pendingPhotos.length === 0 ? 'disabled' : ''}>
          ${icon('check', 16)} \u63d0\u4ea4 (${pendingPhotos.length}\u5f20)
        </button>
      </div>
    `;

    // 閸掔娀娅庨悡褏澧?
    body.querySelectorAll('.photo-remove-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        URL.revokeObjectURL(pendingPhotos[idx].previewUrl);
        pendingPhotos.splice(idx, 1);
        haptic('light');
        renderSubmitModal();
      };
    });

    // 閻愮懓鍤?+ 閸欓攱鍧婇崝鐘靛弾閻楀浄绱欑粵澶婃倱娴滃簼绮犻惄绋垮斀闁瀚ㄩ敍?
    const addSlot = body.querySelector('#add-photo-slot');
    if (addSlot) {
      addSlot.onclick = () => pickFromAlbum();
    }

    // 閹峰秶鍙庨幐澶愭尦
    const cameraBtn = body.querySelector('#btn-camera');
    if (cameraBtn) {
      cameraBtn.onclick = async () => {
        if (pendingPhotos.length >= 4) return;
        try {
          const result = await capturePhotoAsFile();
          pendingPhotos.push(result);
          haptic('light');
          renderSubmitModal();
        } catch (err) {
          if (err.message !== '\u53d6\u6d88\u62cd\u7167') toast(err.message, 'error');
        }
      };
    }

    // 娴犲海娴夐崘宀勨偓澶嬪閹稿鎸?
    const albumBtn = body.querySelector('#btn-album');
    if (albumBtn) {
      albumBtn.onclick = () => pickFromAlbum();
    }

    // 閸欐牗绉?
    body.querySelector('#btn-cancel-submit').onclick = () => closeSubmitModal();

    // 绾喛顓婚幓鎰唉
    body.querySelector('#btn-confirm-submit').onclick = () => doSubmit();
  }

  async function pickFromAlbum() {
    const remaining = 4 - pendingPhotos.length;
    if (remaining <= 0) return;
    try {
      const results = await selectMultiplePhotos(remaining);
      for (const r of results) {
        if (pendingPhotos.length < 4) {
          pendingPhotos.push(r);
        } else {
          URL.revokeObjectURL(r.previewUrl);
        }
      }
      haptic('light');
      renderSubmitModal();
    } catch (err) {
      if (err.message !== '\u53d6\u6d88\u9009\u62e9') toast(err.message, 'error');
    }
  }

  async function doSubmit() {
    if (!submitTaskId || pendingPhotos.length === 0) return;

    const submitBtn = container.querySelector('#btn-confirm-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '\u4e0a\u4f20\u4e2d...';

    try {
      // 1. 閹靛綊鍣烘稉濠佺炊閻撗呭
      toast('\u6b63\u5728\u4e0a\u4f20\u7167\u7247...', 'info');
      const files = pendingPhotos.map(p => p.file);
      const uploadRes = await api.uploadMultiplePhotos(files);
      if (uploadRes.error) throw new Error(uploadRes.error);

      // 2. 閹绘劒姘︽禒璇插閿涘牅濞囬悽?photoKeys 閺佹壆绮嶉敍?
      toast('\u6b63\u5728\u63d0\u4ea4\u4efb\u52a1...', 'info');
      const submitRes = await api.post('/submissions', {
        taskId: submitTaskId,
        photoKeys: uploadRes.keys,
      });
      if (submitRes.error) throw new Error(submitRes.error);

      toast('\u63d0\u4ea4\u6210\u529f\uff01\u7b49\u5f85\u5bb6\u957f\u5ba1\u6838', 'success');
      haptic('success');
      closeSubmitModal();
      renderStudentTasks(container);
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `${icon('check', 16)} \u63d0\u4ea4 (${pendingPhotos.length}\u5f20)`;
      toast(err.message || '\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5', 'error');
    }
  }

  render();
}

function renderStudentReviewRecords(records, expandedRecordId) {
  if (!records.length) {
    return `
      <div class="empty-state">
        ${icon('clock', 40)}
        <h3>\u4eca\u5929\u8fd8\u6ca1\u6709\u5ba1\u6838\u8bb0\u5f55</h3>
        <p>\u4efb\u52a1\u5ba1\u6838\u540e\u4f1a\u663e\u793a\u5728\u8fd9\u91cc\uff0c\u5f53\u5929\u53ef\u4ee5\u5c55\u5f00\u67e5\u770b\u5ba1\u6838\u7167\u7247\u3002</p>
      </div>
    `;
  }

  return `
    <div class="student-record-list">
      ${records.map((submission) => {
        const photoKeys = getSubmissionPhotoKeys(submission);
        const photoState = canPreviewReviewedSubmissionPhotos(submission)
          ? 'available'
          : getSubmissionPhotoState(submission);
        const isExpanded = expandedRecordId === submission.id;
        const reviewReason = parseStudentReviewReason(submission.rejectReason || submission.reject_reason);
        const statusLabel = submission.status === 'approved'
          ? `\u5df2\u901a\u8fc7 +${submission.points || submission.taskPoints || 0}`
          : '\u5df2\u9a73\u56de';

        return `
          <article class="student-record-card ${isExpanded ? 'expanded' : ''}" data-record-id="${submission.id}" data-stagger>
            <button class="student-record-toggle" data-record-toggle="${submission.id}" type="button">
              <div class="student-record-main">
                <div class="student-record-title">${escapeHtml(submission.taskTitle || submission.task_title || '\u4efb\u52a1')}</div>
                <div class="student-record-meta">${escapeHtml(formatStudentRecordMeta(submission))}</div>
              </div>
              <div class="student-record-side">
                ${photoState === 'available' ? `
                  <span class="student-record-chip">
                    ${icon('image', 12)}
                    \u67e5\u770b\u7167\u7247 (${photoKeys.length})
                  </span>
                ` : ''}
                <span class="student-record-pill ${submission.status}">${escapeHtml(statusLabel)}</span>
                <span class="student-record-arrow">${icon('chevronRight', 14)}</span>
              </div>
            </button>

            <div class="student-record-detail" ${isExpanded ? '' : 'hidden'}>
              <div class="student-record-copy">
                <div class="student-record-row">
                  <strong>\u63d0\u4ea4\uff1a</strong>${escapeHtml(formatStudentRecordTime(submission.createdAt || submission.created_at))}
                </div>
                <div class="student-record-row">
                  <strong>\u5ba1\u6838\uff1a</strong>${escapeHtml(buildStudentReviewText(submission))}
                </div>
                ${submission.status === 'rejected' && reviewReason ? `
                  <div class="student-record-row student-record-reason">
                    <strong>\u539f\u56e0\uff1a</strong>${escapeHtml(reviewReason)}
                  </div>
                ` : ''}
              </div>

              ${photoKeys.length ? `
                <div class="student-record-note ${photoState === 'available' ? '' : 'expired'}">
                  ${photoState === 'available'
                    ? `\u5f53\u5929\u53ef\u67e5\u770b\u5ba1\u6838\u7167\u7247\uff0c\u5171 ${photoKeys.length} \u5f20`
                    : '\u5ba1\u6838\u7167\u7247\u4f1a\u5728\u6b21\u65e5\u81ea\u52a8\u6e05\u7406\uff0c\u4eca\u5929\u4e4b\u5916\u53ea\u80fd\u770b\u5230\u5ba1\u6838\u8bb0\u5f55'}
                </div>
              ` : ''}

              ${photoState === 'available' && photoKeys.length ? `
                <div class="student-record-photos" data-photo-keys='${JSON.stringify(photoKeys)}'>
                  ${photoKeys.map((key, index) => `
                    <button class="student-record-photo" data-photo-key="${key}" data-photo-idx="${index}" type="button">
                      <span class="student-photo-loading">${icon('image', 14)}</span>
                    </button>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function formatStudentRecordMeta(submission) {
  const submittedAt = formatStudentRecordTime(submission.createdAt || submission.created_at);
  const photoCount = getSubmissionPhotoKeys(submission).length;
  return photoCount ? `${submittedAt} · ${photoCount} 张照片` : submittedAt;
}

function buildStudentReviewText(submission) {
  const reviewedAt = formatStudentRecordTime(
    submission.reviewedAt || submission.reviewed_at || submission.createdAt || submission.created_at,
  );

  if (submission.status === 'approved') {
    return `家长已通过 · ${reviewedAt}`;
  }

  if (submission.status === 'rejected') {
    return `家长已驳回 · ${reviewedAt}`;
  }

  return `等待审核 · ${reviewedAt}`;
}

function parseStudentReviewReason(rawReason) {
  if (!rawReason) return '';

  const normalized = String(rawReason);

  if (normalized.startsWith('approved_by:')) {
    return '';
  }

  if (normalized.startsWith('rejected_by:')) {
    const [, reason = ''] = normalized.replace('rejected_by:', '').split('|');
    return reason;
  }

  return normalized;
}

function formatStudentRecordTime(timestamp) {
  const value = Number(timestamp) || Date.now();
  return new Date(value).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getPenaltyScheduleText(type) {
  switch (type) {
    case 'weekly':
      return '\u6bcf\u5468\u65e5 24:00 \u540e\u6263\u5206';
    case 'once':
      return '\u521b\u5efa\u5f53\u5929 24:00 \u540e\u6263\u5206';
    case 'semester':
      return '\u6bcf\u5b66\u671f\u7ed3\u675f\u540e\u6263\u5206';
    case 'daily':
    default:
      return '\u5f53\u5929 24:00 \u540e\u6263\u5206';
  }
}
