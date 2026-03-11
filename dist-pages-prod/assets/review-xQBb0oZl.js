import{a as q,s as x,i as g,b as K,e as Y}from"./index-8knsp9ot.js";import{t as y}from"./notification-DFOYBy0U.js";import{s as F,h as C}from"./animations-BN6acAuJ.js";import{s as T,g as z,p as J,r as V,e as X,c as W,a as Z}from"./submission-text-CDEFuwmo.js";import{e as v}from"./escape-lW1fV86Q.js";import{e as G,r as E}from"./segmented-control-BsrRqP-b.js";import{c as R,q as H,r as Q,a as O}from"./expandable-transition-Waz0H6DS.js";async function ge(a){a.innerHTML='<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>',await q.refreshUser();const i=q.requireUser(),[p,d,h]=await Promise.all([x.getFamilyUsers(),x.getSubmissions(),x.getRedemptions()]),e={children:p.filter(t=>t.role==="child"),submissions:[...d].sort((t,r)=>(r.createdAt||0)-(t.createdAt||0)),redemptions:[...h].sort((t,r)=>(r.createdAt||0)-(t.createdAt||0)),activeTab:"tasks",activeChildId:"all",taskView:"pending",expandedRecordId:null,photoCache:new Map,viewerPhotos:[],viewerIndex:0,viewerKeyHandler:null};let $=!1;f();function f(){const t=e.activeChildId==="all"?null:e.children.find(s=>s.id===e.activeChildId)||null,r=e.activeChildId==="all"?e.submissions:e.submissions.filter(s=>s.childId===e.activeChildId),o=e.activeChildId==="all"?e.redemptions:e.redemptions.filter(s=>s.childId===e.activeChildId),n=r.filter(s=>s.status==="pending"),l=r.slice(0,50),c=o.filter(s=>s.status==="pending");a.innerHTML=`
      <div class="page review-page">
        <div class="page-header review-head">
          <div>
            <h1 class="page-title">审核中心</h1>
            <p class="page-subtitle">${v(ae(e,t,n,l,c))}</p>
          </div>
        </div>

        ${e.children.length>1?`
          <div class="child-filter" data-stagger data-segmented="parent-review-child" data-segmented-scroll="true">
            <button class="child-chip ${e.activeChildId==="all"?"active":""}" data-child="all" type="button">全部孩子</button>
            ${e.children.map(s=>`
              <button class="child-chip ${e.activeChildId===s.id?"active":""}" data-child="${s.id}" type="button">
                <span class="child-chip-avatar">${v(s.avatar||"🙂")}</span>
                ${v(s.username)}
              </button>
            `).join("")}
          </div>
        `:""}

        <div class="tabs review-tabs" data-stagger data-segmented="parent-review-main">
          <button class="tab ${e.activeTab==="tasks"?"active":""}" data-tab="tasks" type="button">
            任务审核
            ${n.length?`<span class="tab-count">${n.length}</span>`:""}
          </button>
          <button class="tab ${e.activeTab==="redemptions"?"active":""}" data-tab="redemptions" type="button">
            商品兑换
            ${c.length?`<span class="tab-count">${c.length}</span>`:""}
          </button>
        </div>

        ${e.activeTab==="tasks"?`
          <div class="review-switch" data-stagger data-segmented="parent-review-task-view">
            <button class="review-switch-btn ${e.taskView==="pending"?"active":""}" data-task-view="pending" type="button">
              待审核 <span>${n.length}</span>
            </button>
            <button class="review-switch-btn ${e.taskView==="records"?"active":""}" data-task-view="records" type="button">
              完成记录
              <span>${l.length}</span>
            </button>
          </div>
        `:""}

        <div id="review-content">
          ${e.activeTab==="tasks"?e.taskView==="pending"?ee(n):te(l,t,e.expandedRecordId):re(c,e.children)}
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
          <button class="photo-viewer-arrow photo-viewer-prev" id="viewer-prev" type="button">${g("chevronLeft",28)}</button>
          <div class="photo-viewer-dots" id="photo-dots"></div>
          <button class="photo-viewer-arrow photo-viewer-next" id="viewer-next" type="button">${g("chevronRight",28)}</button>
        </div>
      </div>

      <style>
        .review-page { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }
        .review-head { padding-bottom: var(--space-3); }
        .review-tabs { margin-bottom: var(--space-3); }
        .review-tabs .tab {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .review-tabs .tab.active {
          color: var(--color-text-primary);
        }
        .review-tabs .tab.active .tab-count {
          background: color-mix(in srgb, var(--color-primary) 16%, transparent);
          color: var(--color-primary);
        }
        .review-switch {
          display: inline-flex;
          gap: 4px;
          padding: 4px;
          border-radius: 999px;
          background: var(--color-divider);
          margin-bottom: var(--space-3);
        }
        .review-switch-btn {
          border: none;
          background: transparent;
          color: var(--color-text-secondary);
          padding: 8px 12px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: var(--weight-semibold);
          transition: all var(--duration-base) var(--ease-out);
        }
        .review-switch-btn span {
          min-width: 18px;
          height: 18px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          background: var(--color-divider);
        }
        .review-switch-btn.active {
          background: var(--color-surface);
          color: var(--color-text-primary);
          box-shadow: var(--shadow-sm);
        }
        .review-switch.segmented-enhanced .review-switch-btn.active {
          background: transparent;
          box-shadow: none;
        }
        .review-switch-btn.active span {
          background: var(--color-primary-soft);
          color: var(--color-primary);
        }
        .child-filter {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: var(--space-3);
          margin-bottom: 2px;
          scrollbar-width: none;
          --segmented-indicator-bg: var(--color-primary);
          --segmented-indicator-shadow: var(--shadow-md);
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
        .child-filter.segmented-enhanced .child-chip.active {
          background: transparent;
          color: #fff;
          box-shadow: none;
        }
        .child-chip-avatar { font-size: 14px; line-height: 1; }
        .review-card,
        .record-card,
        .redemption-card {
          background: var(--color-surface);
          border: 1px solid color-mix(in srgb, var(--color-text-primary) 7%, transparent);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          transform: translateZ(0);
          will-change: transform, box-shadow;
          transition:
            border-color .34s cubic-bezier(.16, 1, .3, 1),
            box-shadow .34s cubic-bezier(.16, 1, .3, 1),
            transform .34s cubic-bezier(.16, 1, .3, 1);
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
          margin-bottom: 12px;
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
          margin-bottom: 0;
        }
        .review-card .submission-text-card {
          margin-top: 0;
        }
        .review-photos-grid {
          display: grid;
          gap: 8px;
          margin-top: 12px;
          margin-bottom: 0;
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
          margin-top: 16px;
        }
        .review-actions .btn {
          flex: 1;
          min-height: 46px;
        }
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
          border-radius: 22px;
          padding: 14px;
        }
        .record-card.expanded {
          border-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
          box-shadow: 0 22px 44px rgba(15, 23, 42, .1);
          transform: translateY(-2px);
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
        .record-card .submission-text-card {
          margin-top: 0;
        }
        .record-photo-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 30px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: var(--weight-semibold);
          border: none;
          background: color-mix(in srgb, var(--color-text-primary) 6%, transparent);
          color: var(--color-text-secondary);
          white-space: nowrap;
          transition:
            background .2s ease,
            color .2s ease,
            transform .34s cubic-bezier(.16, 1, .3, 1);
        }
        .record-photo-toggle:hover {
          background: color-mix(in srgb, var(--color-primary) 10%, transparent);
          color: var(--color-primary);
          transform: translateY(-1px);
        }
        .record-photo-toggle.expanded {
          background: color-mix(in srgb, var(--color-primary) 12%, transparent);
          color: var(--color-primary);
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
          margin-top: 0;
          opacity: 0;
          transform: translateY(-10px);
          pointer-events: none;
          transition:
            max-height .42s cubic-bezier(.16, 1, .3, 1),
            padding-top .42s cubic-bezier(.16, 1, .3, 1),
            padding-bottom .42s cubic-bezier(.16, 1, .3, 1),
            margin-top .42s cubic-bezier(.16, 1, .3, 1),
            opacity .24s ease,
            transform .42s cubic-bezier(.16, 1, .3, 1);
          will-change: max-height, opacity, transform, margin-top;
        }
        .record-card.expanded .record-photo-detail {
          margin-top: 12px;
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
        .record-status-pill.pending {
          background: var(--color-warning-soft);
          color: var(--color-warning);
        }
        .record-status-pill.approved {
          background: var(--color-success-soft);
          color: var(--color-success);
        }
        .record-status-pill.rejected {
          background: var(--color-danger-soft);
          color: var(--color-danger);
        }
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
        .review-modal .input-group {
          margin: var(--space-5) 0 0;
        }
        .review-modal .input {
          min-height: 104px;
        }
        .reject-modal-actions {
          display: flex;
          gap: var(--space-3);
          margin-top: var(--space-4);
        }
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
          .review-actions {
            margin-top: 16px;
          }
        }
      </style>
    `;const u=a.querySelector(".child-filter");u&&u.querySelectorAll(".child-chip").forEach(s=>{s.dataset.segmentedItem="true"}),G(a),b(),T(a),e.activeTab==="tasks"&&(e.taskView==="pending"?I(".review-photo-cell[data-photo-key]"):B()),$||(F(a,"[data-stagger]"),$=!0),K("parent","review"),Y()}function b(){a.querySelectorAll("[data-tab]").forEach(t=>t.addEventListener("click",()=>{e.activeTab!==t.dataset.tab&&E(()=>{e.activeTab=t.dataset.tab,f()})})),a.querySelectorAll("[data-child]").forEach(t=>t.addEventListener("click",()=>{e.activeChildId!==t.dataset.child&&E(()=>{e.activeChildId=t.dataset.child,f()})})),a.querySelectorAll("[data-task-view]").forEach(t=>t.addEventListener("click",()=>{e.taskView!==t.dataset.taskView&&E(()=>{e.taskView=t.dataset.taskView,f()})})),a.querySelectorAll("[data-record-toggle]").forEach(t=>t.addEventListener("click",()=>{N(t.dataset.recordToggle)})),a.querySelectorAll(".approve-btn").forEach(t=>t.addEventListener("click",async()=>{const r=t.dataset.id;t.disabled=!0;const o=e.submissions.find(l=>l.id===r),n=!!(o?.photoCount||z(o).length);try{await x.approveSubmission(r),S(r,{status:"approved",points:o?.taskPoints||0,reviewedAt:Date.now(),rejectReason:i?.username?`approved_by:${i.username}`:"",photoAccessStatus:n?"available_today":"none",reviewPhotoAvailable:n,photoClearedAt:null}),await q.refreshUser(),C("success"),y("已通过，积分已发放","success"),f()}catch(l){t.disabled=!1,y(l.message||"操作失败，请稍后重试","error")}})),a.querySelectorAll(".reject-btn").forEach(t=>t.addEventListener("click",()=>{j(t.dataset.id)})),a.querySelectorAll(".confirm-redeem-btn").forEach(t=>t.addEventListener("click",async()=>{const r=t.dataset.id;t.disabled=!0;try{await x.confirmRedemption(r),e.redemptions=e.redemptions.map(o=>o.id===r?{...o,status:"confirmed"}:o),C("success"),y("已确认兑换","success"),f()}catch(o){t.disabled=!1,y(o.message||"操作失败，请稍后重试","error")}}))}function S(t,r){e.submissions=e.submissions.map(o=>o.id===t?{...o,...r}:o).sort((o,n)=>(n.createdAt||0)-(o.createdAt||0))}function j(t){const r=a.querySelector("#reject-modal"),o=a.querySelector("#reject-body");r.style.display="flex",o.innerHTML=`
      <h2 class="modal-title">填写驳回原因</h2>
      <div class="input-group">
        <textarea class="input" id="reject-reason" rows="3" style="resize:none" placeholder="例如：照片不清晰，或者没有拍到完成结果"></textarea>
      </div>
      <div class="reject-modal-actions">
        <button class="btn btn-secondary btn-lg" style="flex:1" id="cancel-reject" type="button">取消</button>
        <button class="btn btn-danger btn-lg" style="flex:1" id="confirm-reject" type="button">确认驳回</button>
      </div>
    `;const n=()=>{r.style.display="none"};o.querySelector("#cancel-reject").addEventListener("click",n),r.onclick=l=>{l.target===r&&n()},o.querySelector("#confirm-reject").addEventListener("click",async()=>{const l=o.querySelector("#confirm-reject"),c=o.querySelector("#reject-reason").value.trim(),u=e.submissions.find(k=>k.id===t),s=!!(u?.photoCount||z(u).length);l.disabled=!0,l.textContent="处理中...";try{await x.rejectSubmission(t,c),S(t,{status:"rejected",reviewedAt:Date.now(),photoAccessStatus:s?"available_today":"none",rejectReason:i?.username?`rejected_by:${i.username}|${c||"未说明原因"}`:c||"未说明原因"}),C("medium"),y("已驳回","warning"),n(),f()}catch(k){l.disabled=!1,l.textContent="确认驳回",y(k.message||"操作失败，请稍后重试","error")}})}async function L(t){return t?(e.photoCache.has(t)||e.photoCache.set(t,X(t).catch(()=>null)),e.photoCache.get(t)):null}async function I(t,r){const o=typeof t=="string"||!t?a:t,n=typeof t=="string"?t:r||".review-photo-cell[data-photo-key], .record-photo-cell[data-photo-key]",l=Array.from(o.querySelectorAll(n));await Promise.all(l.map(async c=>{if(c.dataset.hydrated==="true")return;const u=c.dataset.photoKey,s=await L(u);s?(c.innerHTML=`<img src="${s}" alt="任务凭证照片" />`,c.dataset.loadedUrl=s):c.innerHTML='<span class="photo-loading">加载失败</span>',c.dataset.hydrated="true"})),l.forEach(c=>{c.dataset.bound!=="true"&&(c.addEventListener("click",()=>{const u=c.closest("[data-photo-keys]");if(u)try{const s=JSON.parse(u.dataset.photoKeys||"[]"),k=Number(c.dataset.photoIdx)||0;s.length&&_(s,k)}catch{}}),c.dataset.bound="true")})}function B(){Array.from(a.querySelectorAll(".record-card.expanded")).forEach(r=>{const o=r.querySelector(".record-photo-detail");o&&(o.hidden=!1,o.style.paddingTop="10px",o.style.paddingBottom="14px",o.style.opacity="1",o.style.transform="translateY(0)",o.style.pointerEvents="auto",o.style.maxHeight="none",A(r,!0),T(r),I(r,".record-photo-cell[data-photo-key]"))})}function N(t){const r=a.querySelector(`.record-card[data-record-id="${t}"]`);if(!r)return;const o=Array.from(a.querySelectorAll(".record-card.expanded")),n=r.classList.contains("expanded");if(o.forEach(l=>{l===r&&!n||U(l)}),n){e.expandedRecordId=null;return}e.expandedRecordId=t,D(r)}function D(t){const r=t.querySelector(".record-photo-detail");if(!r)return;R(r),r.hidden=!1,T(t);const o=window.getComputedStyle(r);r.style.maxHeight=`${r.offsetHeight}px`,r.style.paddingTop=o.paddingTop==="0px"?"0":o.paddingTop,r.style.paddingBottom=o.paddingBottom==="0px"?"0":o.paddingBottom,r.style.opacity=o.opacity,r.style.transform=o.transform!=="none"?o.transform:"translateY(-6px)",r.style.pointerEvents="none",t.classList.add("expanded"),A(t,!0),H(r,()=>{r.style.paddingTop="10px",r.style.paddingBottom="14px",r.style.maxHeight=`${r.scrollHeight}px`,r.style.opacity="1",r.style.transform="translateY(0)",r.style.pointerEvents="auto"}),Q(r,()=>t.classList.contains("expanded")),I(t,".record-photo-cell[data-photo-key]")}function U(t){const r=t.querySelector(".record-photo-detail");r&&(R(r),r.hidden=!1,r.style.maxHeight=`${r.offsetHeight||r.scrollHeight}px`,r.style.opacity=window.getComputedStyle(r).opacity,r.style.transform="translateY(0)",r.style.pointerEvents="auto",H(r,()=>{t.classList.remove("expanded"),A(t,!1),r.style.maxHeight="0",r.style.paddingTop="0",r.style.paddingBottom="0",r.style.opacity="0",r.style.transform="translateY(-6px)",r.style.pointerEvents="none"}),O(r,()=>!t.classList.contains("expanded")))}function A(t,r){const o=t.querySelector("[data-record-toggle]");if(!o)return;o.classList.toggle("expanded",r),o.setAttribute("aria-expanded",r?"true":"false");const n=o.querySelector("[data-record-toggle-label]");n&&(n.textContent=r?o.dataset.expandedLabel||"收起":o.dataset.collapsedLabel||"查看照片")}function _(t,r=0){e.viewerPhotos=t.map(u=>({key:u,url:null})),e.viewerIndex=r;const o=a.querySelector("#photo-viewer");o.style.display="flex",M(),m(),a.querySelector("#close-viewer").onclick=P,a.querySelector("#viewer-prev").onclick=()=>{e.viewerIndex>0&&(e.viewerIndex-=1,m())},a.querySelector("#viewer-next").onclick=()=>{e.viewerIndex<e.viewerPhotos.length-1&&(e.viewerIndex+=1,m())};const n=a.querySelector("#photo-viewer-body");n.onclick=u=>{u.target===n&&P()};const l=u=>{u.key==="Escape"&&P(),u.key==="ArrowLeft"&&e.viewerIndex>0&&(e.viewerIndex-=1,m()),u.key==="ArrowRight"&&e.viewerIndex<e.viewerPhotos.length-1&&(e.viewerIndex+=1,m())};document.addEventListener("keydown",l),e.viewerKeyHandler=l;let c=0;n.ontouchstart=u=>{c=u.changedTouches[0].screenX},n.ontouchend=u=>{const s=c-u.changedTouches[0].screenX;Math.abs(s)<50||(s>0&&e.viewerIndex<e.viewerPhotos.length-1?(e.viewerIndex+=1,m()):s<0&&e.viewerIndex>0&&(e.viewerIndex-=1,m()))}}function P(){const t=a.querySelector("#photo-viewer");t&&(t.style.display="none",e.viewerKeyHandler&&(document.removeEventListener("keydown",e.viewerKeyHandler),e.viewerKeyHandler=null),e.viewerPhotos=[],e.viewerIndex=0)}async function M(){for(let t=0;t<e.viewerPhotos.length;t+=1){const r=e.viewerPhotos[t],o=a.querySelector(`.review-photo-cell[data-photo-key="${r.key}"], .record-photo-cell[data-photo-key="${r.key}"]`);o?.dataset.loadedUrl?r.url=o.dataset.loadedUrl:r.url=await L(r.key),t===e.viewerIndex&&m()}}function m(){const t=a.querySelector("#photo-viewer-img"),r=a.querySelector("#photo-counter"),o=a.querySelector("#photo-dots"),n=a.querySelector("#viewer-prev"),l=a.querySelector("#viewer-next");if(!t)return;const c=e.viewerPhotos[e.viewerIndex];c?.url?(t.src=c.url,t.style.opacity="1"):(t.removeAttribute("src"),t.style.opacity="0.3"),r.textContent=`${e.viewerIndex+1} / ${e.viewerPhotos.length}`,n.disabled=e.viewerIndex<=0,l.disabled=e.viewerIndex>=e.viewerPhotos.length-1,n.style.visibility=e.viewerPhotos.length>1?"visible":"hidden",l.style.visibility=e.viewerPhotos.length>1?"visible":"hidden",o.innerHTML=e.viewerPhotos.map((u,s)=>`<span class="photo-viewer-dot ${s===e.viewerIndex?"active":""}"></span>`).join("")}}function ee(a){return a.length?a.map(i=>{const p=J(i.photoKey||i.photo_key),d=p.length,h=d<=1?"photos-1":d<=2?"photos-2":"photos-4";return`
      <div class="review-card" data-stagger data-photo-keys='${JSON.stringify(p)}'>
        <div class="review-card-header">
          <div class="review-child-meta">
            <span class="review-avatar">${v(i.childAvatar||"🙂")}</span>
            <div style="min-width:0">
              <div class="review-child-name">${v(i.childName||"学生")}</div>
              <div class="review-time">${v(w(i.createdAt||Date.now()))}</div>
            </div>
          </div>
          <span class="record-status-pill pending">待审核</span>
        </div>

        <div class="review-task-title">${v(i.taskTitle||"任务")}</div>
        <div class="review-task-points">+${i.taskPoints||0} 积分</div>
        ${V(i.submissionText||i.submission_text,{label:"学生说明",className:"pending-tone"})}

        ${d?`
          <div class="review-photos-grid ${h}">
            ${p.map((e,$)=>`
              <div class="review-photo-cell" data-photo-key="${e}" data-photo-idx="${$}" data-sub-id="${i.id}">
                <span class="photo-loading">${g("image",22)}</span>
              </div>
            `).join("")}
          </div>
        `:""}

        <div class="review-actions">
          <button class="btn btn-danger reject-btn" data-id="${i.id}" type="button">${g("x",16)} 驳回</button>
          <button class="btn btn-primary approve-btn" data-id="${i.id}" type="button">${g("check",16)} 通过</button>
        </div>
      </div>
    `}).join(""):`
      <div class="empty-state">
        ${g("checkCircle",48)}
        <h3>当前没有待审核任务</h3>
        <p>孩子提交任务后，会先出现在这里等待家长审核。</p>
      </div>
    `}function te(a,i,p){return a.length?`
    <div class="record-summary" data-stagger>
      <div class="record-summary-title">${i?`${v(i.username)} 的完成与审核记录`:"全部孩子的完成与审核记录"}</div>
      <div class="record-summary-copy">这里会同时显示提交时间、审核状态、审核时间和驳回原因，按孩子切换后就能只看一个孩子。</div>
    </div>

    <div class="record-list">
      ${a.map(d=>{const h=oe(d.rejectReason),e=z(d),f=W(d)?"available":Z(d),b=p===d.id;return`
          <div class="record-card ${b?"expanded":""}" data-stagger data-record-id="${d.id}">
            <div class="record-head">
              <div class="record-title-wrap">
                <div class="record-title">${v(d.taskTitle||"任务")}</div>
                <div class="record-subtitle">
                  ${v(d.childName||"学生")} · ${v(w(d.createdAt||Date.now()))}
                </div>
              </div>
              <div class="record-head-side">
                <span class="record-status-pill ${d.status}">${v(se(d.status,d.points||d.taskPoints||0))}</span>
                ${f==="available"?`
                  <button
                    class="record-photo-toggle ${b?"expanded":""}"
                    data-record-toggle="${d.id}"
                    data-collapsed-label="查看照片 (${e.length})"
                    data-expanded-label="收起"
                    aria-expanded="${b?"true":"false"}"
                    type="button"
                  >
                    <span class="record-photo-toggle-icon">${g("image",14)}</span>
                    <span data-record-toggle-label>${b?"收起":`查看照片 (${e.length})`}</span>
                    <span class="record-photo-toggle-arrow">${g("chevronRight",14)}</span>
                  </button>
                `:""}
              </div>
            </div>

            <div class="record-flow">
              <div class="record-row">
                <strong>提交</strong>
                <span>${v(w(d.createdAt||Date.now()))} 提交了这条任务记录</span>
              </div>
              <div class="record-row">
                <strong>审核</strong>
                <span>${v(ie(d,h))}</span>
              </div>
              ${h.reason?`
                <div class="record-row record-reason">
                  <strong>原因</strong>
                  <span>${v(h.reason)}</span>
                </div>
              `:""}
              ${V(d.submissionText||d.submission_text,{label:"文字提交"})}
            </div>

            ${f==="available"?`
              <div class="record-photo-detail" ${b?"":"hidden"}>
                <div class="record-photo-strip" data-photo-keys='${JSON.stringify(e)}'>
                  ${e.map((S,j)=>`
                    <div class="record-photo-cell" data-photo-key="${S}" data-photo-idx="${j}">
                      <span class="photo-loading">${g("image",18)}</span>
                    </div>
                  `).join("")}
                </div>
              </div>
            `:""}
          </div>
        `}).join("")}
    </div>
  `:`
      <div class="empty-state">
        ${g("clock",48)}
        <h3>还没有任务记录</h3>
        <p>${i?`${v(i.username)} 还没有提交记录。`:"孩子提交和审核后的记录会显示在这里。"}</p>
      </div>
    `}function re(a,i){return a.length?a.map(p=>{const d=i.find(e=>e.id===p.childId),h=p.childName||d?.username||"学生";return`
      <div class="redemption-card" data-stagger>
        <div class="redemption-emoji">${v(p.productEmoji||"🎁")}</div>
        <div class="redemption-info">
          <div class="redemption-name">${v(p.productName||"商品")}</div>
          <div class="redemption-detail">${v(h)} · ${p.price||0} 积分 · ${v(w(p.createdAt||Date.now()))}</div>
        </div>
        <button class="btn btn-primary btn-sm confirm-redeem-btn" data-id="${p.id}" type="button">确认</button>
      </div>
    `}).join(""):`
      <div class="empty-state">
        ${g("gift",48)}
        <h3>当前没有待确认兑换</h3>
        <p>孩子兑换商品后，会先出现在这里等待确认。</p>
      </div>
    `}function ae(a,i,p,d,h){const e=i?`${i.username}`:"全部孩子";return a.activeTab==="tasks"?a.taskView==="records"?`${e} · ${d.length} 条任务完成与审核记录`:`${e} · ${p.length} 个任务待审核`:`${e} · ${h.length} 个商品兑换待确认`}function oe(a){if(!a)return{reviewer:"",reason:""};if(a.startsWith("approved_by:"))return{reviewer:a.replace("approved_by:",""),reason:""};if(a.startsWith("rejected_by:")){const[i,p]=a.replace("rejected_by:","").split("|");return{reviewer:i||"",reason:p||""}}return{reviewer:"",reason:a}}function ie(a,i){return a.status==="pending"?"还在等待家长审核":a.status==="approved"?`${i.reviewer?`${i.reviewer} 已通过`:"已通过"} · ${w(a.reviewedAt||a.createdAt||Date.now())}`:a.status==="rejected"?`${i.reviewer?`${i.reviewer} 已驳回`:"已驳回"} · ${w(a.reviewedAt||a.createdAt||Date.now())}`:`${ne(a.status)} · ${w(a.reviewedAt||a.createdAt||Date.now())}`}function se(a,i){return a==="approved"?`通过 +${i}`:a==="rejected"?"已驳回":"待审核"}function ne(a){return{pending:"待审核",approved:"已通过",rejected:"已驳回"}[a]||"已记录"}function w(a){const i=Number(a)||Date.now(),p=Date.now()-i;return p<6e4?"刚刚":p<36e5?`${Math.floor(p/6e4)} 分钟前`:p<864e5?`${Math.floor(p/36e5)} 小时前`:new Date(i).toLocaleDateString("zh-CN")}export{ge as renderParentReview};
