import{a as v,s as c,d as p,i as s,t as $,b as S,A as k,c as w}from"./index-CJupM59u.js";import{t as n}from"./notification-DFOYBy0U.js";import{e as y}from"./escape-lW1fV86Q.js";async function R(t){t.innerHTML='<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>',await v.refreshUser();const o=v.requireUser(),a=v.getFamilyCode(),i=document.documentElement.getAttribute("data-theme")==="dark",d=await c.getFamilyChildren(a);q(t,o,a,d,i)}function q(t,o,a,i,d){t.innerHTML=`
    <div class="page" style="padding-bottom:calc(var(--nav-height-safe) + var(--space-6))">
      <div class="page-header">
        <h1 class="page-title">设置</h1>
      </div>

      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">账户信息</h3>
        <div class="list-group">
          <div class="list-item" id="change-avatar-btn" style="cursor:pointer">
            <div class="avatar" id="user-avatar">${p(o.avatar,"🧑")}</div>
            <div class="list-item-content">
              <div class="list-item-title">${y(o.username)}</div>
              <div class="list-item-subtitle">点击更换头像</div>
            </div>
            ${s("chevronRight",18)}
          </div>
        </div>
      </section>

      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up stagger-2">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">家庭码</h3>
        <div class="list-group">
          <div class="list-item">
            ${s("key",20)}
            <div class="list-item-content">
              <div class="list-item-title">当前家庭码</div>
              <div class="list-item-subtitle" style="font-family:var(--font-mono);font-weight:700;color:var(--color-primary);letter-spacing:0.15em;font-size:var(--text-md)">${a}</div>
            </div>
            <button class="btn btn-icon btn-ghost" id="copy-code">${s("copy",18)}</button>
          </div>
        </div>
        <p style="font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-2);padding:0 var(--space-2)">
          分享此家庭码给孩子，注册时输入即可加入家庭
        </p>
      </section>

      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up stagger-3">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">家庭成员 (${i.length})</h3>
        <div class="list-group">
          ${i.map(e=>`
            <div class="list-item">
              <div class="avatar">${p(e.avatar,"🙂")}</div>
              <div class="list-item-content">
                <div class="list-item-title">${y(e.username)}</div>
                <div class="list-item-subtitle">积分: ${e.points||0}</div>
              </div>
            </div>
          `).join("")}
          ${i.length===0?`
            <div class="list-item" style="justify-content:center;color:var(--color-text-tertiary);padding:var(--space-6)">
              暂无成员，分享家庭码邀请孩子加入
            </div>
          `:""}
        </div>
      </section>

      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up stagger-4">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">偏好设置</h3>
        <div class="list-group">
          <div class="list-item" id="toggle-theme">
            <span style="color:var(--color-text-secondary)">${d?s("sun",20):s("moon",20)}</span>
            <div class="list-item-content">
              <div class="list-item-title">${d?"浅色模式":"深色模式"}</div>
            </div>
            ${s("chevronRight",18)}
          </div>
        </div>
      </section>

      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up stagger-5">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">数据管理</h3>
        <div class="list-group">
          <div class="list-item" id="export-data">
            ${s("download",20)}
            <div class="list-item-content">
              <div class="list-item-title">导出数据</div>
              <div class="list-item-subtitle">导出当前家庭的任务、成员、兑换和统计</div>
            </div>
            ${s("chevronRight",18)}
          </div>
          <div class="list-item" id="reset-data" style="color:var(--color-danger)">
            ${s("refresh",20)}
            <div class="list-item-content">
              <div class="list-item-title" style="color:var(--color-danger)">重置数据</div>
              <div class="list-item-subtitle">当前云端版默认关闭此危险操作</div>
            </div>
            ${s("shield",18)}
          </div>
        </div>
      </section>

      <section class="animate-fade-in-up stagger-6">
        <div class="list-group">
          <div class="list-item" id="logout-btn" style="justify-content:center;color:var(--color-danger);font-weight:600">
            退出登录
          </div>
        </div>
      </section>
    </div>

    <div class="modal-overlay modal-centered" id="avatar-modal" style="display:none">
      <div class="modal-content">
        <div id="avatar-modal-body"></div>
      </div>
    </div>
  `,t.querySelector("#copy-code").onclick=()=>{navigator.clipboard?.writeText(a).then(()=>n("已复制","success")).catch(()=>n(`家庭码：${a}`,"info"))},t.querySelector("#toggle-theme").onclick=e=>{$(e);const r=document.documentElement.getAttribute("data-theme")==="dark",l=t.querySelector("#toggle-theme span"),m=t.querySelector("#toggle-theme .list-item-title");l&&(l.innerHTML=r?s("sun",20):s("moon",20)),m&&(m.textContent=r?"浅色模式":"深色模式")},t.querySelector("#export-data").onclick=async()=>{try{const[e,r,l,m,h,b]=await Promise.all([c.getTasks(),c.getProducts(),c.getSubmissions(),c.getRedemptions(),c.getStats(),c.getActivityLog(100)]),f={exportedAt:new Date().toISOString(),familyCode:a,users:[{...o,role:"parent"},...i],tasks:e,products:r,submissions:l,redemptions:m,stats:h,activity:b},x=new Blob([JSON.stringify(f,null,2)],{type:"application/json"}),g=document.createElement("a");g.href=URL.createObjectURL(x),g.download=`家庭学习数据_${new Date().toISOString().slice(0,10)}.json`,g.click(),URL.revokeObjectURL(g.href),n("导出成功","success")}catch(e){n(e.message||"导出失败，请重试","error")}},t.querySelector("#reset-data").onclick=async()=>{try{await c.resetData()}catch(e){n(e.message||"当前版本暂不支持重置","warning")}},t.querySelector("#logout-btn").onclick=()=>{v.logout(),n("已退出登录","info")},t.querySelector("#change-avatar-btn").onclick=()=>A(t,o),S("parent","settings")}function A(t,o){const a=t.querySelector("#avatar-modal"),i=t.querySelector("#avatar-modal-body"),d=p(o.avatar,"🧑");a.style.display="flex",i.innerHTML=`
    <h2 class="modal-title" style="text-align:center">选择头像</h2>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:var(--space-2);margin-bottom:var(--space-4)">
      ${k.map(e=>`
        <button class="avatar-opt" data-emoji="${e}" style="
          width:100%;aspect-ratio:1;border-radius:var(--radius-lg);
          font-size:1.6rem;display:flex;align-items:center;justify-content:center;
          background:var(--color-divider);border:2px solid ${e===d?"var(--color-primary)":"transparent"};
          cursor:pointer;transition:all var(--duration-fast) var(--ease-out);
        ">${e}</button>
      `).join("")}
    </div>
    <button class="btn btn-secondary btn-block" id="close-avatar">关闭</button>
  `,i.querySelectorAll(".avatar-opt").forEach(e=>{e.onclick=async()=>{const r=p(e.dataset.emoji,"🧑");i.querySelectorAll(".avatar-opt").forEach(l=>{l.style.borderColor="transparent"}),e.style.borderColor="var(--color-primary)",t.querySelector("#user-avatar").textContent=r,o.avatar=r;try{await w.patch("/users/avatar",{avatar:r}),v.updateUserField("avatar",r),n("头像已更新","success")}catch(l){n(`更新失败: ${l.message||"请重试"}`,"error")}}}),i.querySelector("#close-avatar").onclick=()=>u(a),a.onclick=e=>{e.target===a&&u(a)}}function u(t){t.classList.add("closing"),setTimeout(()=>{t.style.display="none",t.classList.remove("closing")},300)}export{R as renderParentSettings};
