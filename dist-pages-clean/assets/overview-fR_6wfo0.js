import{a as o,s as c,i as l,b as f}from"./index-CJupM59u.js";import{a as r,s as u}from"./animations-BN6acAuJ.js";import{t as g}from"./notification-DFOYBy0U.js";import{e as n}from"./escape-lW1fV86Q.js";async function w(e){e.innerHTML='<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>',await o.refreshUser();const a=o.requireUser(),i=o.getFamilyCode(),[s,d,v]=await Promise.all([c.getStats(),c.getFamilyUsers(),c.getActivityLog(10)]),p=d.filter(t=>t.role==="child"),m=d.filter(t=>t.role==="parent"&&t.id!==a.id);e.innerHTML=`
    <div class="page parent-overview">
      <div class="page-header">
        <div class="greeting">
          <span class="greeting-emoji">${a.avatar}</span>
          <div>
            <h1 class="page-title">你好，${n(a.username)}</h1>
            <p class="page-subtitle">家庭学习管理中心</p>
          </div>
        </div>
      </div>

      <!-- 家庭码 -->
      <div class="family-code-card animate-fade-in-up">
        <div class="fc-left">
          <span class="fc-label">家庭码</span>
          <span class="fc-code" id="family-code">${i}</span>
        </div>
        <button class="btn btn-icon" id="copy-code" title="复制">${l("copy",18)}</button>
      </div>

      <!-- 统计卡片 -->
      <div class="grid-2 animate-fade-in-up stagger-2" style="margin-bottom:var(--space-6)">
        <div class="stat-card">
          <div class="stat-value" id="stat-tasks">${s?.totalTasks||0}</div>
          <div class="stat-label">发布任务</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-pending" style="color:var(--color-warning)">${s?.pendingReview||0}</div>
          <div class="stat-label">待审核</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-rate" style="color:var(--color-success)">${s?.completionRate||0}%</div>
          <div class="stat-label">完成率</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-redemptions" style="color:var(--color-primary)">${s?.pendingRedemptions||0}</div>
          <div class="stat-label">待兑现</div>
        </div>
      </div>

      <!-- 其他家长列表 -->
      ${m.length>0?`
        <section class="overview-section animate-fade-in-up stagger-3">
          <h2 class="section-title" style="margin-bottom:var(--space-3)">其他家长</h2>
          <div class="list-group">
            ${m.map(t=>`
              <div class="list-item">
                <div class="avatar">${t.avatar}</div>
                <div class="list-item-content">
                  <div class="list-item-title">${n(t.username)}</div>
                  <div class="list-item-subtitle">家长</div>
                </div>
              </div>
            `).join("")}
          </div>
        </section>
      `:""}

      <!-- 孩子列表 -->
      ${p.length>0?`
        <section class="overview-section animate-fade-in-up stagger-4">
          <h2 class="section-title" style="margin-bottom:var(--space-3)">我的孩子</h2>
          <div class="list-group">
            ${p.map(t=>`
              <div class="list-item">
                <div class="avatar">${t.avatar}</div>
                <div class="list-item-content">
                  <div class="list-item-title">${n(t.username)}</div>
                  <div class="list-item-subtitle">积分: ${t.points||0}</div>
                </div>
                <span class="points-display" style="font-size:var(--text-md)">${t.points||0}</span>
              </div>
            `).join("")}
          </div>
        </section>
      `:`
        <section class="overview-section animate-fade-in-up stagger-4">
          <div class="empty-invite-card">
            ${l("users",32)}
            <p>还没有孩子加入</p>
            <p class="text-secondary">分享家庭码 <strong>${i}</strong> 给孩子注册</p>
          </div>
        </section>
      `}

      <!-- 近期动态 -->
      <section class="overview-section animate-fade-in-up stagger-4">
        <h2 class="section-title" style="margin-bottom:var(--space-3)">近期动态</h2>
        ${v.length>0?`
          <div class="timeline">
            ${v.map(t=>`
              <div class="timeline-item" data-stagger>
                <div class="timeline-dot ${t.type==="task_approved"?"dot-success":t.type==="task_rejected"?"dot-danger":"dot-primary"}"></div>
                <div class="timeline-content">
                  <p class="timeline-message">${t.message}</p>
                  <span class="timeline-time">${y(t.timestamp)}</span>
                </div>
              </div>
            `).join("")}
          </div>
        `:`
          <div class="empty-state" style="padding:var(--space-8)">
            ${l("clock",32)}
            <h3>暂无动态</h3>
          </div>
        `}
      </section>
    </div>

    <style>
      .parent-overview { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }

      .greeting {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      .greeting-emoji { font-size: 2.5rem; }

      .family-code-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        padding: var(--space-3) var(--space-4);
        margin-bottom: var(--space-4);
        box-shadow: var(--shadow-sm);
      }

      .fc-left { display: flex; align-items: center; gap: var(--space-3); }
      .fc-label { font-size: var(--text-sm); color: var(--color-text-secondary); }
      .fc-code {
        font-family: var(--font-mono);
        font-size: var(--text-lg);
        font-weight: var(--weight-bold);
        letter-spacing: 0.15em;
        color: var(--color-primary);
      }

      .overview-section { margin-bottom: var(--space-6); }

      .empty-invite-card {
        text-align: center;
        padding: var(--space-8);
        background: var(--color-surface);
        border-radius: var(--radius-xl);
        color: var(--color-text-secondary);
      }

      .empty-invite-card svg { margin: 0 auto var(--space-3); opacity: 0.4; }
      .empty-invite-card p { font-size: var(--text-sm); margin-bottom: var(--space-1); }
      .text-secondary { color: var(--color-text-tertiary); }

      /* 时间线 */
      .timeline { position: relative; padding-left: var(--space-6); }

      .timeline::before {
        content: '';
        position: absolute;
        left: 7px;
        top: 4px;
        bottom: 4px;
        width: 2px;
        background: var(--color-border);
      }

      .timeline-item {
        position: relative;
        padding-bottom: var(--space-4);
      }

      .timeline-dot {
        position: absolute;
        left: calc(-1 * var(--space-6) + 2px);
        top: 4px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid var(--color-surface);
      }

      .dot-success { background: var(--color-success); }
      .dot-danger { background: var(--color-danger); }
      .dot-primary { background: var(--color-primary); }

      .timeline-message { font-size: var(--text-sm); line-height: 1.5; }
      .timeline-time { font-size: var(--text-xs); color: var(--color-text-tertiary); }
    </style>
  `,setTimeout(()=>{r(e.querySelector("#stat-tasks"),0,s.totalTasks,600),r(e.querySelector("#stat-pending"),0,s.pendingReview,600);const t=e.querySelector("#stat-rate");r(t,0,s.completionRate,600),setTimeout(()=>{t&&(t.textContent+="%")},650),r(e.querySelector("#stat-redemptions"),0,s.pendingRedemptions,600)},300),u(e,"[data-stagger]"),e.querySelector("#copy-code").onclick=()=>{navigator.clipboard?.writeText(i).then(()=>{g("家庭码已复制","success")}).catch(()=>{g(`家庭码: ${i}`,"info")})},f("parent","home")}function y(e){const a=Date.now()-e;return a<6e4?"刚刚":a<36e5?`${Math.floor(a/6e4)}分钟前`:a<864e5?`${Math.floor(a/36e5)}小时前`:`${Math.floor(a/864e5)}天前`}export{w as renderParentOverview};
