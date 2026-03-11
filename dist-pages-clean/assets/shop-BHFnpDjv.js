import{a as v,s as m,i as g,b}from"./index-CJupM59u.js";import{t as y}from"./notification-DFOYBy0U.js";import{s as h,h as x}from"./animations-BN6acAuJ.js";import{e as $,r as w}from"./segmented-control-BsrRqP-b.js";async function j(e){e.innerHTML='<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>',await v.refreshUser();const i=v.requireUser(),l=await m.getProducts();let o="all",p=!1;function d(){const t=i.points||0,c=o==="all"?l:l.filter(a=>a.category===o);e.innerHTML=`
      <div class="page shop-page">
        <div class="page-header">
          <h1 class="page-title">积分商城</h1>
          <div class="shop-balance">
            <span class="balance-label">可用积分</span>
            <span class="balance-value">${t}</span>
          </div>
        </div>

        <div class="tabs" data-segmented="student-shop-category">
          <button class="tab ${o==="all"?"active":""}" data-cat="all">全部</button>
          <button class="tab ${o==="virtual"?"active":""}" data-cat="virtual">权益</button>
          <button class="tab ${o==="physical"?"active":""}" data-cat="physical">实物</button>
        </div>

        <div class="product-grid" id="products">
          ${c.map(a=>`
            <div class="product-card ${t<a.price?"product-disabled":""}" data-stagger>
              <div class="product-emoji">${a.emoji||"馃巵"}</div>
              <h3 class="product-name">${a.name}</h3>
              <p class="product-desc">${a.description||""}</p>
              <div class="product-footer">
                <span class="product-price">${a.price}</span>
                <button class="btn btn-primary btn-sm product-buy-btn"
                  data-product-id="${a.id}"
                  ${t<a.price?"disabled":""}>
                  兑换
                </button>
              </div>
            </div>
          `).join("")}
          ${c.length===0?`
            <div class="empty-state" style="grid-column:1/-1">
              ${g("gift",48)}
              <h3>暂无商品</h3>
              <p>家长还没有上架奖励</p>
            </div>
          `:""}
        </div>
      </div>

      <div class="modal-overlay" id="confirm-modal" style="display:none">
        <div class="modal-content">
          <div class="modal-handle"></div>
          <div id="modal-body"></div>
        </div>
      </div>

      <style>
        .shop-page { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }

        .shop-balance {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--color-primary-soft);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full);
          margin-top: var(--space-2);
        }

        .balance-label {
          font-size: var(--text-sm);
          color: var(--color-primary);
        }

        .balance-value {
          font-family: var(--font-mono);
          font-weight: var(--weight-bold);
          color: var(--color-primary);
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-3);
        }

        .product-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          box-shadow: var(--shadow-sm);
        }

        .product-disabled {
          opacity: 0.6;
        }

        .product-emoji {
          font-size: 2.4rem;
          margin-bottom: var(--space-2);
        }

        .product-name {
          font-size: var(--text-base);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--space-1);
        }

        .product-desc {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          min-height: 2.6em;
          margin-bottom: var(--space-3);
        }

        .product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-2);
        }

        .product-price {
          font-family: var(--font-mono);
          font-weight: var(--weight-bold);
          color: var(--color-primary);
        }
      </style>
    `,$(e),e.querySelectorAll(".tab[data-cat]").forEach(a=>{a.onclick=()=>{o!==a.dataset.cat&&w(()=>{o=a.dataset.cat,d()})}}),e.querySelectorAll(".product-buy-btn").forEach(a=>{a.onclick=()=>{const s=l.find(r=>r.id===a.dataset.productId);s&&u(s,t)}}),p||(h(e,"[data-stagger]"),p=!0),b("child","shop")}function u(t,c){const a=e.querySelector("#confirm-modal"),s=e.querySelector("#modal-body");a.style.display="flex",s.innerHTML=`
      <h2 class="modal-title">确认兑换</h2>
      <div style="text-align:center;margin-bottom:var(--space-4)">
        <div style="font-size:3rem">${t.emoji||"馃巵"}</div>
        <h3 style="margin-top:var(--space-2)">${t.name}</h3>
        <p style="color:var(--color-text-secondary);font-size:var(--text-sm)">${t.description||"暂无描述"}</p>
      </div>
      <div style="display:flex;justify-content:space-between;padding:var(--space-4);background:var(--color-divider);border-radius:var(--radius-lg);margin-bottom:var(--space-6)">
        <div>
          <p style="font-size:var(--text-xs);color:var(--color-text-secondary)">所需积分</p>
          <p style="font-weight:700;color:var(--color-danger);font-family:var(--font-mono)">${t.price}</p>
        </div>
        <div style="text-align:right">
          <p style="font-size:var(--text-xs);color:var(--color-text-secondary)">兑换后余额</p>
          <p style="font-weight:700;color:var(--color-primary);font-family:var(--font-mono)">${c-t.price}</p>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn-secondary btn-lg" style="flex:1" id="cancel-redeem">取消</button>
        <button class="btn btn-primary btn-lg" style="flex:1" id="confirm-redeem">确认兑换</button>
      </div>
    `,s.querySelector("#cancel-redeem").onclick=()=>n(a),a.onclick=r=>{r.target===a&&n(a)},s.querySelector("#confirm-redeem").onclick=async()=>{const r=s.querySelector("#confirm-redeem");r.innerHTML="兑换中...",r.disabled=!0;try{await m.redeemProduct(t.id),x("success"),y("兑换成功，等待家长确认","success"),i.points-=t.price,n(a,()=>{d()})}catch(f){y(f.message||"兑换失败，请重试","error"),r.innerHTML="确认兑换",r.disabled=!1}}}d()}function n(e,i){e.classList.add("closing"),setTimeout(()=>{e.style.display="none",e.classList.remove("closing"),i?.()},300)}export{j as renderStudentShop};
