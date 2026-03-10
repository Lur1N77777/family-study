// ========================================
// 家长端 — 通知中心
// ========================================

import { icon } from '../../utils/icons.js';
import { auth } from '../../utils/auth.js';
import { store } from '../../utils/store.js';
import { toast } from '../../utils/notification.js';
import { haptic } from '../../utils/animations.js';
import { showBottomNav } from '../../utils/nav.js';
import { escapeHtml } from '../../utils/escape.js';
import { enhanceSegmentedControls, runViewTransition } from '../../utils/segmented-control.js';

export async function renderParentNotify(container) {
  container.innerHTML = `<div style="padding:var(--space-8);text-align:center;color:var(--color-text-tertiary)">加载中...</div>`;

  await auth.refreshUser();
  auth.requireUser();
  const familyCode = auth.getFamilyCode();

  // 获取家庭成员和孩子列表
  const [allUsers, templates] = await Promise.all([
    store.getFamilyUsers(),
    store.getNotificationTemplates()
  ]);

  const children = allUsers.filter(u => u.role === 'child');
  const parents = allUsers.filter(u => u.role === 'parent');

  // 预设通知类型
  const presetMessages = templates || [
    { id: 'study', title: '学习提醒', message: '该学习了！快去做作业吧 📚', type: 'reminder' },
    { id: 'phone', title: '交手机', message: '学习时间结束，请把手机交给家长 📱', type: 'phone' },
    { id: 'sleep', title: '睡觉时间', message: '该睡觉了，晚安 💤', type: 'sleep' },
    { id: 'break', title: '休息一下', message: '学习辛苦了，休息 10 分钟吧 ☕', type: 'break' },
    { id: 'meal', title: '吃饭时间', message: '吃饭时间到了，快来吃饭 🍚', type: 'meal' },
  ];

  let selectedChild = 'all'; // 'all' or childId
  let customMessage = '';
  let hasAnimatedIn = false;

  function render() {
    const introClass = hasAnimatedIn ? '' : 'animate-fade-in-up';
    const staggerClass = (value) => (hasAnimatedIn ? '' : `animate-fade-in-up ${value}`.trim());

    container.innerHTML = `
      <div class="page notify-page">
        <div class="page-header">
          <h1 class="page-title">通知孩子</h1>
          <p class="page-subtitle">提醒孩子学习或交手机</p>
        </div>

        ${children.length > 0 ? `
          <div class="child-filter ${introClass}" data-segmented="parent-notify-child" data-segmented-scroll="true">
            <button class="child-chip ${selectedChild === 'all' ? 'active' : ''}" data-child="all">
              全部孩子
            </button>
            ${children.map(c => `
              <button class="child-chip ${selectedChild === c.id ? 'active' : ''}" data-child="${c.id}">
                <span class="child-chip-avatar">${c.avatar}</span>
                ${escapeHtml(c.username)}
              </button>
            `).join('')}
          </div>
        ` : ''}

        <!-- 预设快捷消息 -->
        <section class="notify-section ${staggerClass('stagger-2')}">
          <h2 class="section-title">快捷消息</h2>
          <div class="preset-grid">
            ${presetMessages.map(p => `
              <button class="preset-btn" data-title="${p.title}" data-message="${p.message}" data-type="${p.type}">
                <span class="preset-icon">${getPresetIcon(p.type)}</span>
                <span class="preset-text">${p.title}</span>
              </button>
            `).join('')}
          </div>
        </section>

        <!-- 自定义消息 -->
        <section class="notify-section ${staggerClass('stagger-3')}">
          <h2 class="section-title">自定义消息</h2>
          <div class="input-group">
            <input class="input" type="text" id="notify-title" placeholder="通知标题（选填）" value="" />
          </div>
          <div class="input-group">
            <textarea class="input" id="notify-message" placeholder="输入自定义消息..." rows="3" style="resize:none"></textarea>
          </div>
        </section>

        <!-- 发送按钮 -->
        <div class="notify-actions ${staggerClass('stagger-4')}">
          <button class="btn btn-primary btn-lg btn-block" id="send-notify-btn" disabled>
            ${icon('send', 18)} 发送通知
          </button>
        </div>

        <p class="notify-hint ${staggerClass('stagger-5')}">
          通知会立即推送到孩子的手机屏幕上
        </p>
      </div>

      <style>
        .notify-page { padding-bottom: calc(var(--nav-height-safe) + var(--space-6)); }

        .notify-section { margin-bottom: var(--space-6); }

        .section-title {
          font-size: var(--text-md);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--space-3);
        }

        /* 孩子筛选 */
        .child-filter {
          display: flex;
          gap: var(--space-2);
          overflow-x: auto;
          padding-bottom: var(--space-3);
          margin-bottom: var(--space-1);
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          --segmented-indicator-bg: var(--color-primary);
          --segmented-indicator-shadow: var(--shadow-md);
        }
        .child-filter::-webkit-scrollbar { display: none; }

        .child-chip {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: var(--weight-medium);
          white-space: nowrap;
          background: var(--color-surface);
          color: var(--color-text-secondary);
          box-shadow: var(--shadow-sm);
          transition: all var(--duration-fast) var(--ease-out);
          flex-shrink: 0;
        }

        .child-chip.active {
          background: var(--color-primary);
          color: white;
          box-shadow: var(--shadow-md);
        }
        .child-filter.segmented-enhanced .child-chip.active {
          background: transparent;
          color: white;
          box-shadow: none;
        }

        .child-chip-avatar { font-size: 1.1rem; }

        /* 预设快捷消息 */
        .preset-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-2);
        }

        .preset-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
          padding: var(--space-3);
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          transition: all var(--duration-fast) var(--ease-out);
        }

        .preset-btn:active {
          transform: scale(0.95);
          background: var(--color-primary-soft);
        }

        .preset-icon {
          font-size: 1.5rem;
        }

        .preset-text {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          text-align: center;
        }

        .notify-actions {
          margin-top: var(--space-4);
        }

        .notify-hint {
          text-align: center;
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          margin-top: var(--space-3);
        }
      </style>
    `;

    const childFilter = container.querySelector('.child-filter');
    if (childFilter) {
      childFilter.querySelectorAll('.child-chip').forEach((button) => {
        button.dataset.segmentedItem = 'true';
      });
    }

    enhanceSegmentedControls(container);

    // 孩子筛选
    container.querySelectorAll('.child-chip').forEach((chip) => {
      chip.onclick = () => {
        if (selectedChild === chip.dataset.child) return;
        runViewTransition(() => {
          selectedChild = chip.dataset.child;
          render();
        });
      };
    });

    // 预设消息点击
    container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.onclick = () => {
        const title = btn.dataset.title;
        const message = btn.dataset.message;
        const type = btn.dataset.type;

        container.querySelector('#notify-title').value = title;
        container.querySelector('#notify-message').value = message;
        customMessage = message;

        // 高亮选中
        container.querySelectorAll('.preset-btn').forEach(b => b.style.background = '');
        btn.style.background = 'var(--color-primary-soft)';

        updateSendButton();
      };
    });

    // 自定义消息输入
    container.querySelector('#notify-message').oninput = (e) => {
      customMessage = e.target.value;
      container.querySelectorAll('.preset-btn').forEach(b => b.style.background = '');
      updateSendButton();
    };

    function updateSendButton() {
      const btn = container.querySelector('#send-notify-btn');
      btn.disabled = !customMessage || customMessage.trim() === '';
    }

    // 发送通知
    container.querySelector('#send-notify-btn').onclick = async () => {
      const title = container.querySelector('#notify-title').value.trim() || '学习提醒';
      const message = customMessage.trim();
      const btn = container.querySelector('#send-notify-btn');

      if (!message) {
        toast('请输入或选择通知内容', 'warning');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '发送中...';

      try {
        let result;
        if (selectedChild === 'all') {
          // 广播给所有孩子
          result = await store.broadcastNotification(title, message, 'custom');
          toast(`已发送给 ${result.count || '所有'} 孩子`, 'success');
        } else {
          // 发送给指定孩子
          result = await store.sendNotification(selectedChild, title, message, 'custom');
          if (result.error) throw new Error(result.error);
          toast('已发送通知', 'success');
        }

        haptic('success');

        // 重置表单
        container.querySelector('#notify-title').value = '';
        container.querySelector('#notify-message').value = '';
        customMessage = '';
        container.querySelectorAll('.preset-btn').forEach(b => b.style.background = '');
        updateSendButton();

      } catch (e) {
        toast('发送失败: ' + e.message, 'error');
      }

      btn.disabled = false;
      btn.innerHTML = `${icon('send', 18)} 发送通知`;
    };

    hasAnimatedIn = true;
    showBottomNav('parent', 'notify');
  }

  render();
}

function getPresetIcon(type) {
  const icons = {
    study: '📚',
    phone: '📱',
    sleep: '💤',
    break: '☕',
    meal: '🍚',
    reminder: '🔔'
  };
  return icons[type] || '🔔';
}
