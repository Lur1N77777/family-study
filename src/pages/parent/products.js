// ========================================
// 家长端 — 商品管理
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { toast } from '../../utils/notification.js';
import { staggerIn, haptic } from '../../utils/animations.js';
import { showBottomNav } from '../../utils/nav.js';

const EMOJIS = ['📱', '🎮', '🧹', '🎢', '🍫', '✏️', '🎁', '📚', '🏀', '🎵', '🎨', '🍕', '🍦', '🎬', '🚗', '👟', '🎧', '💰'];

export function renderParentProducts(container) {
  auth.refreshUser();
  const fc = auth.getFamilyCode();
  const uid = auth.getUserId();

  function render() {
    const products = store.getProducts(fc);
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
          ${products.map(p => `
            <div class="card" style="display:flex;align-items:flex-start;gap:var(--space-3)" data-stagger>
              <span style="font-size:2rem">${p.emoji || '🎁'}</span>
              <div style="flex:1;min-width:0">
                <h3 style="font-weight:600">${p.name}</h3>
                <p style="font-size:var(--text-sm);color:var(--color-text-secondary)">${p.description || ''}</p>
                <span class="badge ${p.category === 'virtual' ? 'badge-primary' : 'badge-success'}" style="margin-top:var(--space-2)">
                  ${p.category === 'virtual' ? '权益' : '实物'}
                </span>
              </div>
              <div style="text-align:right">
                <span class="points-display" style="font-size:var(--text-md)">${p.price}</span>
                <div style="display:flex;gap:4px;margin-top:var(--space-2);justify-content:flex-end">
                  <button class="btn btn-icon btn-ghost edit-btn" data-id="${p.id}">${icon('edit', 16)}</button>
                  <button class="btn btn-icon btn-ghost del-btn" data-id="${p.id}" style="color:var(--color-danger)">${icon('trash', 16)}</button>
                </div>
              </div>
            </div>
          `).join('')}
          ${products.length === 0 ? `<div class="empty-state">${icon('gift', 48)}<h3>还没有上架商品</h3><p>点击"上架"添加奖励</p></div>` : ''}
        </div>
      </div>
      <div class="modal-overlay" id="modal" style="display:none"><div class="modal-content"><div class="modal-handle"></div><div id="mbody"></div></div></div>
    `;
    container.querySelector('#add-btn').onclick = () => showModal();
    container.querySelectorAll('.edit-btn').forEach(b => { b.onclick = () => { const p = products.find(x => x.id === b.dataset.id); if (p) showModal(p); } });
    container.querySelectorAll('.del-btn').forEach(b => { b.onclick = () => { if (confirm('确定下架？')) { store.deleteProduct(b.dataset.id); toast('已下架', 'info'); render(); } } });
    staggerIn(container, '[data-stagger]');
    showBottomNav('parent', 'products');
  }

  function showModal(ep = null) {
    const m = container.querySelector('#modal'), b = container.querySelector('#mbody');
    m.style.display = 'flex';
    let emoji = ep?.emoji || '🎁', cat = ep?.category || 'virtual';
    b.innerHTML = `
      <h2 class="modal-title">${ep ? '编辑' : '上架'}商品</h2>
      <form id="pf">
        <div class="input-group"><label class="input-label">图标</label>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">${EMOJIS.map(e => `<button type="button" class="emo" data-e="${e}" style="width:40px;height:40px;font-size:1.5rem;border-radius:var(--radius-md);background:${e === emoji ? 'var(--color-primary-soft)' : 'var(--color-divider)'};display:flex;align-items:center;justify-content:center;${e === emoji ? 'box-shadow:0 0 0 2px var(--color-primary)' : ''}">${e}</button>`).join('')}</div>
        </div>
        <div class="input-group"><label class="input-label">名称</label><input class="input" id="pn" placeholder="如：玩手机1小时" value="${ep?.name || ''}" required></div>
        <div class="input-group"><label class="input-label">描述</label><input class="input" id="pd" placeholder="简短描述" value="${ep?.description || ''}"></div>
        <div class="input-group"><label class="input-label">类别</label>
          <div class="tabs" style="margin-bottom:0"><button class="tab ${cat === 'virtual' ? 'active' : ''}" type="button" data-c="virtual">权益</button><button class="tab ${cat === 'physical' ? 'active' : ''}" type="button" data-c="physical">实物</button></div>
        </div>
        <div class="input-group"><label class="input-label">积分售价</label><input class="input" type="number" id="pp" placeholder="50" value="${ep?.price || ''}" min="1" required></div>
        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4)">
          <button class="btn btn-secondary btn-lg" style="flex:1" type="button" id="cc">取消</button>
          <button class="btn btn-primary btn-lg" style="flex:1" type="submit">${ep ? '保存' : '上架'}</button>
        </div>
      </form>`;
    b.querySelectorAll('.emo').forEach(x => { x.onclick = () => { b.querySelectorAll('.emo').forEach(y => { y.style.background = 'var(--color-divider)'; y.style.boxShadow = 'none'; }); x.style.background = 'var(--color-primary-soft)'; x.style.boxShadow = '0 0 0 2px var(--color-primary)'; emoji = x.dataset.e; } });
    b.querySelectorAll('.tab[data-c]').forEach(t => { t.onclick = () => { b.querySelectorAll('.tab[data-c]').forEach(x => x.classList.remove('active')); t.classList.add('active'); cat = t.dataset.c; } });
    b.querySelector('#cc').onclick = () => closeM();
    m.onclick = e => { if (e.target === m) closeM(); };
    b.querySelector('#pf').onsubmit = e => {
      e.preventDefault();
      const n = b.querySelector('#pn').value.trim(), d = b.querySelector('#pd').value.trim(), p = parseInt(b.querySelector('#pp').value);
      if (!n || !p) { toast('请填写完整', 'warning'); return; }
      if (ep) { store.updateProduct(ep.id, { name: n, description: d, emoji, category: cat, price: p }); toast('已更新', 'success'); }
      else { store.createProduct({ name: n, description: d, emoji, category: cat, price: p, creatorId: uid, familyCode: fc }); haptic('success'); toast('已上架！', 'success'); }
      closeM(); render();
    };
    function closeM() { m.classList.add('closing'); setTimeout(() => { m.style.display = 'none'; m.classList.remove('closing'); }, 300); }
  }
  render();
}
