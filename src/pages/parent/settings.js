// ========================================
// 家长端 — 设置
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store, generateFamilyCode } from '../../utils/store.js';
import { router } from '../../utils/router.js';
import { toast } from '../../utils/notification.js';
import { toggleTheme } from '../../main.js';
import { showBottomNav } from '../../utils/nav.js';

export function renderParentSettings(container) {
  auth.refreshUser();
  const user = auth.currentUser;
  const fc = auth.getFamilyCode();
  const children = store.getFamilyChildren(fc);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  container.innerHTML = `
    <div class="page" style="padding-bottom:calc(var(--nav-height-safe) + var(--space-6))">
      <div class="page-header">
        <h1 class="page-title">设置</h1>
      </div>

      <!-- 账户信息 -->
      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">账户信息</h3>
        <div class="list-group">
          <div class="list-item">
            <div class="avatar">${user.avatar}</div>
            <div class="list-item-content">
              <div class="list-item-title">${user.username}</div>
              <div class="list-item-subtitle">家长</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 家庭码管理 -->
      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up stagger-2">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">家庭码</h3>
        <div class="list-group">
          <div class="list-item">
            ${icon('key', 20)}
            <div class="list-item-content">
              <div class="list-item-title">当前家庭码</div>
              <div class="list-item-subtitle" style="font-family:var(--font-mono);font-weight:700;color:var(--color-primary);letter-spacing:0.15em;font-size:var(--text-md)">${fc}</div>
            </div>
            <button class="btn btn-icon btn-ghost" id="copy-code">${icon('copy', 18)}</button>
          </div>
        </div>
        <p style="font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-2);padding:0 var(--space-2)">
          分享此码给孩子，注册时输入即可加入家庭
        </p>
      </section>

      <!-- 家庭成员 -->
      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up stagger-3">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">
          家庭成员 (${children.length})
        </h3>
        <div class="list-group">
          ${children.map(c => `
            <div class="list-item">
              <div class="avatar">${c.avatar}</div>
              <div class="list-item-content">
                <div class="list-item-title">${c.username}</div>
                <div class="list-item-subtitle">积分: ${c.points || 0}</div>
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

      <!-- 偏好设置 -->
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

      <!-- 数据管理 -->
      <section style="margin-bottom:var(--space-6)" class="animate-fade-in-up stagger-5">
        <h3 style="font-size:var(--text-sm);color:var(--color-text-secondary);margin-bottom:var(--space-3)">数据管理</h3>
        <div class="list-group">
          <div class="list-item" id="export-data">
            ${icon('download', 20)}
            <div class="list-item-content">
              <div class="list-item-title">导出数据</div>
              <div class="list-item-subtitle">导出所有数据为 JSON 文件</div>
            </div>
            ${icon('chevronRight', 18)}
          </div>
          <div class="list-item" id="reset-data" style="color:var(--color-danger)">
            ${icon('refresh', 20)}
            <div class="list-item-content">
              <div class="list-item-title" style="color:var(--color-danger)">重置数据</div>
              <div class="list-item-subtitle">恢复到初始演示数据</div>
            </div>
            ${icon('chevronRight', 18)}
          </div>
        </div>
      </section>

      <!-- 退出 -->
      <section class="animate-fade-in-up stagger-6">
        <div class="list-group">
          <div class="list-item" id="logout-btn" style="justify-content:center;color:var(--color-danger);font-weight:600">
            退出登录
          </div>
        </div>
      </section>

      <p style="text-align:center;font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-8)">
        学习监督 v1.0 · 用❤️为家庭打造
      </p>
    </div>
  `;

  // 事件绑定
  container.querySelector('#copy-code').onclick = () => {
    navigator.clipboard?.writeText(fc).then(() => toast('已复制', 'success')).catch(() => toast(`家庭码: ${fc}`, 'info'));
  };

  container.querySelector('#toggle-theme').onclick = () => {
    toggleTheme();
    renderParentSettings(container);
  };

  container.querySelector('#export-data').onclick = () => {
    const data = localStorage.getItem('family_study_app');
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `学习监督_数据备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast('导出成功', 'success');
  };

  container.querySelector('#reset-data').onclick = () => {
    if (confirm('确定重置所有数据吗？此操作不可恢复！')) {
      store.resetData();
      auth.logout();
      toast('数据已重置', 'info');
    }
  };

  container.querySelector('#logout-btn').onclick = () => {
    auth.logout();
    toast('已退出', 'info');
  };

  showBottomNav('parent', 'settings');
}
