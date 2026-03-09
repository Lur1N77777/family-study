// ========================================
// 应用入口 — main.js
// ========================================

import './styles/index.css';
import { router } from './utils/router.js';
import { auth } from './utils/auth.js';
import { hideBottomNav } from './utils/nav.js';

// 主题初始化
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// 主题切换 — 从按钮位置圆形扩散动画
export function toggleTheme(event) {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';

  // 获取按钮位置作为扩散中心
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  if (event) {
    // 支持鼠标事件和触摸事件
    const rect = event.currentTarget?.getBoundingClientRect?.();
    if (rect) {
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else if (event.clientX !== undefined) {
      x = event.clientX;
      y = event.clientY;
    }
  }

  // 计算扩散半径（需要覆盖整个屏幕的对角线距离）
  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // 尝试使用 View Transitions API（Chrome 111+）
  if (document.startViewTransition) {
    document.documentElement.style.setProperty('--theme-toggle-x', `${x}px`);
    document.documentElement.style.setProperty('--theme-toggle-y', `${y}px`);
    document.documentElement.style.setProperty('--theme-toggle-r', `${maxRadius}px`);

    const transition = document.startViewTransition(() => {
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });

    transition.ready.then(() => {
      // 使用 clip-path 圆形扩散动画
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: 'ease-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    }).catch(() => {
      // 动画失败也不影响主题切换
    });
  } else {
    // 不支持 View Transitions 的浏览器：使用 overlay + clip-path 手动实现
    performFallbackTransition(next, x, y, maxRadius);
  }
}

// 降级方案：克隆整个页面截图，用 clip-path 动画覆盖
function performFallbackTransition(nextTheme, x, y, maxRadius) {
  // 创建覆盖层
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99999;
    pointer-events: none;
    background: ${nextTheme === 'dark' ? '#1a1a2e' : '#ffffff'};
    clip-path: circle(0px at ${x}px ${y}px);
    transition: clip-path 500ms ease-out;
  `;
  document.body.appendChild(overlay);

  // 强制回流后开始动画
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.style.clipPath = `circle(${maxRadius}px at ${x}px ${y}px)`;
    });
  });

  // 动画到一半时切主题（视觉上更平滑）
  setTimeout(() => {
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  }, 200);

  // 动画完成后移除覆盖层
  setTimeout(() => {
    overlay.remove();
  }, 550);
}

// 路由注册 - 使用动态导入实现代码分割
router
  .add('/', async (container) => {
    const { renderLanding } = await import('./pages/landing.js');
    return renderLanding(container);
  })
  .add('/login', async (container) => {
    const { renderLogin } = await import('./pages/login.js');
    return renderLogin(container);
  })
  .add('/register', async (container) => {
    const { renderLogin } = await import('./pages/login.js');
    return renderLogin(container, true);
  })
  .add('/student', async (container) => {
    const { renderStudentDashboard } = await import('./pages/student/dashboard.js');
    return renderStudentDashboard(container);
  })
  .add('/student/tasks', async (container) => {
    const { renderStudentTasks } = await import('./pages/student/tasks.js');
    return renderStudentTasks(container);
  })
  .add('/student/shop', async (container) => {
    const { renderStudentShop } = await import('./pages/student/shop.js');
    return renderStudentShop(container);
  })
  .add('/student/profile', async (container) => {
    const { renderStudentProfile } = await import('./pages/student/profile.js');
    return renderStudentProfile(container);
  })
  .add('/parent', async (container) => {
    const { renderParentOverview } = await import('./pages/parent/overview.js');
    return renderParentOverview(container);
  })
  .add('/parent/review', async (container) => {
    const { renderParentReview } = await import('./pages/parent/review.js');
    return renderParentReview(container);
  })
  .add('/parent/tasks', async (container) => {
    const { renderParentTasks } = await import('./pages/parent/tasks.js');
    return renderParentTasks(container);
  })
  .add('/parent/products', async (container) => {
    const { renderParentProducts } = await import('./pages/parent/products.js');
    return renderParentProducts(container);
  })
  .add('/parent/settings', async (container) => {
    const { renderParentSettings } = await import('./pages/parent/settings.js');
    return renderParentSettings(container);
  })
  .guard((path) => {
    const publicPaths = ['/', '/login', '/register'];
    if (publicPaths.includes(path)) {
      hideBottomNav();
      return true;
    }

    if (!auth.isLoggedIn()) {
      router.navigate('/login');
      return false;
    }

    if (path.startsWith('/student') && auth.getRole() !== 'child') {
      router.navigate('/parent');
      return false;
    }

    if (path.startsWith('/parent') && auth.getRole() !== 'parent') {
      router.navigate('/student');
      return false;
    }

    return true;
  });

// 启动
initTheme();
router.start();
