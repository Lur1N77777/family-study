// ========================================
// Login / register page
// ========================================

import { icon } from '../utils/icons.js';
import { auth } from '../utils/auth.js';
import { router } from '../utils/router.js';
import { toast } from '../utils/notification.js';

export function renderLogin(container, isRegister = false) {
  if (auth.isLoggedIn()) {
    router.navigate(auth.getRole() === 'parent' ? '/parent' : '/student');
    return;
  }

  const role = sessionStorage.getItem('login_role') || 'child';
  const roleEmoji = role === 'parent' ? '家' : '学';
  const roleName = role === 'parent' ? '家长' : '学生';
  const pendingAuthMessage = auth.consumeAuthMessage();

  let showRegister = isRegister;

  function render() {
    container.innerHTML = `
      <div class="login-page">
        <div class="login-header">
          <button class="btn btn-icon" id="back-btn">${icon('arrowLeft', 20)}</button>
        </div>

        <div class="login-content animate-fade-in-up">
          <div class="login-avatar">${roleEmoji}</div>
          <h1 class="login-title">${showRegister ? '创建账号' : '欢迎回来'}</h1>
          <p class="login-subtitle">${roleName}${showRegister ? '注册' : '登录'}</p>

          <form class="login-form" id="auth-form">
            <div class="input-group">
              <label class="input-label">用户名</label>
              <input class="input" type="text" id="username" placeholder="输入用户名" autocomplete="username" required />
            </div>

            <div class="input-group">
              <label class="input-label">密码</label>
              <input class="input" type="password" id="password" placeholder="输入密码" autocomplete="${showRegister ? 'new-password' : 'current-password'}" required />
            </div>

            ${showRegister && role === 'child' ? `
              <div class="input-group">
                <label class="input-label">家庭码</label>
                <input class="input" type="text" id="family-code" placeholder="输入家长提供的六位家庭码" maxlength="6" required />
                <p class="input-hint">请向家长索取六位家庭码</p>
              </div>
            ` : ''}

            ${showRegister && role === 'parent' ? `
              <div class="input-group">
                <label class="input-label">家庭模式</label>
                <div class="tabs" style="margin-bottom:0">
                  <button class="tab active" type="button" data-mode="create">创建新家庭</button>
                  <button class="tab" type="button" data-mode="join">加入已有家庭</button>
                </div>
              </div>
              <div class="input-group" id="join-code-group" style="display:none">
                <label class="input-label">家庭码</label>
                <input class="input" type="text" id="join-family-code" placeholder="输入已有家庭的六位家庭码" maxlength="6" />
                <p class="input-hint">向其他家长索取家庭码即可加入</p>
              </div>
            ` : ''}

            <button class="btn btn-primary btn-block btn-lg" type="submit" id="submit-btn">
              ${showRegister ? '注册' : '登录'}
            </button>
          </form>

          <div class="login-switch">
            <button class="btn btn-ghost" id="switch-btn">
              ${showRegister ? '已有账号？去登录' : '没有账号？去注册'}
            </button>
          </div>
        </div>

        ${showRegister && role === 'parent' ? `
          <div class="register-hint animate-fade-in stagger-3">
            <div class="hint-icon">${icon('key', 18)}</div>
            <p id="hint-text">创建新家庭后，系统会自动生成六位家庭码，用来邀请家人加入。</p>
          </div>
        ` : ''}
      </div>

      <style>
        .login-page {
          min-height: 100vh;
          min-height: 100dvh;
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
        }

        .login-header {
          padding: var(--space-2) 0;
        }

        .login-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 400px;
          margin: 0 auto;
          width: 100%;
          padding-bottom: var(--space-16);
        }

        .login-avatar {
          font-size: 3.5rem;
          text-align: center;
          margin-bottom: var(--space-4);
        }

        .login-title {
          font-size: var(--text-2xl);
          font-weight: var(--weight-bold);
          text-align: center;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          text-align: center;
          color: var(--color-text-secondary);
          font-size: var(--text-sm);
          margin-top: var(--space-1);
          margin-bottom: var(--space-8);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .login-form .btn-block {
          margin-top: var(--space-4);
        }

        .input-hint {
          font-size: var(--text-xs);
          color: var(--color-text-tertiary);
          margin-top: var(--space-1);
        }

        .login-switch {
          text-align: center;
          margin-top: var(--space-4);
        }

        .register-hint {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--color-primary-soft);
          border-radius: var(--radius-lg);
          margin-top: auto;
          margin-bottom: var(--space-4);
        }

        .register-hint .hint-icon {
          color: var(--color-primary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .register-hint p {
          font-size: var(--text-sm);
          color: var(--color-primary);
          line-height: 1.5;
        }
      </style>
    `;

    container.querySelector('#back-btn').onclick = () => router.navigate('/');

    container.querySelector('#switch-btn').onclick = () => {
      showRegister = !showRegister;
      render();
    };

    container.querySelectorAll('.tab[data-mode]').forEach((tab) => {
      tab.onclick = () => {
        container.querySelectorAll('.tab[data-mode]').forEach((item) => item.classList.remove('active'));
        tab.classList.add('active');
        const joinGroup = container.querySelector('#join-code-group');
        const hintText = container.querySelector('#hint-text');

        if (tab.dataset.mode === 'join') {
          if (joinGroup) joinGroup.style.display = 'block';
          if (hintText) hintText.textContent = '输入已有家庭码即可加入，与其他家长共同管理孩子学习。';
        } else {
          if (joinGroup) joinGroup.style.display = 'none';
          if (hintText) hintText.textContent = '创建新家庭后，系统会自动生成六位家庭码，用来邀请家人加入。';
        }
      };
    });

    container.querySelector('#auth-form').onsubmit = async (event) => {
      event.preventDefault();
      const submitBtn = container.querySelector('#submit-btn');
      const originalText = submitBtn.innerHTML;

      const username = container.querySelector('#username').value.trim();
      const password = container.querySelector('#password').value.trim();

      if (!username || !password) {
        toast('请填写完整信息', 'warning');
        return;
      }

      if (showRegister) {
        let familyCode = '';
        let joinExisting = false;

        if (role === 'child') {
          familyCode = container.querySelector('#family-code')?.value.trim();
          if (!familyCode || familyCode.length !== 6) {
            toast('请输入有效的六位家庭码', 'warning');
            return;
          }
        } else {
          const joinGroup = container.querySelector('#join-code-group');
          if (joinGroup && joinGroup.style.display !== 'none') {
            joinExisting = true;
            familyCode = container.querySelector('#join-family-code')?.value.trim();
            if (!familyCode || familyCode.length !== 6) {
              toast('请输入有效的六位家庭码', 'warning');
              return;
            }
          }
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '注册中...';

        try {
          const result = await auth.register(username, password, role, familyCode, joinExisting);
          toast('注册成功', 'success');
          if (role === 'parent' && !joinExisting) {
            toast(`您的家庭码：${result.familyCode || '已生成'}`, 'info', 5000);
          }
        } catch (error) {
          toast(error.message || '注册失败，请重试', 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          return;
        }
      } else {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '登录中...';

        try {
          await auth.login(username, password);
          toast('登录成功', 'success');
        } catch (error) {
          toast(error.message || '登录失败，请重试', 'error');
          container.querySelector('#auth-form').classList.add('animate-shake');
          setTimeout(() => container.querySelector('#auth-form')?.classList.remove('animate-shake'), 500);
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          return;
        }
      }

      const nextPage = auth.getRole() === 'parent' ? '/parent' : '/student';
      setTimeout(() => router.navigate(nextPage), 300);
    };
  }

  if (pendingAuthMessage) {
    toast(pendingAuthMessage, 'warning', 4000);
  }

  render();
}
