// ========================================
// 学生端 — 积分商城
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { router } from '../../utils/router.js';
import { toast } from '../../utils/notification.js';
import { staggerIn, haptic } from '../../utils/animations.js';

function renderBottomNav(container, active) {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.innerHTML = `
    <button class="nav-item ${active === 'home' ? 'active' : ''}" data-route="/student">
      ${icon('home', 22)}<span>首页</span>
    </button>
    <button class="nav-item ${active === 'tasks' ? 'active' : ''}" data-route="/student/tasks">
      ${icon('tasks', 22)}<span>任务</span>
    </button>
    <button class="nav-item ${active === 'shop' ? 'active' : ''}" data-route="/student/shop">
      ${icon('gift', 22)}<span>商城</span>
    </button>
    <button class="nav-item ${active === 'profile' ? 'active' : ''}" data-route="/student/profile">
      ${icon('user', 22)}<span>我的</span>
    </button>
  `;
  nav.querySelectorAll('.nav-item').forEach(btn => {
    btn.onclick = () => router.navigate(btn.dataset.route);
  });
  container.appendChild(nav);
}

export async function renderStudentShop(container) {
  container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>`;

  await auth.refreshUser();
  const user = auth.currentUser;

  const products = await store.getProducts();

  let activeCategory = 'all';

  function render() {
    const points = user.points || 0;
    const filtered = activeCategory === 'all' ? products : products.filter(p => p.category === activeCategory);

    container.innerHTML = `
      <div class="page shop-page">
        <div class="page-header">
          <h1 class="page-title">积分商城</h1>
          <div class="shop-balance">
            <span class="balance-label">可用积分</span>
            <span class="balance-value">${points}</span>
          </div>
        </div>

        <div class="tabs">
          <button class="tab ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">全部</button>
          <button class="tab ${activeCategory === 'virtual' ? 'active' : ''}" data-cat="virtual">权益</button>
          <button class="tab ${activeCategory === 'physical' ? 'active' : ''}" data-cat="physical">实物</button>
        </div>

        <div class="product-grid" id="products">
          ${filtered.map(p => `
            <div class="product-card ${points < p.price ? 'product-disabled' : ''}" data-stagger>
              <div class="product-emoji">${p.emoji || '🎁'}</div>
              <h3 class="product-name">${p.name}</h3>
              <p class="product-desc">${p.description || ''}</p>
              <div class="product-footer">
                <span class="product-price">${p.price}</span>
                <button class="btn btn-primary btn-sm product-buy-btn" 
                  data-product-id="${p.id}" 
                  ${points < p.price ? 'disabled' : ''}>
                  兑换
                </button>
              </div>
            </div>
          `).join('')}
          ${filtered.length === 0 ? `
            <div class="empty-state" style="grid-column:1/-1">
              ${icon('gift', 48)}
              <h3>暂无商品</h3>
              <p>家长还没有上架商品</p>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- 兑换确认弹窗 -->
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
          font-size: var(--text-md);
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-3);
        }

        .product-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          transition: transform var(--duration-fast) var(--ease-out);
        }

        .product-card:active { transform: scale(0.97); }

        .product-card.product-disabled {
          opacity: 0.5;
        }

        .product-emoji {
          font-size: 2.5rem;
          margin-bottom: var(--space-3);
        }

        .product-name {
          font-size: var(--text-base);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--space-1);
        }

        .product-desc {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          line-height: 1.4;
          flex: 1;
          margin-bottom: var(--space-3);
        }

        .product-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .product-price {
          font-family: var(--font-mono);
          font-weight: var(--weight-bold);
          color: var(--color-primary);
        }

        .product-price::after {
          content: ' 积分';
          font-family: var(--font-family);
          font-weight: var(--weight-regular);
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
        }
      </style>
    `;

    // Tab 事件
    container.querySelectorAll('.tab').forEach(tab => {
      tab.onclick = () => {
        activeCategory = tab.dataset.cat;
        render();
      };
    });

    // 兑换按钮
    container.querySelectorAll('.product-buy-btn').forEach(btn => {
      btn.onclick = () => {
        const productId = btn.dataset.productId;
        const product = products.find(p => p.id === productId);
        if (!product) return;

        showConfirmModal(product, points);
      };
    });

    staggerIn(container, '[data-stagger]');
    showBottomNav('child', 'shop');
  }

  function showConfirmModal(product, points) {
    const modal = container.querySelector('#confirm-modal');
    const body = container.querySelector('#modal-body');
    modal.style.display = 'flex';

    body.innerHTML = `
      <div style="text-align:center;margin-bottom:var(--space-6)">
        <div style="font-size:3.5rem;margin-bottom:var(--space-3)">${product.emoji || '🎁'}</div>
        <h2 class="modal-title" style="margin-bottom:var(--space-1)">${product.name}</h2>
        <p style="color:var(--color-text-secondary);font-size:var(--text-sm)">${product.description || ''}</p>
      </div>
      <div style="display:flex;justify-content:space-between;padding:var(--space-4);background:var(--color-divider);border-radius:var(--radius-lg);margin-bottom:var(--space-6)">
        <div>
          <p style="font-size:var(--text-xs);color:var(--color-text-secondary)">所需积分</p>
          <p style="font-weight:700;color:var(--color-danger);font-family:var(--font-mono)">${product.price}</p>
        </div>
        <div style="text-align:right">
          <p style="font-size:var(--text-xs);color:var(--color-text-secondary)">兑换后余额</p>
          <p style="font-weight:700;color:var(--color-primary);font-family:var(--font-mono)">${points - product.price}</p>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn-secondary btn-lg" style="flex:1" id="cancel-redeem">取消</button>
        <button class="btn btn-primary btn-lg" style="flex:1" id="confirm-redeem">确认兑换</button>
      </div>
    `;

    body.querySelector('#cancel-redeem').onclick = () => {
      modal.classList.add('closing');
      setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
      }, 300);
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.classList.add('closing');
        setTimeout(() => {
          modal.style.display = 'none';
          modal.classList.remove('closing');
        }, 300);
      }
    };

    body.querySelector('#confirm-redeem').onclick = async () => {
      const btn = body.querySelector('#confirm-redeem');
      btn.innerHTML = '兑换中...';
      btn.disabled = true;

      const result = await store.redeemProduct(product.id);

      if (result.error) {
        toast(result.error, 'error');
        btn.innerHTML = '确认兑换';
        btn.disabled = false;
        return;
      }

      haptic('success');
      toast('兑换成功！等待家长确认', 'success');

      // 更新本地余额
      user.points -= product.price;

      modal.classList.add('closing');
      setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
        render();
      }, 300);
    };
  }

  render();
}
