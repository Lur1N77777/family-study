import{a as y,s as k,d as m,i as c,b as K,t as Y,A as _,c as V}from"./index-8knsp9ot.js";import{t as P}from"./notification-DFOYBy0U.js";import{a as J}from"./animations-BN6acAuJ.js";import{s as q,g as O,c as F,a as W,r as G,e as Q}from"./submission-text-CDEFuwmo.js";import{e as w}from"./escape-lW1fV86Q.js";import{c as C,q as T,r as X,a as Z}from"./expandable-transition-Waz0H6DS.js";async function ve(r){r.innerHTML='<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>',await y.refreshUser();const s=y.requireUser(),o=document.documentElement.getAttribute("data-theme")==="dark",[d,g,p]=await Promise.all([k.getChildPoints(s.id),k.getChildSubmissions(s.id),k.getRedemptions()]),u=p.filter(t=>t.childId===s.id),x=g.filter(t=>t.status==="approved").reduce((t,e)=>t+(e.points||0),0),b=u.reduce((t,e)=>t+(e.price||0),0),$=g.filter(t=>t.status!=="pending").sort((t,e)=>(e.reviewedAt||e.createdAt||0)-(t.reviewedAt||t.createdAt||0)).slice(0,6),i={expandedSubmissionId:null,photoCache:new Map,viewerPhotos:[],viewerIndex:0,viewerKeyHandler:null};I();function I(){r.innerHTML=`
      <div class="page profile-page">
        <div class="page-header">
          <h1 class="page-title">个人中心</h1>
        </div>

        <div class="profile-card animate-fade-in-up">
          <div class="profile-avatar-lg" id="change-avatar-btn" style="cursor:pointer;position:relative">
            <span id="user-avatar-display">${m(s.avatar,"🙂")}</span>
            <div class="profile-avatar-edit">
              ${c("edit",10)}
            </div>
          </div>
          <h2 class="profile-name">${w(s.username)}</h2>
          <p class="profile-role">学生</p>
        </div>

        <div class="grid-3 animate-fade-in-up stagger-2" style="margin-bottom:var(--space-6)">
          <div class="stat-card">
            <div class="stat-value points-display" id="current-points">0</div>
            <div class="stat-label">当前积分</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--color-success)">${x}</div>
            <div class="stat-label">累计获得</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--color-warning)">${b}</div>
            <div class="stat-label">累计消费</div>
          </div>
        </div>

        ${ee($,i.expandedSubmissionId)}

        ${u.length>0?`
          <section class="profile-section animate-fade-in-up stagger-4">
            <h3 class="section-title" style="margin-bottom:var(--space-3)">最近兑换</h3>
            <div class="list-group">
              ${u.slice(0,5).map(t=>`
                <div class="list-item">
                  <span style="font-size:1.5rem">${m(t.productEmoji,"🎁")}</span>
                  <div class="list-item-content">
                    <div class="list-item-title">${w(t.productName||"商品")}</div>
                    <div class="list-item-subtitle">
                      ${t.status==="pending"?"等待家长确认":"已兑换"} ·
                      ${new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span class="badge ${t.status==="pending"?"badge-warning":"badge-success"}">
                    ${t.status==="pending"?"待确认":"已兑换"}
                  </span>
                </div>
              `).join("")}
            </div>
          </section>
        `:""}

        <section class="profile-section animate-fade-in-up stagger-5">
          <h3 class="section-title" style="margin-bottom:var(--space-3)">设置</h3>
          <div class="list-group">
            <div class="list-item" id="toggle-theme">
              <span style="color:var(--color-text-secondary)">${o?c("sun",20):c("moon",20)}</span>
              <div class="list-item-content">
                <div class="list-item-title">${o?"浅色模式":"深色模式"}</div>
              </div>
              ${c("chevronRight",18)}
            </div>
            <div class="list-item" id="logout-btn" style="color:var(--color-danger)">
              ${c("logout",20)}
              <div class="list-item-content">
                <div class="list-item-title" style="color:var(--color-danger)">退出登录</div>
              </div>
              ${c("chevronRight",18)}
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
          <button class="photo-viewer-arrow photo-viewer-prev" id="viewer-prev" type="button">${c("chevronLeft",28)}</button>
          <div class="photo-viewer-dots" id="photo-dots"></div>
          <button class="photo-viewer-arrow photo-viewer-next" id="viewer-next" type="button">${c("chevronRight",28)}</button>
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
    `,setTimeout(()=>{const t=r.querySelector("#current-points");t&&J(t,0,d)},400),L(),q(r),R(),K("child","profile")}function L(){r.querySelector("#toggle-theme").onclick=t=>{Y(t);const e=document.documentElement.getAttribute("data-theme")==="dark",a=r.querySelector("#toggle-theme span"),n=r.querySelector("#toggle-theme .list-item-title");a&&(a.innerHTML=e?c("sun",20):c("moon",20)),n&&(n.textContent=e?"浅色模式":"深色模式")},r.querySelector("#logout-btn").onclick=()=>{y.logout(),P("已退出登录","info")},r.querySelector("#change-avatar-btn").onclick=()=>te(r,s),r.querySelectorAll("[data-review-toggle]").forEach(t=>{t.addEventListener("click",()=>z(t.dataset.reviewToggle))})}async function A(t){return t?(i.photoCache.has(t)||i.photoCache.set(t,Q(t).catch(()=>null)),i.photoCache.get(t)):null}async function E(t=r){const e=Array.from(t.querySelectorAll(".student-review-photo-cell[data-photo-key]"));await Promise.all(e.map(async a=>{if(a.dataset.hydrated==="true")return;const n=a.dataset.photoKey,l=await A(n);l?(a.innerHTML=`<img src="${l}" alt="审核照片" />`,a.dataset.loadedUrl=l):a.innerHTML='<span class="photo-loading">照片已清理</span>',a.dataset.hydrated="true"})),e.forEach(a=>{a.dataset.bound!=="true"&&(a.addEventListener("click",()=>{const n=a.closest("[data-photo-keys]");if(!n)return;const l=JSON.parse(n.dataset.photoKeys||"[]"),v=Number(a.dataset.photoIdx)||0;l.length&&D(l,v)}),a.dataset.bound="true")})}function z(t){const e=r.querySelector(`.student-review-card[data-submission-id="${t}"]`);if(!e)return;const a=Array.from(r.querySelectorAll(".student-review-card.expanded")),n=e.classList.contains("expanded");if(a.forEach(l=>{l===e&&!n||B(l)}),n){i.expandedSubmissionId=null;return}i.expandedSubmissionId=t,M(e)}function R(){Array.from(r.querySelectorAll(".student-review-card.expanded")).forEach(e=>{const a=e.querySelector(".student-review-detail");a&&(a.hidden=!1,a.style.paddingTop="10px",a.style.paddingBottom="12px",a.style.opacity="1",a.style.transform="translateY(0)",a.style.pointerEvents="auto",a.style.maxHeight="none",q(e),E(e))})}function M(t){const e=t.querySelector(".student-review-detail");if(!e)return;C(e),e.hidden=!1,q(t);const a=window.getComputedStyle(e);e.style.maxHeight=`${e.offsetHeight}px`,e.style.paddingTop=a.paddingTop==="0px"?"0":a.paddingTop,e.style.paddingBottom=a.paddingBottom==="0px"?"0":a.paddingBottom,e.style.opacity=a.opacity,e.style.transform=a.transform!=="none"?a.transform:"translateY(-6px)",e.style.pointerEvents="none",t.classList.add("expanded"),T(e,()=>{e.style.paddingTop="10px",e.style.paddingBottom="12px";const n=e.scrollHeight;e.style.maxHeight=`${n}px`,e.style.opacity="1",e.style.transform="translateY(0)",e.style.pointerEvents="auto"}),X(e,()=>t.classList.contains("expanded")),E(t)}function B(t){const e=t.querySelector(".student-review-detail");e&&(C(e),e.hidden=!1,e.style.maxHeight=`${e.offsetHeight||e.scrollHeight}px`,e.style.opacity=window.getComputedStyle(e).opacity,e.style.transform="translateY(0)",e.style.pointerEvents="auto",T(e,()=>{t.classList.remove("expanded"),e.style.maxHeight="0",e.style.paddingTop="0",e.style.paddingBottom="0",e.style.opacity="0",e.style.transform="translateY(-6px)",e.style.pointerEvents="none"}),Z(e,()=>!t.classList.contains("expanded")))}function D(t,e=0){i.viewerPhotos=t.map(v=>({key:v,url:null})),i.viewerIndex=e;const a=r.querySelector("#photo-viewer");a.style.display="flex",N(),f(),r.querySelector("#close-viewer").onclick=S,r.querySelector("#viewer-prev").onclick=()=>{i.viewerIndex>0&&(i.viewerIndex-=1,f())},r.querySelector("#viewer-next").onclick=()=>{i.viewerIndex<i.viewerPhotos.length-1&&(i.viewerIndex+=1,f())};const n=r.querySelector("#photo-viewer-body");n.onclick=v=>{v.target===n&&S()};const l=v=>{v.key==="Escape"&&S(),v.key==="ArrowLeft"&&i.viewerIndex>0&&(i.viewerIndex-=1,f()),v.key==="ArrowRight"&&i.viewerIndex<i.viewerPhotos.length-1&&(i.viewerIndex+=1,f())};document.addEventListener("keydown",l),i.viewerKeyHandler=l}function S(){const t=r.querySelector("#photo-viewer");t&&(t.style.display="none",i.viewerKeyHandler&&(document.removeEventListener("keydown",i.viewerKeyHandler),i.viewerKeyHandler=null),i.viewerPhotos=[],i.viewerIndex=0)}async function N(){for(let t=0;t<i.viewerPhotos.length;t+=1){const e=i.viewerPhotos[t],a=r.querySelector(`.student-review-photo-cell[data-photo-key="${e.key}"]`);a?.dataset.loadedUrl?e.url=a.dataset.loadedUrl:e.url=await A(e.key),t===i.viewerIndex&&f()}}function f(){const t=r.querySelector("#photo-viewer-img"),e=r.querySelector("#photo-counter"),a=r.querySelector("#photo-dots"),n=r.querySelector("#viewer-prev"),l=r.querySelector("#viewer-next");if(!t)return;const v=i.viewerPhotos[i.viewerIndex];v?.url?t.src=v.url:t.removeAttribute("src"),e.textContent=`${i.viewerIndex+1} / ${i.viewerPhotos.length}`,n.disabled=i.viewerIndex<=0,l.disabled=i.viewerIndex>=i.viewerPhotos.length-1,n.style.visibility=i.viewerPhotos.length>1?"visible":"hidden",l.style.visibility=i.viewerPhotos.length>1?"visible":"hidden",a.innerHTML=i.viewerPhotos.map((oe,U)=>`<span class="photo-viewer-dot ${U===i.viewerIndex?"active":""}"></span>`).join("")}}function ee(r,s){return r.length?`
    <section class="profile-section animate-fade-in-up stagger-3">
      <h3 class="section-title" style="margin-bottom:var(--space-3)">审核记录</h3>
      <div class="student-review-list">
        ${r.map(o=>{const d=re(o.rejectReason),g=O(o),u=F(o)?"available":W(o),h=s===o.id,x=H(o.createdAt||Date.now()),b=ae(o,d);return`
            <article class="student-review-card ${h?"expanded":""}" data-submission-id="${o.id}" data-stagger>
              <button class="student-review-trigger" data-review-toggle="${o.id}" type="button">
                <div class="student-review-main">
                  <div class="student-review-title">${w(o.taskTitle||"任务")}</div>
                  <div class="student-review-subtitle">${w(x)}</div>
                </div>
                <div class="student-review-side">
                  ${u==="available"?`
                    <span class="student-review-chip">
                      ${c("image",12)}
                      照片 ${g.length}
                    </span>
                  `:""}
                  <span class="student-review-pill ${o.status}">
                    ${w(ie(o.status,o.points||o.taskPoints||0))}
                  </span>
                  <span class="student-review-arrow">${c("chevronRight",14)}</span>
                </div>
              </button>

              <div class="student-review-detail" ${h?"":"hidden"}>
                <div class="student-review-row">
                  <strong>审核</strong>
                  <span>${w(b)}</span>
                </div>
                ${o.status==="rejected"&&d.reason?`
                  <div class="student-review-row student-review-reason">
                    <strong>原因</strong>
                    <span>${w(d.reason)}</span>
                  </div>
                `:""}
                ${G(o.submissionText||o.submission_text,{label:"文字提交"})}
                ${u==="available"&&g.length?`
                  <div class="student-review-photo-strip" data-photo-keys='${JSON.stringify(g)}'>
                    ${g.map(($,i)=>`
                      <div class="student-review-photo-cell" data-photo-key="${$}" data-photo-idx="${i}">
                        <span class="photo-loading">${c("image",18)}</span>
                      </div>
                    `).join("")}
                  </div>
                `:""}
              </div>
            </article>
          `}).join("")}
      </div>
    </section>
  `:`
      <section class="profile-section animate-fade-in-up stagger-3">
        <h3 class="section-title" style="margin-bottom:var(--space-3)">审核记录</h3>
        <div class="empty-state">
          ${c("clock",32)}
          <h3>还没有审核记录</h3>
          <p>任务提交并完成审核后，会在这里保留当天可查看的照片记录。</p>
        </div>
      </section>
    `}function te(r,s){const o=r.querySelector("#avatar-modal"),d=r.querySelector("#avatar-modal-body"),g=m(s.avatar,"🙂");o.style.display="flex",d.innerHTML=`
    <h2 class="modal-title" style="text-align:center">选择头像</h2>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:var(--space-2);margin-bottom:var(--space-4)">
      ${_.map(p=>`
        <button class="avatar-opt" data-emoji="${p}" style="
          width:100%;aspect-ratio:1;border-radius:var(--radius-lg);
          font-size:1.6rem;display:flex;align-items:center;justify-content:center;
          background:var(--color-divider);border:2px solid ${p===g?"var(--color-primary)":"transparent"};
          cursor:pointer;transition:all var(--duration-fast) var(--ease-out);
        ">${p}</button>
      `).join("")}
    </div>
    <button class="btn btn-secondary btn-block" id="close-avatar">关闭</button>
  `,d.querySelectorAll(".avatar-opt").forEach(p=>{p.onclick=async()=>{const u=m(p.dataset.emoji,"🙂");d.querySelectorAll(".avatar-opt").forEach(h=>{h.style.borderColor="transparent"}),p.style.borderColor="var(--color-primary)",r.querySelector("#user-avatar-display").textContent=u,s.avatar=u;try{await V.patch("/users/avatar",{avatar:u}),y.updateUserField("avatar",u),P("头像已更新","success")}catch(h){P(`更新失败: ${h.message||"请重试"}`,"error")}}}),d.querySelector("#close-avatar").onclick=()=>j(o),o.onclick=p=>{p.target===o&&j(o)}}function j(r){r.classList.add("closing"),setTimeout(()=>{r.style.display="none",r.classList.remove("closing")},300)}function re(r){if(!r)return{reviewer:"",reason:""};const s=String(r).trim();if(s.startsWith("approved_by:"))return{reviewer:s.replace("approved_by:",""),reason:""};if(s.startsWith("rejected_by:")){const[o,d]=s.replace("rejected_by:","").split("|");return{reviewer:o||"",reason:d||""}}return{reviewer:"",reason:s}}function ae(r,s){const o=s.reviewer?`家长 ${s.reviewer}`:"家长",d=H(r.reviewedAt||r.createdAt||Date.now());return r.status==="approved"?`${o}已通过 · ${d}`:r.status==="rejected"?`${o}已驳回 · ${d}`:`${r.status||"已记录"} · ${d}`}function ie(r,s){return r==="approved"?`通过 +${s}`:r==="rejected"?"已驳回":"待审核"}function H(r){const s=Number(r)||Date.now();return new Date(s).toLocaleString("zh-CN",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:!1}).replace(",","")}export{ve as renderStudentProfile};
