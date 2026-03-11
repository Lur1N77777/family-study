import{a as g,s as u,i as y,d as n,b as q,P as w}from"./index-8knsp9ot.js";import{t as o}from"./notification-DFOYBy0U.js";import{s as j,b as k,h as E}from"./animations-BN6acAuJ.js";import{e as $}from"./escape-lW1fV86Q.js";import{e as T,s as L}from"./segmented-control-BsrRqP-b.js";const M=w;async function x(s){s.innerHTML='<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>',await g.refreshUser();const i=g.requireUser(),v=g.getFamilyCode(),m=await u.getProducts();A(s,m,i.id,v)}function A(s,i,v,m){s.innerHTML=`
    <div class="page" style="padding-bottom:calc(var(--nav-height-safe) + var(--space-6))">
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <h1 class="page-title">商品管理</h1>
          <p class="page-subtitle">${i.length} 个在售商品</p>
        </div>
        <button class="btn btn-primary" id="add-btn">${y("plus",18)} 上架</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-3)">
        ${i.map(e=>`
          <div class="card" style="display:flex;align-items:flex-start;gap:var(--space-3)" data-stagger>
            <span style="font-size:2rem">${n(e.emoji,"🎁")}</span>
            <div style="flex:1;min-width:0">
              <h3 style="font-weight:600">${e.name}</h3>
              <p style="font-size:var(--text-sm);color:var(--color-text-secondary)">${e.description||""}</p>
              <span class="badge ${e.category==="virtual"?"badge-primary":"badge-success"}" style="margin-top:var(--space-2)">
                ${e.category==="virtual"?"权益":"实物"}
              </span>
            </div>
            <div style="text-align:right">
              <span class="points-display" style="font-size:var(--text-md)">${e.price}</span>
              <div style="display:flex;gap:4px;margin-top:var(--space-2);justify-content:flex-end">
                <button class="btn btn-icon btn-ghost edit-btn" data-id="${e.id}">${y("edit",16)}</button>
                <button class="btn btn-icon btn-ghost del-btn" data-id="${e.id}" style="color:var(--color-danger)">${y("trash",16)}</button>
              </div>
            </div>
          </div>
        `).join("")}
        ${i.length===0?`<div class="empty-state">${y("gift",48)}<h3>还没有上架商品</h3><p>点击“上架”添加奖励</p></div>`:""}
      </div>
    </div>
    <div class="modal-overlay" id="modal" style="display:none"><div class="modal-content"><div class="modal-handle"></div><div id="mbody"></div></div></div>
  `,s.querySelector("#add-btn").onclick=()=>f(),s.querySelectorAll(".edit-btn").forEach(e=>{e.onclick=()=>{const l=i.find(a=>a.id===e.dataset.id);l&&f(l)}}),s.querySelectorAll(".del-btn").forEach(e=>{e.onclick=async()=>{if(confirm("确定下架这个商品吗？"))try{await u.deleteProduct(e.dataset.id),o("已下架","info"),x(s)}catch(l){o(l.message||"删除失败，请重试","error")}}}),j(s,"[data-stagger]"),q("parent","products");function f(e=null){const l=s.querySelector("#modal"),a=s.querySelector("#mbody");l.style.display="flex",setTimeout(()=>a.closest(".modal-content")?.scrollTo(0,0),10),k(l,p);let c=n(e?.emoji,"🎁"),d=e?.category||"virtual";a.innerHTML=`
      <h2 class="modal-title">${e?"编辑":"上架"}商品</h2>
      <form id="product-form">
        <div class="input-group">
          <label class="input-label">图标</label>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
            ${M.map(t=>`
              <button type="button" class="emoji-btn" data-emoji="${t}" style="width:40px;height:40px;font-size:1.5rem;border-radius:var(--radius-md);background:${t===c?"var(--color-primary-soft)":"var(--color-divider)"};display:flex;align-items:center;justify-content:center;${t===c?"box-shadow:0 0 0 2px var(--color-primary)":""}">${t}</button>
            `).join("")}
          </div>
        </div>
        <div class="input-group"><label class="input-label">名称</label><input class="input" id="product-name" placeholder="如：玩手机 1 小时" value="${$(e?.name||"")}" required></div>
        <div class="input-group"><label class="input-label">描述</label><input class="input" id="product-desc" placeholder="简短描述" value="${$(e?.description||"")}"></div>
        <div class="input-group">
          <label class="input-label">类别</label>
          <div class="tabs" style="margin-bottom:0" data-segmented="parent-product-category">
            <button class="tab ${d==="virtual"?"active":""}" type="button" data-category="virtual">权益</button>
            <button class="tab ${d==="physical"?"active":""}" type="button" data-category="physical">实物</button>
          </div>
        </div>
        <div class="input-group"><label class="input-label">积分售价</label><input class="input" type="number" id="product-price" placeholder="50" value="${e?.price||""}" min="1" required></div>
        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4)">
          <button class="btn btn-secondary btn-lg" style="flex:1" type="button" id="cancel-btn">取消</button>
          <button class="btn btn-primary btn-lg" style="flex:1" type="submit">${e?"保存":"上架"}</button>
        </div>
      </form>
    `,T(a),a.querySelectorAll(".emoji-btn").forEach(t=>{t.onclick=()=>{a.querySelectorAll(".emoji-btn").forEach(r=>{r.style.background="var(--color-divider)",r.style.boxShadow="none"}),t.style.background="var(--color-primary-soft)",t.style.boxShadow="0 0 0 2px var(--color-primary)",c=n(t.dataset.emoji,"🎁")}}),a.querySelectorAll(".tab[data-category]").forEach(t=>{t.onclick=()=>{a.querySelectorAll(".tab[data-category]").forEach(r=>r.classList.remove("active")),t.classList.add("active"),d=t.dataset.category,L(a.querySelector('[data-segmented="parent-product-category"]'))}}),a.querySelector("#cancel-btn").onclick=()=>p(),l.onclick=t=>{t.target===l&&p()},a.querySelector("#product-form").onsubmit=async t=>{t.preventDefault();const r=a.querySelector("#product-name").value.trim(),h=a.querySelector("#product-desc").value.trim(),b=parseInt(a.querySelector("#product-price").value,10);if(!r||!b){o("请填写完整信息","warning");return}try{e?(await u.updateProduct(e.id,{name:r,description:h,emoji:n(c,"🎁"),category:d,price:b}),o("已更新","success")):(await u.createProduct({name:r,description:h,emoji:n(c,"🎁"),category:d,price:b,creatorId:v,familyCode:m}),E("success"),o("已上架","success")),p(),x(s)}catch(S){o(S.message||"保存失败，请重试","error")}};function p(){l.classList.add("closing"),setTimeout(()=>{l.style.display="none",l.classList.remove("closing")},300)}}}export{x as renderParentProducts};
