import{a as V,s as K,i as b,b as ot,c as D}from"./index-8knsp9ot.js";import{s as M,g as W,c as rt,a as st,r as it,h as B,S as z,b as nt,d as dt,n as ct,e as lt}from"./submission-text-CDEFuwmo.js";import{t as j}from"./notification-DFOYBy0U.js";import{h as H,s as ut}from"./animations-BN6acAuJ.js";import{e as k}from"./escape-lW1fV86Q.js";import{e as pt,r as gt}from"./segmented-control-BsrRqP-b.js";import{c as L,q as A,r as F,a as bt}from"./expandable-transition-Waz0H6DS.js";async function ft(r){r.innerHTML='<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>',await V.refreshUser();const u=V.requireUser(),[n,y]=await Promise.all([K.getTasks(),K.getSubmissions(null,u.id)]);let g="all",w=null,$=null;const q=new Map;let f=[],l=0,T=null,U=!1,E=null,c=[],m="";function I(){const t=(g==="all"?n:n.filter(e=>e.type===g)).map(e=>{const s=e.currentSubmission||e.todaySubmission,i=y.filter(p=>p.task_id===e.id)[0];return{...e,todaySubmission:s,latestSub:i}}),o={all:n.length,daily:n.filter(e=>e.type==="daily").length,weekly:n.filter(e=>e.type==="weekly").length,once:n.filter(e=>e.type==="once").length,semester:n.filter(e=>e.type==="semester").length},d=[...y].filter(e=>e.status!=="pending").sort((e,s)=>(s.reviewedAt||s.createdAt||0)-(e.reviewedAt||e.createdAt||0)).slice(0,10);r.innerHTML=`
      <div class="page tasks-page">
        <div class="page-header">
          <h1 class="page-title">任务</h1>
          <p class="page-subtitle">${n.length} 个任务，查看今天和本周期的完成情况</p>
        </div>

        <div class="tabs" data-segmented="student-tasks-type">
          <button class="tab ${g==="all"?"active":""}" data-tab="all">全部<span class="tab-count">${o.all}</span></button>
          <button class="tab ${g==="daily"?"active":""}" data-tab="daily">每日<span class="tab-count">${o.daily}</span></button>
          <button class="tab ${g==="weekly"?"active":""}" data-tab="weekly">每周<span class="tab-count">${o.weekly}</span></button>
          <button class="tab ${g==="once"?"active":""}" data-tab="once">单次<span class="tab-count">${o.once}</span></button>
          <button class="tab ${g==="semester"?"active":""}" data-tab="semester">学期<span class="tab-count">${o.semester}</span></button>
        </div>

        <div class="task-list-compact" id="tasks-container">
          ${t.map(e=>{const s=e.currentSubmission||e.todaySubmission,v=!s||s.status==="rejected",i=w===e.id,p=s?s.status==="pending"?"已提交，等待审核":s.status==="approved"?"本周期已完成，不可重复提交":"已驳回，可重新提交":"本周期还未提交",x=s?s.status==="pending"?"status-pending":s.status==="approved"?"status-approved":s.status==="rejected"?"status-rejected":"":"",h=s?s.status==="pending"?"var(--color-warning)":s.status==="approved"?"var(--color-success)":"var(--color-danger)":"";return`
              <div class="task-compact ${x} ${i?"expanded":""}" data-task-id="${e.id}" data-stagger>
                <div class="task-compact-row" data-toggle="${e.id}">
                  <span class="task-type-dot badge-${e.type==="daily"?"primary":e.type==="weekly"?"warning":e.type==="semester"?"danger":"success"}">
                    ${e.type==="daily"?"日":e.type==="weekly"?"周":e.type==="semester"?"学":"次"}
                  </span>
                  ${s?`<span class="task-status-indicator" style="background:${h}"></span>`:""}
                  <span class="task-compact-title ${s?.status==="approved"?"done":""}">${e.title}</span>
                  <span class="task-compact-pts">+${e.points}</span>
                  <span class="task-compact-arrow">${b("chevronRight",14)}</span>
                </div>
                <div class="task-compact-detail">
                  ${e.description?`<p class="task-compact-desc">${e.description}</p>`:""}
                  ${e.penalty_enabled?`
                    <div class="task-penalty-note">
                      ${`未完成将扣 ${e.penalty_points} 分，${xt(e.type)}`}
                    </div>
                  `:""}
                  <div class="task-compact-status ${x||"status-idle"}">${p}</div>
                  ${s?`
                    ${s.status==="rejected"&&s.reject_reason?`<div class="task-reject-reason">${s.reject_reason}</div>`:""}
                  `:""}
                  <div class="task-compact-actions">
                    ${v?`
                      <button class="btn btn-primary btn-sm task-complete-btn" data-task-id="${e.id}">
                        ${b("camera",14)} 去提交
                      </button>
                    `:s.status==="pending"?`
                      <span class="badge badge-warning">审核中</span>
                    `:`
                      <span class="badge badge-success">${b("checkCircle",12)} 已完成</span>
                    `}
                  </div>
                </div>
              </div>
            `}).join("")}
          ${t.length===0?`
            <div class="empty-state">
              ${b("tasks",48)}
              <h3>${g==="all"?"暂无":"暂无此类"}任务</h3>
              <p>等待家长发布新任务</p>
            </div>
          `:""}
        </div>

        <section class="student-review-section">
          <div class="student-review-head">
            <h2 class="section-title">审核记录</h2>
            <span class="student-review-count">${d.length}</span>
          </div>
          ${vt(d,$)}
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
          <button class="photo-viewer-arrow photo-viewer-prev" id="viewer-prev" type="button">${b("chevronLeft",28)}</button>
          <div class="photo-viewer-dots" id="photo-dots"></div>
          <button class="photo-viewer-arrow photo-viewer-next" id="viewer-next" type="button">${b("chevronRight",28)}</button>
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

        .submit-text-group {
          margin-bottom: var(--space-4);
          padding: 14px;
          border-radius: 20px;
          border: 1px solid color-mix(in srgb, var(--color-text-primary) 8%, transparent);
          background: color-mix(in srgb, var(--color-surface) 97%, white);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
          transition:
            border-color .24s cubic-bezier(.16, 1, .3, 1),
            box-shadow .24s cubic-bezier(.16, 1, .3, 1),
            background-color .24s cubic-bezier(.16, 1, .3, 1);
        }

        .submit-text-group:focus-within {
          border-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
          background: color-mix(in srgb, var(--color-primary) 2%, var(--color-surface));
          box-shadow:
            0 0 0 3px color-mix(in srgb, var(--color-primary) 8%, transparent),
            0 12px 28px rgba(15, 23, 42, 0.06);
        }

        .submit-text-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-2);
          margin-bottom: 10px;
        }

        .submit-text-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          color: var(--color-primary);
          font-size: 11px;
          font-weight: var(--weight-semibold);
          letter-spacing: 0.02em;
        }

        .submit-text-counter {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--color-text-primary) 6%, transparent);
          color: var(--color-text-secondary);
          font-size: 11px;
          font-weight: var(--weight-semibold);
        }

        .submit-text-hint {
          margin: 0 0 10px;
          font-size: 12px;
          line-height: 1.5;
          color: var(--color-text-secondary);
        }

        .submit-textarea {
          min-height: 112px;
          resize: vertical;
          line-height: 1.6;
          padding: 0;
          border: none;
          background: transparent;
          box-shadow: none;
        }

        .submit-textarea:focus {
          border: none;
          box-shadow: none;
        }

        .submit-text-meta {
          margin-top: var(--space-3);
          padding-top: var(--space-3);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          border-top: 1px solid color-mix(in srgb, var(--color-text-primary) 8%, transparent);
        }

        .submit-text-meta-note {
          white-space: nowrap;
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
    `,pt(r),r.querySelectorAll(".tab").forEach(e=>{e.onclick=()=>{g!==e.dataset.tab&&gt(()=>{g=e.dataset.tab,I()})}}),r.querySelectorAll(".task-compact-row[data-toggle]").forEach(e=>{e.onclick=()=>{const s=e.dataset.toggle,v=e.closest(".task-compact"),i=v.querySelector(".task-compact-detail"),p=window.getComputedStyle(i);w===s?(w=null,L(i),v.classList.remove("expanded"),i.style.maxHeight=`${i.offsetHeight||i.scrollHeight}px`,i.style.paddingBottom=p.paddingBottom==="0px"?"0":p.paddingBottom,A(i,()=>{i.style.maxHeight="0",i.style.paddingBottom="0"})):(r.querySelectorAll(".task-compact.expanded").forEach(x=>{const h=x.querySelector(".task-compact-detail");L(h),h.style.maxHeight=`${h.offsetHeight||h.scrollHeight}px`,h.style.paddingBottom=window.getComputedStyle(h).paddingBottom,A(h,()=>{h.style.maxHeight="0",h.style.paddingBottom="0"}),x.classList.remove("expanded")}),w=s,L(i),v.classList.add("expanded"),i.style.maxHeight=`${i.offsetHeight}px`,i.style.paddingBottom=p.paddingBottom==="0px"?"0":p.paddingBottom,A(i,()=>{i.style.paddingBottom="var(--space-3)",i.style.maxHeight=`${i.scrollHeight}px`}),F(i,()=>v.classList.contains("expanded")))}}),r.querySelectorAll(".task-complete-btn").forEach(e=>{e.onclick=()=>{H("medium"),E=e.dataset.taskId,c=[],m="",et()}}),r.querySelectorAll("[data-record-toggle]").forEach(e=>{e.onclick=()=>{X(e.dataset.recordToggle)}}),M(r),J(),U||(ut(r,"[data-stagger]"),U=!0),ot("child","tasks")}async function N(a){return a?(q.has(a)||q.set(a,lt(a).catch(()=>null)),q.get(a)):null}async function Y(a=r){const t=Array.from(a.querySelectorAll(".student-record-photo[data-photo-key]"));await Promise.all(t.map(async o=>{if(o.dataset.hydrated==="true")return;const d=o.dataset.photoKey,e=await N(d);e?(o.innerHTML=`<img src="${e}" alt="审核照片" />`,o.dataset.loadedUrl=e):o.innerHTML='<span class="student-photo-loading">加载失败</span>',o.dataset.hydrated="true"})),t.forEach(o=>{o.dataset.bound!=="true"&&(o.onclick=()=>{const d=o.closest("[data-photo-keys]");if(d)try{const e=JSON.parse(d.dataset.photoKeys||"[]"),s=Number(o.dataset.photoIdx)||0;e.length&&Z(e,s)}catch{}},o.dataset.bound="true")})}function J(){Array.from(r.querySelectorAll(".student-record-card.expanded")).forEach(t=>{const o=t.querySelector(".student-record-detail");o&&(o.hidden=!1,o.style.paddingTop="6px",o.style.paddingBottom="16px",o.style.opacity="1",o.style.transform="translateY(0)",o.style.pointerEvents="auto",o.style.maxHeight="none",M(t),Y(t))})}function X(a){const t=r.querySelector(`.student-record-card[data-record-id="${a}"]`);if(!t)return;const o=Array.from(r.querySelectorAll(".student-record-card.expanded")),d=t.classList.contains("expanded");if(o.forEach(e=>{e===t&&!d||Q(e)}),d){$=null;return}$=a,G(t)}function G(a){const t=a.querySelector(".student-record-detail");if(!t)return;L(t),t.hidden=!1,M(a);const o=window.getComputedStyle(t);t.style.maxHeight=`${t.offsetHeight}px`,t.style.paddingTop=o.paddingTop==="0px"?"0":o.paddingTop,t.style.paddingBottom=o.paddingBottom==="0px"?"0":o.paddingBottom,t.style.opacity=o.opacity,t.style.transform=o.transform!=="none"?o.transform:"translateY(-6px)",t.style.pointerEvents="none",a.classList.add("expanded"),A(t,()=>{t.style.paddingTop="6px",t.style.paddingBottom="16px";const d=t.scrollHeight;t.style.maxHeight=`${d}px`,t.style.opacity="1",t.style.transform="translateY(0)",t.style.pointerEvents="auto"}),F(t,()=>a.classList.contains("expanded")),Y(a)}function Q(a){const t=a.querySelector(".student-record-detail");t&&(L(t),t.hidden=!1,t.style.maxHeight=`${t.offsetHeight||t.scrollHeight}px`,t.style.opacity=window.getComputedStyle(t).opacity,t.style.transform="translateY(0)",t.style.pointerEvents="auto",A(t,()=>{a.classList.remove("expanded"),t.style.maxHeight="0",t.style.paddingTop="0",t.style.paddingBottom="0",t.style.opacity="0",t.style.transform="translateY(-6px)",t.style.pointerEvents="none"}),bt(t,()=>!a.classList.contains("expanded")))}function Z(a,t=0){f=a.map(e=>({key:e,url:null})),l=t;const o=r.querySelector("#photo-viewer");o.style.display="flex",tt(),S(),r.querySelector("#close-viewer").onclick=C,r.querySelector("#viewer-prev").onclick=()=>{l>0&&(l-=1,S())},r.querySelector("#viewer-next").onclick=()=>{l<f.length-1&&(l+=1,S())};const d=r.querySelector("#photo-viewer-body");d.onclick=e=>{e.target===d&&C()},T=e=>{e.key==="Escape"&&C(),e.key==="ArrowLeft"&&l>0&&(l-=1,S()),e.key==="ArrowRight"&&l<f.length-1&&(l+=1,S())},document.addEventListener("keydown",T)}function C(){const a=r.querySelector("#photo-viewer");a&&(a.style.display="none",T&&(document.removeEventListener("keydown",T),T=null),f=[],l=0)}async function tt(){for(let a=0;a<f.length;a+=1){const t=f[a],o=r.querySelector(`.student-record-photo[data-photo-key="${t.key}"]`);o?.dataset.loadedUrl?t.url=o.dataset.loadedUrl:t.url=await N(t.key),a===l&&S()}}function S(){const a=r.querySelector("#photo-viewer-img"),t=r.querySelector("#photo-counter"),o=r.querySelector("#photo-dots"),d=r.querySelector("#viewer-prev"),e=r.querySelector("#viewer-next");if(!a)return;const s=f[l];s?.url?a.src=s.url:a.removeAttribute("src"),t.textContent=`${l+1} / ${f.length}`,d.style.visibility=f.length>1?"visible":"hidden",e.style.visibility=f.length>1?"visible":"hidden",d.disabled=l<=0,e.disabled=l>=f.length-1,o.innerHTML=f.map((v,i)=>`<span class="photo-viewer-dot ${i===l?"active":""}"></span>`).join("")}function et(){const a=r.querySelector("#submit-modal");a.style.display="flex",R(),a.onclick=t=>{t.target===a&&P()}}function P(){const a=r.querySelector("#submit-modal");a.classList.add("closing"),setTimeout(()=>{a.style.display="none",a.classList.remove("closing"),c.forEach(t=>URL.revokeObjectURL(t.previewUrl)),c=[],m="",E=null},300)}function R(){const a=r.querySelector("#submit-modal-body"),t=4-c.length,o=c.length>0||B(m);a.innerHTML=`
      <h2 class="submit-modal-title">提交任务</h2>

      <div class="photo-count-hint">
        已选 ${c.length}/4 张照片${t>0?`，还可添加 ${t} 张`:"（已达上限）"}
      </div>

      <div class="input-group submit-text-group">
        <div class="submit-text-head">
          <label class="submit-text-label" for="submit-text">文字提交</label>
          <span class="submit-text-counter" id="submit-text-count">${m.length}/${z}</span>
        </div>
        <p class="submit-text-hint">补充完成过程、学习收获，文字或照片至少提交一项。</p>
        <textarea
          class="input submit-textarea"
          id="submit-text"
          rows="4"
          maxlength="${z}"
          placeholder="可以补充完成过程、学习收获，也支持只提交文字"
        >${k(m)}</textarea>
        <div class="submit-text-meta">
          <span>支持只提交文字，也可搭配照片说明</span>
          <span class="submit-text-meta-note">最多 ${z} 字</span>
        </div>
      </div>

      <div class="photo-grid">
        ${c.map((i,p)=>`
          <div class="photo-grid-item">
            <img src="${i.previewUrl}" alt="照片 ${p+1}" />
            <button class="photo-remove-btn" data-idx="${p}" type="button">×</button>
          </div>
        `).join("")}
        ${t>0?`
          <button class="photo-add-slot" id="add-photo-slot" type="button">
            <span style="font-size:24px">+</span>
            <span>选择照片</span>
          </button>
        `:""}
      </div>

      ${t>0?`
        <div class="photo-source-btns">
          <button class="btn btn-secondary btn-sm" id="btn-camera">
            ${b("camera",16)} 拍照
          </button>
          <button class="btn btn-secondary btn-sm" id="btn-album">
            ${b("image",16)} 从相册选择
          </button>
        </div>
      `:""}

      <div class="submit-actions">
        <button class="btn btn-secondary btn-lg" id="btn-cancel-submit">取消</button>
        <button class="btn btn-primary btn-lg" id="btn-confirm-submit" ${o?"":"disabled"}>
          ${b("check",16)} ${B(m)?"提交内容":`提交 (${c.length}张)`}
        </button>
      </div>
    `,a.querySelectorAll(".photo-remove-btn").forEach(i=>{i.onclick=p=>{p.stopPropagation();const x=parseInt(i.dataset.idx);URL.revokeObjectURL(c[x].previewUrl),c.splice(x,1),H("light"),R()}});const d=a.querySelector("#add-photo-slot");d&&(d.onclick=()=>O());const e=a.querySelector("#btn-camera");e&&(e.onclick=async()=>{if(!(c.length>=4))try{const i=await nt();c.push(i),H("light"),R()}catch(i){i.message!=="取消拍照"&&j(i.message,"error")}});const s=a.querySelector("#btn-album");s&&(s.onclick=()=>O());const v=a.querySelector("#submit-text");v&&v.addEventListener("input",()=>{m=v.value.slice(0,z);const i=a.querySelector("#submit-text-count");i&&(i.textContent=`${m.length}/${z}`);const p=a.querySelector("#btn-confirm-submit");p&&(p.disabled=!(c.length>0||B(m)),p.innerHTML=`${b("check",16)} ${B(m)?"提交内容":`提交 (${c.length}张)`}`)}),a.querySelector("#btn-cancel-submit").onclick=()=>P(),a.querySelector("#btn-confirm-submit").onclick=()=>at()}async function O(){const a=4-c.length;if(!(a<=0))try{const t=await dt(a);for(const o of t)c.length<4?c.push(o):URL.revokeObjectURL(o.previewUrl);H("light"),R()}catch(t){t.message!=="取消选择"&&j(t.message,"error")}}async function at(){const a=ct(m);if(!E||!c.length&&!a)return;const t=r.querySelector("#btn-confirm-submit");t.disabled=!0,t.innerHTML=c.length>0?"上传中...":"提交中...";try{c.length>0&&j("正在上传照片...","info");let o=[];if(c.length>0){const e=c.map(v=>v.file),s=await D.uploadMultiplePhotos(e);if(s.error)throw new Error(s.error);o=Array.isArray(s.keys)?s.keys:[]}j("正在提交任务...","info");const d=await D.post("/submissions",{taskId:E,photoKeys:o,submissionText:a});if(d.error)throw new Error(d.error);j("提交成功！等待家长审核","success"),H("success"),P(),ft(r)}catch(o){t.disabled=!1,t.innerHTML=`${b("check",16)} ${a?"提交内容":`提交 (${c.length}张)`}`,j(o.message||"提交失败，请重试","error")}}I()}function vt(r,u){return r.length?`
    <div class="student-record-list">
      ${r.map(n=>{const y=W(n),g=rt(n)?"available":st(n),w=u===n.id,$=yt(n.rejectReason||n.reject_reason),q=n.status==="approved"?`已通过 +${n.points||n.taskPoints||0}`:"已驳回";return`
          <article class="student-record-card ${w?"expanded":""}" data-record-id="${n.id}" data-stagger>
            <button class="student-record-toggle" data-record-toggle="${n.id}" type="button">
              <div class="student-record-main">
                <div class="student-record-title">${k(n.taskTitle||n.task_title||"任务")}</div>
                <div class="student-record-meta">${k(mt(n))}</div>
              </div>
              <div class="student-record-side">
                ${g==="available"?`
                  <span class="student-record-chip">
                    ${b("image",12)}
                    查看照片 (${y.length})
                  </span>
                `:""}
                <span class="student-record-pill ${n.status}">${k(q)}</span>
                <span class="student-record-arrow">${b("chevronRight",14)}</span>
              </div>
            </button>

            <div class="student-record-detail" ${w?"":"hidden"}>
              <div class="student-record-copy">
                <div class="student-record-row">
                  <strong>提交：</strong>${k(_(n.createdAt||n.created_at))}
                </div>
                <div class="student-record-row">
                  <strong>审核：</strong>${k(ht(n))}
                </div>
                ${n.status==="rejected"&&$?`
                  <div class="student-record-row student-record-reason">
                    <strong>原因：</strong>${k($)}
                  </div>
                `:""}
                ${it(n.submissionText||n.submission_text,{label:"文字提交"})}
              </div>

              ${y.length?`
                <div class="student-record-note ${g==="available"?"":"expired"}">
                  ${g==="available"?`当天可查看审核照片，共 ${y.length} 张`:"审核照片会在次日自动清理，今天之外只能看到审核记录"}
                </div>
              `:""}

              ${g==="available"&&y.length?`
                <div class="student-record-photos" data-photo-keys='${JSON.stringify(y)}'>
                  ${y.map((f,l)=>`
                    <button class="student-record-photo" data-photo-key="${f}" data-photo-idx="${l}" type="button">
                      <span class="student-photo-loading">${b("image",14)}</span>
                    </button>
                  `).join("")}
                </div>
              `:""}
            </div>
          </article>
        `}).join("")}
    </div>
  `:`
      <div class="empty-state">
        ${b("clock",40)}
        <h3>今天还没有审核记录</h3>
        <p>任务审核后会显示在这里，当天可以展开查看审核照片。</p>
      </div>
    `}function mt(r){const u=_(r.createdAt||r.created_at),n=W(r).length;return n?`${u} · ${n} 张照片`:u}function ht(r){const u=_(r.reviewedAt||r.reviewed_at||r.createdAt||r.created_at);return r.status==="approved"?`家长已通过 · ${u}`:r.status==="rejected"?`家长已驳回 · ${u}`:`等待审核 · ${u}`}function yt(r){if(!r)return"";const u=String(r);if(u.startsWith("approved_by:"))return"";if(u.startsWith("rejected_by:")){const[,n=""]=u.replace("rejected_by:","").split("|");return n}return u}function _(r){const u=Number(r)||Date.now();return new Date(u).toLocaleString("zh-CN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:!1})}function xt(r){switch(r){case"weekly":return"每周日 24:00 后扣分";case"once":return"创建当天 24:00 后扣分";case"semester":return"每学期结束后扣分";default:return"当天 24:00 后扣分"}}export{ft as renderStudentTasks};
