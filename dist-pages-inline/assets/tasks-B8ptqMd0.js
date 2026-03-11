import{a as P,s as b,i as f,b as B}from"./index-8knsp9ot.js";import{t as m}from"./notification-DFOYBy0U.js";import{s as D,h as O}from"./animations-BN6acAuJ.js";import{e as n}from"./escape-lW1fV86Q.js";import{e as F,r as R}from"./segmented-control-BsrRqP-b.js";import{c as U,q as L,b as V}from"./expandable-transition-Waz0H6DS.js";const K=["all","daily","weekly","once","semester"];async function ct(t){t.innerHTML='<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>',await P.refreshUser();const a={tasks:[],children:[],activeType:"all",expandedTaskId:null};let c=!1;await o(),y();async function o(){const[i,r]=await Promise.all([b.getTasks(),b.getFamilyUsers()]);a.tasks=i||[],a.children=(r||[]).filter(e=>e.role==="child")}function w(){return a.activeType==="all"?a.tasks:a.tasks.filter(i=>i.type===a.activeType)}function y(){const i=w();a.expandedTaskId&&!i.some(e=>e.id===a.expandedTaskId)&&(a.expandedTaskId=null);const r=a.tasks.filter(e=>(e.completion_overview?.overdueChildren||0)>0).length;t.innerHTML=`
      <div class="page parent-tasks-page">
        <div class="page-header parent-tasks-head">
          <div>
            <h1 class="page-title">任务管理</h1>
            <p class="page-subtitle">默认收起，卡片只保留必要信息，点开再看完整状态</p>
          </div>
          <button class="btn btn-primary btn-sm" id="task-add-btn">${f("plus",16)} 新建任务</button>
        </div>

        <div class="task-summary-strip">
          <span class="summary-chip">${a.tasks.length} 个任务</span>
          <span class="summary-chip">${a.children.length} 个孩子</span>
          <span class="summary-chip ${r?"is-alert":""}">${r} 个逾期</span>
        </div>

        <div class="tabs task-tabs compact-task-tabs" data-segmented="parent-tasks-type">
          ${K.map(e=>`
            <button class="tab ${a.activeType===e?"active":""}" data-filter="${e}" type="button">
              ${j(e)}
              <span class="tab-count">${e==="all"?a.tasks.length:a.tasks.filter(s=>s.type===e).length}</span>
            </button>
          `).join("")}
        </div>

        <div class="task-manage-list">
          ${i.length?i.map(e=>X(e,e.id===a.expandedTaskId)).join(""):`
            <div class="empty-state">
              ${f("tasks",48)}
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
    `,F(t),u(i),Y(),B("parent","tasks"),c||(D(t,"[data-stagger]"),c=!0)}function u(i){t.querySelector("#task-add-btn")?.addEventListener("click",()=>C()),t.querySelectorAll("[data-filter]").forEach(r=>r.addEventListener("click",()=>{a.activeType!==r.dataset.filter&&R(()=>{a.activeType=r.dataset.filter,y()})})),t.querySelectorAll("[data-expand]").forEach(r=>r.addEventListener("click",()=>{x(r.dataset.expand)})),t.querySelectorAll("[data-edit]").forEach(r=>r.addEventListener("click",()=>{const e=i.find(s=>s.id===r.dataset.edit);e&&C(e)})),t.querySelectorAll("[data-delete]").forEach(r=>r.addEventListener("click",async()=>{const e=i.find(s=>s.id===r.dataset.delete);if(!(!e||!confirm(`确定删除“${e.title}”吗？`)))try{await b.deleteTask(e.id),m("任务已删除","info"),a.expandedTaskId=null,await o(),y()}catch(s){m(s.message||"删除失败，请稍后重试","error")}}))}function x(i){const r=a.expandedTaskId!==i;if(a.expandedTaskId&&a.expandedTaskId!==i){const s=t.querySelector(`.manage-task-card[data-task-id="${a.expandedTaskId}"]`);s&&T(s,!1)}const e=t.querySelector(`.manage-task-card[data-task-id="${i}"]`);e&&(T(e,r),a.expandedTaskId=r?i:null)}function T(i,r){i.classList.toggle("is-expanded",r),A(i,r);const e=i.querySelector(".task-toggle-label");e&&(e.textContent=r?"收起":"详情");const s=i.querySelector("[data-expand]");s&&s.setAttribute("aria-expanded",r?"true":"false")}function Y(){t.querySelectorAll(".manage-task-card").forEach(i=>{const r=i.querySelector(".task-detail-panel"),e=i.querySelector(".task-detail");!r||!e||(i.classList.contains("is-expanded")?(r.style.height="auto",r.style.opacity="1",r.style.transform="translateY(0)"):(r.style.height="0px",r.style.opacity="0",r.style.transform="translateY(-10px)"))})}function A(i,r){const e=i.querySelector(".task-detail-panel"),s=i.querySelector(".task-detail");if(!e||!s)return;if(U(e),window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.style.willChange="",e.style.height=r?"auto":"0px",e.style.opacity=r?"1":"0",e.style.transform=r?"translateY(0)":"translateY(-10px)";return}const g=window.getComputedStyle(e),p=e.style.height==="auto"?s.scrollHeight:e.offsetHeight;e.style.willChange="height, opacity, transform",e.style.height=`${p}px`,e.style.opacity=g.opacity,e.style.transform=g.transform!=="none"?g.transform:r?"translateY(-10px)":"translateY(0)",r?L(e,()=>{e.style.height=`${s.scrollHeight}px`,e.style.opacity="1",e.style.transform="translateY(0)"}):L(e,()=>{e.style.height="0px",e.style.opacity="0",e.style.transform="translateY(-10px)"}),V(e,()=>{e.style.willChange="",i.classList.contains("is-expanded")?(e.style.height="auto",e.style.opacity="1",e.style.transform="translateY(0)"):(e.style.height="0px",e.style.opacity="0",e.style.transform="translateY(-10px)")})}function C(i=null){const r=t.querySelector("#task-modal"),e=t.querySelector("#task-modal-body");let s=i?.type||"daily",g=i?.weekly_rule||"sunday",p=!!i?.penalty_enabled;const l={title:i?.title||"",description:i?.description||"",points:Number(i?.points)||"",targetChildId:i?.target_child_id||"",penaltyPoints:Number(i?.penalty_points)||""};r.style.display="flex",h(),r.onclick=d=>{d.target===r&&$()};async function H(d){d.preventDefault();const v=e.querySelector("#task-submit"),E=e.querySelector("#task-title").value.trim(),N=e.querySelector("#task-description").value.trim(),_=Number(e.querySelector("#task-points").value),q=Number(e.querySelector("#task-penalty-points").value||0),z={title:E,description:N,type:s,weekly_rule:g,points:_,target_child_id:e.querySelector("#task-target").value||null,penalty_enabled:p,penalty_points:p?q:0};if(!E)return m("请填写任务名称","warning");if(!Number.isInteger(_)||_<1)return m("奖励积分至少为 1 分","warning");if(p&&(!Number.isInteger(q)||q<1))return m("请填写有效的惩罚扣分","warning");v.disabled=!0,v.textContent=i?"保存中...":"创建中...";try{i?(await b.updateTask(i.id,z),m("任务已更新","success")):(await b.createTask(z),O("success"),m("任务已创建","success")),$(),await o(),y()}catch(M){v.disabled=!1,v.textContent=i?"保存修改":"创建任务",m(M.message||"保存失败，请稍后重试","error")}}function $(){r.style.display="none",r.onclick=null}function h(){l.title=e.querySelector("#task-title")?.value??l.title,l.description=e.querySelector("#task-description")?.value??l.description,l.points=e.querySelector("#task-points")?.value??l.points,l.targetChildId=e.querySelector("#task-target")?.value??l.targetChildId,l.penaltyPoints=e.querySelector("#task-penalty-points")?.value??l.penaltyPoints,e.innerHTML=`
        <div class="task-form-head">
          <h2 class="modal-title">${i?"编辑任务":"新建任务"}</h2>
          <p class="task-form-caption">关键信息都在这里，更多完成状态留在任务详情里查看。</p>
        </div>
        <form id="task-form" class="option-grid">
          <div class="option-grid two">
            <div class="input-group" style="margin:0">
              <label class="input-label">任务名称</label>
              <input class="input" id="task-title" maxlength="60" value="${n(l.title)}" placeholder="例如：完成数学作业" required />
            </div>
            <div class="input-group" style="margin:0">
              <label class="input-label">奖励积分</label>
              <input class="input" id="task-points" type="number" min="1" max="9999" value="${l.points}" placeholder="20" required />
            </div>
          </div>

          <div class="form-block soft">
            <div class="form-block-title">任务周期</div>
            <div class="option-grid two tight">
              ${k("daily",s,"每日","每天一次")}
              ${k("weekly",s,"每周","支持三种规则")}
              ${k("once",s,"单次","当天完成")}
              ${k("semester",s,"学期","长期目标")}
            </div>
          </div>

          <div class="form-block" id="weekly-wrap" style="${s==="weekly"?"":"display:none"}">
            <div class="form-block-title">每周规则</div>
            <div class="option-grid tight">
              ${S("sunday",g,"周日结束前完成","本周内完成一次即可")}
              ${S("saturday",g,"周六结束前完成","周六 24:00 后就算逾期")}
              ${S("weekend_twice",g,"周六和周日都要完成一次","系统会拆成两个周末时段统计")}
            </div>
          </div>

          <div class="option-grid two">
            <div class="input-group" style="margin:0">
              <label class="input-label">需要谁完成</label>
              <select class="input" id="task-target">
                <option value="">全部孩子一起完成</option>
                ${a.children.map(d=>`
                  <option value="${d.id}" ${l.targetChildId===d.id?"selected":""}>
                    ${n(d.avatar||"🙂")} ${n(d.username)}
                  </option>
                `).join("")}
              </select>
            </div>
            <div class="input-group" style="margin:0">
              <label class="input-label">补充说明</label>
              <input class="input" id="task-description" maxlength="200" value="${n(l.description)}" placeholder="可选，展开详情后再看" />
            </div>
          </div>

          <div class="toggle-card ${p?"is-on form-block danger":"form-block"}">
            <div class="toggle-row">
              <div class="toggle-copy">
                <strong>未完成惩罚 ${p?"已启用":"已关闭"}</strong>
                <span>${n(et(s,g))}</span>
              </div>
              <button type="button" class="toggle-btn ${p?"is-on":""}" id="penalty-toggle" aria-label="切换惩罚"></button>
            </div>
            <div class="input-group" id="penalty-fields" style="${p?"":"display:none"};margin:0">
              <label class="input-label">扣分值</label>
              <input class="input" id="task-penalty-points" type="number" min="1" max="9999" value="${l.penaltyPoints}" placeholder="例如 5" />
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-secondary" type="button" id="task-cancel">取消</button>
            <button class="btn btn-primary" type="submit" id="task-submit">${i?"保存修改":"创建任务"}</button>
          </div>
        </form>
      `,e.querySelectorAll("[data-type-option]").forEach(d=>d.addEventListener("click",()=>{s=d.dataset.typeOption,h()})),e.querySelectorAll("[data-rule-option]").forEach(d=>d.addEventListener("click",()=>{g=d.dataset.ruleOption,h()})),e.querySelector("#task-form").addEventListener("submit",H),e.querySelector("#task-cancel").addEventListener("click",$),e.querySelector("#penalty-toggle").addEventListener("click",()=>{p=!p,h()})}}}function X(t,a){const c=t.completion_overview||{},o=t.target_children_statuses||[],w=t.target_child_id?1:Math.max(o.length,0),y=tt(c,w);return`
    <article class="manage-task-card ${a?"is-expanded":""}" data-stagger data-task-id="${t.id}">
      <div class="manage-task-body">
        <div class="manage-task-strip">
          <div class="manage-task-main">
            <div class="manage-task-headline">
              <span class="badge badge-${Z(t.type)} task-type-badge">${j(t.type)}</span>
              <h3 class="manage-task-title">${n(t.title)}</h3>
            </div>
            <div class="manage-task-brief">${n(J(t,o))}</div>
            ${t.description?`<div class="manage-task-requirement">${n(t.description)}</div>`:""}
          </div>
          <div class="manage-task-side">
            <span class="task-points-pill">+${t.points}</span>
            <span class="task-status-mini ${y.tone}">${n(y.text)}</span>
            <button class="task-toggle-btn" type="button" data-expand="${t.id}" aria-expanded="${a?"true":"false"}">
              <span class="task-toggle-label">${a?"收起":"详情"}</span>
              <span class="task-toggle-icon">${f("chevronRight",14)}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="task-detail-shell">
        <div class="task-detail-panel">
          <div class="task-detail">
            <div class="detail-meta">
              <span class="detail-chip">${f("users",14)} ${n(W(t,o))}</span>
              <span class="detail-chip">${f("repeat",14)} ${n(G(t))}</span>
              <span class="detail-chip ${t.penalty_enabled?"is-danger":""}">
                ${t.penalty_enabled?`未完成扣 ${t.penalty_points} 分`:"未开启惩罚"}
              </span>
            </div>

            ${o.length?`
              <div class="child-status-list">
                ${o.map(u=>`
                  <div class="child-status-row">
                    <div class="child-status-name">
                      <span class="child-avatar">${n(u.child_avatar||"🙂")}</span>
                      <div class="child-name-wrap">
                        <div class="child-name">${n(u.child_name||"未命名")}</div>
                        <div class="child-caption">${n(rt(u.completion_summary))}</div>
                      </div>
                    </div>
                    <div class="child-slot-row">
                      ${(u.completion_summary?.slots||[]).map(x=>`
                        <span class="slot-pill ${x.status}">${n(at(x.label))} · ${n(I(x.status))}</span>
                      `).join("")}
                      <span class="status-pill ${u.completion_status}">${n(I(u.completion_status))}</span>
                    </div>
                  </div>
                `).join("")}
              </div>
            `:'<div class="child-empty">当前还没有孩子成员。</div>'}

            <div class="manage-task-actions">
              <button class="btn btn-ghost btn-sm" type="button" data-edit="${t.id}">${f("edit",14)} 编辑</button>
              <button class="btn btn-ghost btn-sm" type="button" data-delete="${t.id}" style="color:var(--color-danger)">${f("trash",14)} 删除</button>
            </div>
          </div>
        </div>
      </div>
    </article>
  `}function k(t,a,c,o){return`
    <button type="button" class="choice-btn ${a===t?"active":""}" data-type-option="${t}">
      <span class="choice-title">${c}</span>
      <span class="choice-help">${o}</span>
    </button>
  `}function S(t,a,c,o){return`
    <button type="button" class="choice-btn ${a===t?"active":""}" data-rule-option="${t}">
      <span class="choice-title">${c}</span>
      <span class="choice-help">${o}</span>
    </button>
  `}function j(t){return{all:"全部",daily:"每日",weekly:"每周",once:"单次",semester:"学期"}[t]||t}function Z(t){return{daily:"primary",weekly:"warning",once:"success",semester:"danger"}[t]||"primary"}function G(t){return t.type==="weekly"?t.weekly_rule==="saturday"?"每周任务 · 周六截止":t.weekly_rule==="weekend_twice"?"每周任务 · 周六和周日各一次":"每周任务 · 周日截止":t.type==="daily"?"每日任务 · 每天一次":t.type==="once"?"单次任务 · 当天截止":"学期任务 · 学期内完成"}function J(t,a){return`${t.target_child_id?a[0]?.child_name||"指定孩子":`${Math.max(a.length,0)} 人任务`} · ${Q(t)}`}function Q(t){return t.type==="weekly"?t.weekly_rule==="saturday"?"周六前完成":t.weekly_rule==="weekend_twice"?"周末两次":"周日前完成":t.type==="daily"?"每天一次":t.type==="once"?"当天完成":"学期内完成"}function W(t,a){return t.target_child_id?a[0]?.child_name||"指定孩子":a.length?`全部孩子 (${a.length}人)`:"全部孩子"}function tt(t={},a=0){return t.overdueChildren>0?{tone:"is-bad",text:`逾期 ${t.overdueChildren}`}:t.pendingChildren>0?{tone:"is-warn",text:`待审 ${t.pendingChildren}`}:t.partialChildren>0?{tone:"is-live",text:`进行中 ${t.partialChildren}`}:t.completedChildren>0&&a>0&&t.completedChildren>=a?{tone:"is-good",text:"全部完成"}:t.completedChildren>0?{tone:"is-live",text:`完成 ${t.completedChildren}/${Math.max(a,t.completedChildren)}`}:{tone:"is-muted",text:"未提交"}}function et(t,a){return t==="daily"?"每日任务在当天 24:00 后检查，未完成才会扣分。":t==="once"?"单次任务在创建当天 24:00 后检查，过期后自动扣分。":t==="semester"?"学期任务会在当前学期结束后统一检查并扣分。":a==="saturday"?"每周任务会在周六 24:00 后检查，未完成则自动扣分。":a==="weekend_twice"?"系统会在周六和周日结束后各检查一次，缺一次就扣一次分。":"每周任务会在周日 24:00 后检查，未完成才会扣分。"}function I(t){return{completed:"已完成",partial:"部分完成",pending:"待审核",overdue:"已逾期",rejected:"待重提",missed:"未完成",todo:"未提交",upcoming:"未开始"}[t]||"未提交"}function at(t){return{saturday_deadline:"周六前",saturday:"周六",sunday:"周日",daily:"今天",once:"单次",semester:"学期"}[t]||"本周期"}function rt(t={}){const a=Number(t.requiredCount)||0,c=Number(t.completedCount)||0,o=Number(t.pendingCount)||0;return a?o>0?`已完成 ${c}/${a}，还有内容待审核`:`已完成 ${c}/${a}`:"当前周期暂无要求"}export{ct as renderParentTasks};
