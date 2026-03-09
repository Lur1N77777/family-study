// ========================================
// Parent products page
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { toast } from '../../utils/notification.js';
import { staggerIn, haptic, setupSwipeToDismiss } from '../../utils/animations.js';
import { showBottomNav } from '../../utils/nav.js';
import { escapeHtml } from '../../utils/escape.js';
import { PRODUCT_EMOJIS, sanitizeEmoji } from '../../utils/emoji.js';

const EMOJIS = PRODUCT_EMOJIS;

export async function renderParentProducts(container) {
  container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>`;

  await auth.refreshUser();
  const user = auth.requireUser();
  const familyCode = auth.getFamilyCode();
  const products = await store.getProducts();

  renderPage(container, products, user.id, familyCode);
}

function renderPage(container, products, userId, familyCode) {
  container.innerHTML = `
    <div class="page" style="padding-bottom:calc(var(--nav-height-safe) + var(--space-6))">
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <h1 class="page-title">商品管理</h1>
          <p class="page-subtitle">${products.length} 个在售商品</p>
        </div>
        <button class="btn btn-primary" id="add-btn">${icon('plus', 18)} 上架</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-3)">
        ${products.map((product) => `
          <div class="card" style="display:flex;align-items:flex-start;gap:var(--space-3)" data-stagger>
            <span style="font-size:2rem">${sanitizeEmoji(product.emoji, '🎁')}</span>
            <div style="flex:1;min-width:0">
              <h3 style="font-weight:600">${product.name}</h3>
              <p style="font-size:var(--text-sm);color:var(--color-text-secondary)">${product.description || ''}</p>
              <span class="badge ${product.category === 'virtual' ? 'badge-primary' : 'badge-success'}" style="margin-top:var(--space-2)">
                ${product.category === 'virtual' ? '权益' : '实物'}
              </span>
            </div>
            <div style="text-align:right">
              <span class="points-display" style="font-size:var(--text-md)">${product.price}</span>
              <div style="display:flex;gap:4px;margin-top:var(--space-2);justify-content:flex-end">
                <button class="btn btn-icon btn-ghost edit-btn" data-id="${product.id}">${icon('edit', 16)}</button>
                <button class="btn btn-icon btn-ghost del-btn" data-id="${product.id}" style="color:var(--color-danger)">${icon('trash', 16)}</button>
              </div>
            </div>
          </div>
        `).join('')}
        ${products.length === 0 ? `<div class="empty-state">${icon('gift', 48)}<h3>还没有上架商品</h3><p>点击“上架”添加奖励</p></div>` : ''}
      </div>
    </div>
    <div class="modal-overlay" id="modal" style="display:none"><div class="modal-content"><div class="modal-handle"></div><div id="mbody"></div></div></div>
  `;

  container.querySelector('#add-btn').onclick = () => showModal();
  container.querySelectorAll('.edit-btn').forEach((button) => {
    button.onclick = () => {
      const product = products.find((item) => item.id === button.dataset.id);
      if (product) showModal(product);
    };
  });
  container.querySelectorAll('.del-btn').forEach((button) => {
    button.onclick = async () => {
      if (!confirm('确定下架这个商品吗？')) {
        return;
      }

      try {
        await store.deleteProduct(button.dataset.id);
        toast('已下架', 'info');
        renderParentProducts(container);
      } catch (error) {
        toast(error.message || '删除失败，请重试', 'error');
      }
    };
  });

  staggerIn(container, '[data-stagger]');
  showBottomNav('parent', 'products');

  function showModal(existingProduct = null) {
    const modal = container.querySelector('#modal');
    const body = container.querySelector('#mbody');
    modal.style.display = 'flex';
    setTimeout(() => body.closest('.modal-content')?.scrollTo(0, 0), 10);
    setupSwipeToDismiss(modal, closeModal);

    let emoji = sanitizeEmoji(existingProduct?.emoji, '🎁');
    let category = existingProduct?.category || 'virtual';

    body.innerHTML = `
      <h2 class="modal-title">${existingProduct ? '编辑' : '上架'}商品</h2>
      <form id="product-form">
        <div class="input-group">
          <label class="input-label">图标</label>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
            ${EMOJIS.map((item) => `
              <button type="button" class="emoji-btn" data-emoji="${item}" style="width:40px;height:40px;font-size:1.5rem;border-radius:var(--radius-md);background:${item === emoji ? 'var(--color-primary-soft)' : 'var(--color-divider)'};display:flex;align-items:center;justify-content:center;${item === emoji ? 'box-shadow:0 0 0 2px var(--color-primary)' : ''}">${item}</button>
            `).join('')}
          </div>
        </div>
        <div class="input-group"><label class="input-label">名称</label><input class="input" id="product-name" placeholder="如：玩手机 1 小时" value="${escapeHtml(existingProduct?.name || '')}" required></div>
        <div class="input-group"><label class="input-label">描述</label><input class="input" id="product-desc" placeholder="简短描述" value="${escapeHtml(existingProduct?.description || '')}"></div>
        <div class="input-group">
          <label class="input-label">类别</label>
          <div class="tabs" style="margin-bottom:0">
            <button class="tab ${category === 'virtual' ? 'active' : ''}" type="button" data-category="virtual">权益</button>
            <button class="tab ${category === 'physical' ? 'active' : ''}" type="button" data-category="physical">实物</button>
          </div>
        </div>
        <div class="input-group"><label class="input-label">积分售价</label><input class="input" type="number" id="product-price" placeholder="50" value="${existingProduct?.price || ''}" min="1" required></div>
        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4)">
          <button class="btn btn-secondary btn-lg" style="flex:1" type="button" id="cancel-btn">取消</button>
          <button class="btn btn-primary btn-lg" style="flex:1" type="submit">${existingProduct ? '保存' : '上架'}</button>
        </div>
      </form>
    `;

    body.querySelectorAll('.emoji-btn').forEach((button) => {
      button.onclick = () => {
        body.querySelectorAll('.emoji-btn').forEach((item) => {
          item.style.background = 'var(--color-divider)';
          item.style.boxShadow = 'none';
        });
        button.style.background = 'var(--color-primary-soft)';
        button.style.boxShadow = '0 0 0 2px var(--color-primary)';
        emoji = sanitizeEmoji(button.dataset.emoji, '🎁');
      };
    });

    body.querySelectorAll('.tab[data-category]').forEach((button) => {
      button.onclick = () => {
        body.querySelectorAll('.tab[data-category]').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        category = button.dataset.category;
      };
    });

    body.querySelector('#cancel-btn').onclick = () => closeModal();
    modal.onclick = (event) => {
      if (event.target === modal) {
        closeModal();
      }
    };

    body.querySelector('#product-form').onsubmit = async (event) => {
      event.preventDefault();
      const name = body.querySelector('#product-name').value.trim();
      const description = body.querySelector('#product-desc').value.trim();
      const price = parseInt(body.querySelector('#product-price').value, 10);
      if (!name || !price) {
        toast('请填写完整信息', 'warning');
        return;
      }

      try {
        if (existingProduct) {
          await store.updateProduct(existingProduct.id, { name, description, emoji: sanitizeEmoji(emoji, '🎁'), category, price });
          toast('已更新', 'success');
        } else {
          await store.createProduct({ name, description, emoji: sanitizeEmoji(emoji, '🎁'), category, price, creatorId: userId, familyCode });
          haptic('success');
          toast('已上架', 'success');
        }
        closeModal();
        renderParentProducts(container);
      } catch (error) {
        toast(error.message || '保存失败，请重试', 'error');
      }
    };

    function closeModal() {
      modal.classList.add('closing');
      setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
      }, 300);
    }
  }
}
