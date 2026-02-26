// ========================================
// 应用入口 — main.js
// ========================================

import './styles/index.css';
import { router } from './utils/router.js';
import { auth } from './utils/auth.js';
import { hideBottomNav } from './utils/nav.js';
import { renderLanding } from './pages/landing.js';
import { renderLogin } from './pages/login.js';
import { renderStudentDashboard } from './pages/student/dashboard.js';
import { renderStudentTasks } from './pages/student/tasks.js';
import { renderStudentShop } from './pages/student/shop.js';
import { renderStudentProfile } from './pages/student/profile.js';
import { renderParentOverview } from './pages/parent/overview.js';
import { renderParentReview } from './pages/parent/review.js';
import { renderParentTasks } from './pages/parent/tasks.js';
import { renderParentProducts } from './pages/parent/products.js';
import { renderParentSettings } from './pages/parent/settings.js';

// 主题初始化
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// 路由注册
router
  .add('/', renderLanding)
  .add('/login', renderLogin)
  .add('/register', (c) => renderLogin(c, true))
  .add('/student', renderStudentDashboard)
  .add('/student/tasks', renderStudentTasks)
  .add('/student/shop', renderStudentShop)
  .add('/student/profile', renderStudentProfile)
  .add('/parent', renderParentOverview)
  .add('/parent/review', renderParentReview)
  .add('/parent/tasks', renderParentTasks)
  .add('/parent/products', renderParentProducts)
  .add('/parent/settings', renderParentSettings)
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
