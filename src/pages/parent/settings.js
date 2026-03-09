// ========================================
// Parent settings page
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { toast } from '../../utils/notification.js';
import { toggleTheme } from '../../main.js';
import { showBottomNav } from '../../utils/nav.js';
import { api } from '../../utils/api.js';
import { escapeHtml } from '../../utils/escape.js';
import { AVATAR_EMOJIS, sanitizeEmoji } from '../../utils/emoji.js';

const EMOJI_AVATARS = [
  '馃懆', '馃懇', '馃', '馃懘', '馃懙', '馃',
  '馃懆鈥嶐煉?', '馃懇鈥嶐煉?', '馃懆鈥嶐煆?', '馃懇鈥嶐煆?', '馃懆鈥嶁殨锔?', '馃懇鈥嶁殨锔?',
  '馃Ω', '馃', '馃', '馃', '馃', '馃懟',
  '馃惐', '馃惗', '馃', '馃惣', '馃惃', '馃',
  '馃専', '馃寛', '馃敟', '馃拵', '馃崁', '馃尭',
];

export async function renderParentSettings(container) {
  container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>`;

  await auth.refreshUser();
  const user = auth.requireUser();
  const familyCode = auth.getFamilyCode();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const children = await store.getFamilyChildren(familyCode);

  renderContent(container, user, familyCode, children, isDark);
}

function renderContent(container, user, familyCode, children, isDark) {
  container.innerHTML = `
    <div class="page" style="padding-bottom:calc(var(--nav-height-safe) + var(--space-6))">
      <div class="page-header">
        <h1 class="page-title">设置</h1>
      </div>

      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">账户信息</h3>
        <div class="list-group">
          <div class="list-item" id="change-avatar-btn" style="cursor:pointer">
            <div class="avatar" id="user-avatar">${sanitizeEmoji(user.avatar, '🧑')}</div>
            <div class="list-item-content">
              <div class="list-item-title">${escapeHtml(user.username)}</div>
              <div class="list-item-subtitle">点击更换头像</div>
            </div>
            ${icon('chevronRight', 18)}
          </div>
        </div>
      </section>

      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up stagger-2">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">家庭码</h3>
        <div class="list-group">
          <div class="list-item">
            ${icon('key', 20)}
            <div class="list-item-content">
              <div class="list-item-title">当前家庭码</div>
              <div class="list-item-subtitle" style="font-family:var(--font-mono);font-weight:700;color:var(--color-primary);letter-spacing:0.15em;font-size:var(--text-md)">${familyCode}</div>
            </div>
            <button class="btn btn-icon btn-ghost" id="copy-code">${icon('copy', 18)}</button>
          </div>
        </div>
        <p style="font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-2);padding:0 var(--space-2)">
          分享此家庭码给孩子，注册时输入即可加入家庭
        </p>
      </section>

      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up stagger-3">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">家庭成员 (${children.length})</h3>
        <div class="list-group">
          ${children.map((child) => `
            <div class="list-item">
              <div class="avatar">${sanitizeEmoji(child.avatar, '🙂')}</div>
              <div class="list-item-content">
                <div class="list-item-title">${escapeHtml(child.username)}</div>
                <div class="list-item-subtitle">积分: ${child.points || 0}</div>
              </div>
            </div>
          `).join('')}
          ${children.length === 0 ? `
            <div class="list-item" style="justify-content:center;color:var(--color-text-tertiary);padding:var(--space-6)">
              暂无成员，分享家庭码邀请孩子加入
            </div>
          ` : ''}
        </div>
      </section>

      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up stagger-4">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">偏好设置</h3>
        <div class="list-group">
          <div class="list-item" id="toggle-theme">
            <span style="color:var(--color-text-secondary)">${isDark ? icon('sun', 20) : icon('moon', 20)}</span>
            <div class="list-item-content">
              <div class="list-item-title">${isDark ? '浅色模式' : '深色模式'}</div>
            </div>
            ${icon('chevronRight', 18)}
          </div>
        </div>
      </section>

      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up stagger-5">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">数据管理</h3>
        <div class="list-group">
          <div class="list-item" id="export-data">
            ${icon('download', 20)}
            <div class="list-item-content">
              <div class="list-item-title">导出数据</div>
              <div class="list-item-subtitle">导出当前家庭的任务、成员、兑换和统计</div>
            </div>
            ${icon('chevronRight', 18)}
          </div>
          <div class="list-item" id="reset-data" style="color:var(--color-danger)">
            ${icon('refresh', 20)}
            <div class="list-item-content">
              <div class="list-item-title" style="color:var(--color-danger)">重置数据</div>
              <div class="list-item-subtitle">当前云端版默认关闭此危险操作</div>
            </div>
            ${icon('shield', 18)}
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
  `;

  container.querySelector('#copy-code').onclick = () => {
    navigator.clipboard?.writeText(familyCode)
      .then(() => toast('已复制', 'success'))
      .catch(() => toast(`家庭码：${familyCode}`, 'info'));
  };

  container.querySelector('#toggle-theme').onclick = (event) => {
    toggleTheme(event);
    const nextDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const iconSpan = container.querySelector('#toggle-theme span');
    const titleSpan = container.querySelector('#toggle-theme .list-item-title');
    if (iconSpan) iconSpan.innerHTML = nextDark ? icon('sun', 20) : icon('moon', 20);
    if (titleSpan) titleSpan.textContent = nextDark ? '浅色模式' : '深色模式';
  };

  container.querySelector('#export-data').onclick = async () => {
    try {
      const [tasks, products, submissions, redemptions, stats, activity] = await Promise.all([
        store.getTasks(),
        store.getProducts(),
        store.getSubmissions(),
        store.getRedemptions(),
        store.getStats(),
        store.getActivityLog(100)
      ]);

      const payload = {
        exportedAt: new Date().toISOString(),
        familyCode,
        users: [{ ...user, role: 'parent' }, ...children],
        tasks,
        products,
        submissions,
        redemptions,
        stats,
        activity,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = `家庭学习数据_${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
      toast('导出成功', 'success');
    } catch (error) {
      toast(error.message || '导出失败，请重试', 'error');
    }
  };

  container.querySelector('#reset-data').onclick = async () => {
    try {
      await store.resetData();
    } catch (error) {
      toast(error.message || '当前版本暂不支持重置', 'warning');
    }
  };

  container.querySelector('#logout-btn').onclick = () => {
    auth.logout();
    toast('已退出登录', 'info');
  };

  container.querySelector('#change-avatar-btn').onclick = () => showAvatarModal(container, user);

  showBottomNav('parent', 'settings');
}

function showAvatarModal(container, user) {
  const modal = container.querySelector('#avatar-modal');
  const body = container.querySelector('#avatar-modal-body');
  const currentAvatar = sanitizeEmoji(user.avatar, '🧑');
  modal.style.display = 'flex';

  body.innerHTML = `
    <h2 class="modal-title" style="text-align:center">选择头像</h2>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:var(--space-2);margin-bottom:var(--space-4)">
      ${AVATAR_EMOJIS.map((emoji) => `
        <button class="avatar-opt" data-emoji="${emoji}" style="
          width:100%;aspect-ratio:1;border-radius:var(--radius-lg);
          font-size:1.6rem;display:flex;align-items:center;justify-content:center;
          background:var(--color-divider);border:2px solid ${emoji === currentAvatar ? 'var(--color-primary)' : 'transparent'};
          cursor:pointer;transition:all var(--duration-fast) var(--ease-out);
        ">${emoji}</button>
      `).join('')}
    </div>
    <button class="btn btn-secondary btn-block" id="close-avatar">关闭</button>
  `;

  body.querySelectorAll('.avatar-opt').forEach((button) => {
    button.onclick = async () => {
      const emoji = sanitizeEmoji(button.dataset.emoji, '🧑');
      body.querySelectorAll('.avatar-opt').forEach((item) => {
        item.style.borderColor = 'transparent';
      });
      button.style.borderColor = 'var(--color-primary)';
      container.querySelector('#user-avatar').textContent = emoji;
      user.avatar = emoji;

      try {
        await api.patch('/users/avatar', { avatar: emoji });
        auth.updateUserField('avatar', emoji);
        toast('头像已更新', 'success');
      } catch (error) {
        toast(`更新失败: ${error.message || '请重试'}`, 'error');
      }
    };
  });

  body.querySelector('#close-avatar').onclick = () => closeModal(modal);
  modal.onclick = (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  };
}

function closeModal(modal) {
  modal.classList.add('closing');
  setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('closing');
  }, 300);
}
