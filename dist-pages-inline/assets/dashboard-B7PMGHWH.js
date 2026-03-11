import{a as u,s as n,i as o,r as l,b as k}from"./index-8knsp9ot.js";import{a as $,s as S}from"./animations-BN6acAuJ.js";import{e as s}from"./escape-lW1fV86Q.js";async function E(a){a.innerHTML='<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>',await u.refreshUser();const e=u.requireUser(),[r,i,d,p]=await Promise.all([n.getTasks(),n.getSubmissions(null,e.id),n.getProducts(),n.getFamilyUsers()]),c=r.map(t=>j(t)).sort((t,y)=>g(t)-g(y)),m=p.filter(t=>t.role==="parent"),v=p.filter(t=>t.role==="child"&&t.id!==e.id),b=e.points||0,f=i.filter(t=>t.status==="pending").length,h=i.filter(t=>t.status==="approved"&&new Date(t.created_at||t.createdAt).toDateString()===new Date().toDateString()).length,w=c.filter(t=>t.canSubmitNow).length,x=d.slice(0,3);a.innerHTML=`
    <div class="page student-dashboard">
      <div class="page-header">
        <div class="greeting">
          <span class="greeting-emoji">${s(e.avatar||"🙂")}</span>
          <div>
            <h1 class="page-title">你好，${s(e.username)}</h1>
            <p class="page-subtitle">今天也要加油，先把能完成的任务拿下。</p>
          </div>
        </div>
      </div>

      <div class="points-card animate-fade-in-up">
        <div class="points-card-bg"></div>
        <div class="points-card-content">
          <p class="points-label">我的积分</p>
          <h2 class="points-value" id="points-display">0</h2>
          <div class="points-stats">
            <div class="points-stat">
              <span class="points-stat-value">${f}</span>
              <span class="points-stat-label">审核中</span>
            </div>
            <div class="points-stat-divider"></div>
            <div class="points-stat">
              <span class="points-stat-value">${h}</span>
              <span class="points-stat-label">今日完成</span>
            </div>
            <div class="points-stat-divider"></div>
            <div class="points-stat">
              <span class="points-stat-value">${w}</span>
              <span class="points-stat-label">当前可提交</span>
            </div>
          </div>
        </div>
      </div>

      <section class="dashboard-section animate-fade-in-up stagger-2">
        <div class="section-header">
          <h2 class="section-title">当前任务</h2>
          <button class="btn btn-ghost btn-sm" id="view-all-tasks">
            查看全部 ${o("chevronRight",16)}
          </button>
        </div>
        <div class="task-list" id="task-list">
          ${c.slice(0,3).map(t=>`
            <div class="task-card ${t.cardClass}" data-stagger>
              <div class="task-card-left">
                <div class="task-type-badge badge badge-${t.type==="daily"?"primary":t.type==="weekly"?"warning":t.type==="semester"?"danger":"success"}">
                  ${t.type==="daily"?"每日":t.type==="weekly"?"每周":t.type==="semester"?"学期":"单次"}
                </div>
                <h3 class="task-card-title ${t.isCompleted?"is-done":""}">${s(t.title)}</h3>
                ${t.description?`<p class="task-card-desc ${t.isCompleted?"is-done":""}">${s(t.description)}</p>`:""}
                <p class="task-card-status ${t.statusClass}">${s(t.statusText)}</p>
                <p class="task-card-points">+${t.points} 积分</p>
              </div>
              ${D(t)}
            </div>
          `).join("")}
          ${c.length===0?`
            <div class="empty-state" style="padding:var(--space-8)">
              ${o("tasks",40)}
              <h3>暂时没有任务</h3>
              <p>等家长发布任务后，这里会第一时间出现。</p>
            </div>
          `:""}
        </div>
      </section>

      ${m.length>0||v.length>0?`
        <section class="dashboard-section animate-fade-in-up stagger-3">
          <div class="section-header">
            <h2 class="section-title">家庭成员</h2>
          </div>
          <div class="family-members-scroll">
            ${m.map(t=>`
              <div class="family-member-card" data-stagger>
                <div class="family-member-avatar">${s(t.avatar||"👨")}</div>
                <div class="family-member-name">${s(t.username)}</div>
                <div class="family-member-role">家长</div>
              </div>
            `).join("")}
            ${v.map(t=>`
              <div class="family-member-card" data-stagger>
                <div class="family-member-avatar">${s(t.avatar||"🙂")}</div>
                <div class="family-member-name">${s(t.username)}</div>
                <div class="family-member-role">积分: ${t.points||0}</div>
              </div>
            `).join("")}
          </div>
        </section>
      `:""}

      <section class="dashboard-section animate-fade-in-up stagger-4">
        <div class="section-header">
          <h2 class="section-title">热门奖励</h2>
          <button class="btn btn-ghost btn-sm" id="view-shop">
            商城 ${o("chevronRight",16)}
          </button>
        </div>
        <div class="reward-scroll">
          ${x.map(t=>`
            <div class="reward-card" data-stagger>
              <div class="reward-emoji">${s(t.emoji||"🎁")}</div>
              <h4 class="reward-name">${s(t.name)}</h4>
              <span class="reward-price">${t.price} 积分</span>
            </div>
          `).join("")}
        </div>
      </section>
    </div>

    <style>
      .student-dashboard { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }
      .greeting {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .greeting-emoji { font-size: 2.5rem; }

      .points-card {
        position: relative;
        border-radius: var(--radius-2xl);
        padding: var(--space-6);
        overflow: hidden;
        margin-bottom: var(--space-6);
      }
      .points-card-bg {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, #4A7DFF 0%, #6B5CE7 50%, #A855F7 100%);
        background-size: 200% 200%;
        animation: gradientShift 6s ease infinite;
      }
      .points-card-content {
        position: relative;
        z-index: 1;
        color: white;
      }
      .points-label {
        font-size: var(--text-sm);
        opacity: 0.85;
        margin-bottom: var(--space-1);
      }
      .points-value {
        font-size: 3rem;
        font-weight: var(--weight-bold);
        font-family: var(--font-mono);
        letter-spacing: -0.03em;
        margin-bottom: var(--space-5);
        line-height: 1;
      }
      .points-stats {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-items: center;
        gap: var(--space-4);
        background: rgba(255,255,255,0.15);
        border-radius: var(--radius-lg);
        padding: var(--space-3) var(--space-4);
        backdrop-filter: blur(10px);
      }
      .points-stat {
        flex: 1;
        text-align: center;
      }
      .points-stat-value {
        display: block;
        font-size: var(--text-lg);
        font-weight: var(--weight-bold);
      }
      .points-stat-label {
        font-size: var(--text-xs);
        opacity: 0.85;
      }
      .points-stat-divider {
        width: 1px;
        height: 24px;
        background: rgba(255,255,255,0.25);
        justify-self: center;
      }

      .dashboard-section { margin-bottom: var(--space-6); }
      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-3);
      }
      .section-title {
        font-size: var(--text-lg);
        font-weight: var(--weight-semibold);
      }

      .task-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--space-4);
        margin-bottom: var(--space-2);
        box-shadow: var(--shadow-sm);
        transition: transform var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out);
      }
      .task-card:active { transform: scale(0.98); }
      .task-card-left {
        min-width: 0;
        flex: 1;
        display: grid;
        gap: 4px;
      }
      .task-card.is-completed {
        background: color-mix(in srgb, var(--color-success) 5%, var(--color-surface));
        border: 1px solid color-mix(in srgb, var(--color-success) 18%, transparent);
      }
      .task-card.is-pending {
        border: 1px solid color-mix(in srgb, var(--color-warning) 18%, transparent);
      }
      .task-card.is-rejected {
        border: 1px solid color-mix(in srgb, var(--color-danger) 18%, transparent);
      }
      .task-card-title {
        font-size: var(--text-base);
        font-weight: var(--weight-medium);
        margin-top: var(--space-1);
        line-height: 1.35;
      }
      .task-card-title.is-done {
        color: var(--color-text-tertiary);
        text-decoration: line-through;
        text-decoration-thickness: 2px;
      }
      .task-card-desc {
        font-size: 12px;
        color: var(--color-text-secondary);
        line-height: 1.45;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .task-card-desc.is-done {
        color: var(--color-text-tertiary);
        text-decoration: line-through;
      }
      .task-card-status {
        font-size: 11px;
        font-weight: var(--weight-semibold);
      }
      .task-card-status.status-completed { color: var(--color-success); }
      .task-card-status.status-pending { color: var(--color-warning); }
      .task-card-status.status-rejected { color: var(--color-danger); }
      .task-card-status.status-todo { color: var(--color-primary); }
      .task-card-status.status-muted { color: var(--color-text-tertiary); }
      .task-card-points {
        font-size: var(--text-sm);
        color: var(--color-primary);
        font-weight: var(--weight-semibold);
        margin-top: 2px;
      }
      .task-card-action {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 11px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: var(--weight-semibold);
        flex-shrink: 0;
      }
      .task-card-action.state-completed {
        background: var(--color-success-soft);
        color: var(--color-success);
      }
      .task-card-action.state-pending {
        background: var(--color-warning-soft);
        color: var(--color-warning);
      }
      .task-card-action.state-muted {
        background: color-mix(in srgb, var(--color-text-primary) 7%, transparent);
        color: var(--color-text-tertiary);
      }

      .reward-scroll,
      .family-members-scroll {
        display: flex;
        gap: var(--space-3);
        overflow-x: auto;
        padding-bottom: var(--space-2);
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .reward-scroll::-webkit-scrollbar,
      .family-members-scroll::-webkit-scrollbar { display: none; }

      .reward-card,
      .family-member-card {
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        flex-shrink: 0;
      }
      .reward-card {
        min-width: 120px;
        padding: var(--space-4);
        text-align: center;
      }
      .reward-emoji { font-size: 2rem; margin-bottom: var(--space-2); }
      .reward-name {
        font-size: var(--text-sm);
        font-weight: var(--weight-medium);
        margin-bottom: var(--space-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .reward-price {
        font-size: var(--text-xs);
        color: var(--color-primary);
        font-weight: var(--weight-semibold);
      }

      .family-member-card {
        min-width: 80px;
        padding: var(--space-3);
        text-align: center;
      }
      .family-member-avatar { font-size: 1.75rem; margin-bottom: var(--space-1); }
      .family-member-name {
        font-size: var(--text-sm);
        font-weight: var(--weight-medium);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .family-member-role {
        font-size: var(--text-xs);
        color: var(--color-text-tertiary);
        margin-top: 2px;
      }

      @media (max-width: 640px) {
        .points-stats {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-2);
          padding: var(--space-3);
        }
        .task-card {
          align-items: flex-start;
        }
      }
    </style>
  `,setTimeout(()=>{const t=a.querySelector("#points-display");t&&$(t,0,b)},300),S(a,"[data-stagger]"),a.querySelector("#view-all-tasks")?.addEventListener("click",()=>l.navigate("/student/tasks")),a.querySelector("#view-shop")?.addEventListener("click",()=>l.navigate("/student/shop")),a.querySelectorAll(".task-submit-btn").forEach(t=>{t.addEventListener("click",()=>l.navigate("/student/tasks"))}),k("child","home")}function j(a){const e=a.completion_summary||a.completionSummary||{},r=a.completion_status||a.completionStatus||e.status||"todo",i=a.currentSubmission||a.todaySubmission||e.currentSubmission||null,d=typeof e.canSubmitNow=="boolean"?e.canSubmitNow:!i||i.status==="rejected";return{...a,completionStatus:r,currentSubmission:i,canSubmitNow:d,isCompleted:r==="completed",cardClass:z(r),statusClass:C(r),statusText:T(r)}}function g(a){return a.canSubmitNow?0:a.completionStatus==="pending"?1:a.completionStatus==="completed"?2:3}function z(a){return{completed:"is-completed",pending:"is-pending",rejected:"is-rejected"}[a]||""}function C(a){return{completed:"status-completed",pending:"status-pending",rejected:"status-rejected",partial:"status-todo",todo:"status-todo",overdue:"status-muted",upcoming:"status-muted"}[a]||"status-muted"}function T(a){return{completed:"本周期已完成，不能重复提交",pending:"已经提交，等待家长审核",rejected:"被驳回了，可以重新提交",partial:"还差一部分，继续完成",todo:"还没提交，完成后去打卡",overdue:"这个周期已经结束",upcoming:"还没到可提交时间"}[a]||"查看任务详情"}function D(a){if(a.isCompleted)return`<span class="task-card-action state-completed">${o("checkCircle",14)} 已完成</span>`;if(a.completionStatus==="pending")return`<span class="task-card-action state-pending">${o("clock",14)} 审核中</span>`;if(!a.canSubmitNow)return`<span class="task-card-action state-muted">${a.completionStatus==="upcoming"?"未开始":"暂不可交"}</span>`;const e=a.completionStatus==="rejected"?"去重提":a.completionStatus==="partial"?"继续完成":"去提交";return`<button class="btn btn-primary btn-sm task-submit-btn" data-task-id="${a.id}">${e}</button>`}export{E as renderStudentDashboard};
