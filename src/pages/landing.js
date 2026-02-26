// ========================================
// Landing Page — 首屏
// ========================================

import { icon } from '../utils/icons.js';
import { router } from '../utils/router.js';
import { auth } from '../utils/auth.js';

export function renderLanding(container) {
    // 如果已登录，直接跳转
    if (auth.isLoggedIn()) {
        router.navigate(auth.getRole() === 'parent' ? '/parent' : '/student');
        return;
    }

    container.innerHTML = `
    <div class="landing-page">
      <!-- 渐变球体背景 -->
      <div class="landing-bg">
        <div class="gradient-blob blob-1"></div>
        <div class="gradient-blob blob-2"></div>
        <div class="gradient-blob blob-3"></div>
      </div>

      <!-- Hero 区域 -->
      <div class="landing-content">
        <div class="landing-hero animate-fade-in-up">
          <div class="hero-icon">📚</div>
          <h1 class="hero-title">学习监督</h1>
          <p class="hero-subtitle">让学习变得有动力，让成长看得见</p>
        </div>

        <!-- 角色入口 -->
        <div class="role-cards">
          <button class="role-card animate-fade-in-up stagger-2" id="enter-parent">
            <div class="role-emoji">👨</div>
            <div class="role-info">
              <h3>家长端</h3>
              <p>发布任务 · 审核管理</p>
            </div>
            <span class="role-arrow">${icon('chevronRight', 20)}</span>
          </button>

          <button class="role-card animate-fade-in-up stagger-3" id="enter-child">
            <div class="role-emoji">👦</div>
            <div class="role-info">
              <h3>学生端</h3>
              <p>完成任务 · 赚取积分</p>
            </div>
            <span class="role-arrow">${icon('chevronRight', 20)}</span>
          </button>
        </div>

        <p class="landing-footer animate-fade-in stagger-5">
          首次使用？家长先注册，然后用家庭码邀请孩子加入
        </p>
      </div>
    </div>

    <style>
      .landing-page {
        min-height: 100vh;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-6);
        position: relative;
        overflow: hidden;
      }

      .landing-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .blob-1 {
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(74, 125, 255, 0.3), transparent 70%);
        top: -50px;
        right: -80px;
        animation: float 6s var(--ease-smooth) infinite;
      }

      .blob-2 {
        width: 250px;
        height: 250px;
        background: radial-gradient(circle, rgba(52, 199, 89, 0.2), transparent 70%);
        bottom: 100px;
        left: -60px;
        animation: float 8s var(--ease-smooth) infinite 1s;
      }

      .blob-3 {
        width: 200px;
        height: 200px;
        background: radial-gradient(circle, rgba(255, 149, 0, 0.15), transparent 70%);
        bottom: -30px;
        right: 30px;
        animation: float 7s var(--ease-smooth) infinite 2s;
      }

      .landing-content {
        position: relative;
        z-index: 1;
        width: 100%;
        max-width: 400px;
      }

      .landing-hero {
        text-align: center;
        margin-bottom: var(--space-12);
      }

      .hero-icon {
        font-size: 4rem;
        margin-bottom: var(--space-4);
        animation: float 3s var(--ease-smooth) infinite;
      }

      .hero-title {
        font-size: var(--text-hero);
        font-weight: var(--weight-bold);
        letter-spacing: -0.03em;
        background: linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-primary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1.1;
      }

      .hero-subtitle {
        font-size: var(--text-md);
        color: var(--color-text-secondary);
        margin-top: var(--space-3);
        letter-spacing: 0.02em;
      }

      .role-cards {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .role-card {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-5);
        background: var(--color-surface);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-md);
        text-align: left;
        transition: all var(--duration-base) var(--ease-out);
        width: 100%;
      }

      .role-card:active {
        transform: scale(0.97);
        box-shadow: var(--shadow-sm);
      }

      .role-emoji {
        font-size: 2.5rem;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-primary-soft);
        border-radius: var(--radius-lg);
        flex-shrink: 0;
      }

      .role-info {
        flex: 1;
      }

      .role-info h3 {
        font-size: var(--text-md);
        font-weight: var(--weight-semibold);
        margin-bottom: 2px;
      }

      .role-info p {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      .role-arrow {
        color: var(--color-text-tertiary);
        flex-shrink: 0;
      }

      .landing-footer {
        text-align: center;
        font-size: var(--text-sm);
        color: var(--color-text-tertiary);
        margin-top: var(--space-8);
        line-height: 1.6;
      }
    </style>
  `;

    // 事件绑定
    container.querySelector('#enter-parent').onclick = () => {
        sessionStorage.setItem('login_role', 'parent');
        router.navigate('/login');
    };
    container.querySelector('#enter-child').onclick = () => {
        sessionStorage.setItem('login_role', 'child');
        router.navigate('/login');
    };
}
