// ========================================
// Student shop page
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { toast } from '../../utils/notification.js';
import { staggerIn, haptic } from '../../utils/animations.js';
import { showBottomNav } from '../../utils/nav.js';
import { enhanceSegmentedControls, runViewTransition } from '../../utils/segmented-control.js';

export async function renderStudentShop(container) {
  container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>`;

  await auth.refreshUser();
  const user = auth.requireUser();
  const products = await store.getProducts();

  let activeCategory = 'all';
  let hasAnimatedIn = false;

  function render() {
    const points = user.points || 0;
    const filtered = activeCategory === 'all' ? products : products.filter((product) => product.category === activeCategory);

    container.innerHTML = `
      <div class="page shop-page">
        <div class="page-header">
          <h1 class="page-title">积分商城</h1>
          <div class="shop-balance">
            <span class="balance-label">可用积分</span>
            <span class="balance-value">${points}</span>
          </div>
        </div>

        <div class="tabs" data-segmented="student-shop-category">
          <button class="tab ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">全部</button>
          <button class="tab ${activeCategory === 'virtual' ? 'active' : ''}" data-cat="virtual">权益</button>
          <button class="tab ${activeCategory === 'physical' ? 'active' : ''}" data-cat="physical">实物</button>
        </div>

        <div class="product-grid" id="products">
          ${filtered.map((product) => `
            <div class="product-card ${points < product.price ? 'product-disabled' : ''}" data-stagger>
              <div class="product-emoji">${product.emoji || '馃巵'}</div>
              <h3 class="product-name">${product.name}</h3>
              <p class="product-desc">${product.description || ''}</p>
              <div class="product-footer">
                <span class="product-price">${product.price}</span>
                <button class="btn btn-primary btn-sm product-buy-btn"
                  data-product-id="${product.id}"
                  ${points < product.price ? 'disabled' : ''}>
                  兑换
                </button>
              </div>
            </div>
          `).join('')}
          ${filtered.length === 0 ? `
            <div class="empty-state" style="grid-column:1/-1">
              ${icon('gift', 48)}
              <h3>暂无商品</h3>
              <p>家长还没有上架奖励</p>
            </div>
          ` : ''}
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
    `;

    enhanceSegmentedControls(container);

    container.querySelectorAll('.tab[data-cat]').forEach((tab) => {
      tab.onclick = () => {
        if (activeCategory === tab.dataset.cat) return;
        runViewTransition(() => {
          activeCategory = tab.dataset.cat;
          render();
        });
      };
    });

    container.querySelectorAll('.product-buy-btn').forEach((button) => {
      button.onclick = () => {
        const product = products.find((item) => item.id === button.dataset.productId);
        if (product) {
          openRedeemModal(product, points);
        }
      };
    });

    if (!hasAnimatedIn) {
      staggerIn(container, '[data-stagger]');
      hasAnimatedIn = true;
    }
    showBottomNav('child', 'shop');
  }

  function openRedeemModal(product, points) {
    const modal = container.querySelector('#confirm-modal');
    const body = container.querySelector('#modal-body');
    modal.style.display = 'flex';

    body.innerHTML = `
      <h2 class="modal-title">确认兑换</h2>
      <div style="text-align:center;margin-bottom:var(--space-4)">
        <div style="font-size:3rem">${product.emoji || '馃巵'}</div>
        <h3 style="margin-top:var(--space-2)">${product.name}</h3>
        <p style="color:var(--color-text-secondary);font-size:var(--text-sm)">${product.description || '暂无描述'}</p>
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

    body.querySelector('#cancel-redeem').onclick = () => closeModal(modal);
    modal.onclick = (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    };

    body.querySelector('#confirm-redeem').onclick = async () => {
      const button = body.querySelector('#confirm-redeem');
      button.innerHTML = '兑换中...';
      button.disabled = true;

      try {
        await store.redeemProduct(product.id);
        haptic('success');
        toast('兑换成功，等待家长确认', 'success');

        user.points -= product.price;

        closeModal(modal, () => {
          render();
        });
      } catch (error) {
        toast(error.message || '兑换失败，请重试', 'error');
        button.innerHTML = '确认兑换';
        button.disabled = false;
      }
    };
  }

  render();
}

function closeModal(modal, onClosed) {
  modal.classList.add('closing');
  setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('closing');
    onClosed?.();
  }, 300);
}
