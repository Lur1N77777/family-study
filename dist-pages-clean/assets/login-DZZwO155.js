import{a as o,r as g,i as v}from"./index-CJupM59u.js";import{t as r}from"./notification-DFOYBy0U.js";import{e as w,s as q}from"./segmented-control-BsrRqP-b.js";function $(e,f=!1){if(o.isLoggedIn()){g.navigate(o.getRole()==="parent"?"/parent":"/student");return}const s=sessionStorage.getItem("login_role")||"child",h=s==="parent"?"家":"学",y=s==="parent"?"家长":"学生",m=o.consumeAuthMessage();let a=f;function b(){e.innerHTML=`
      <div class="login-page">
        <div class="login-header">
          <button class="btn btn-icon" id="back-btn">${v("arrowLeft",20)}</button>
        </div>

        <div class="login-content animate-fade-in-up">
          <div class="login-avatar">${h}</div>
          <h1 class="login-title">${a?"创建账号":"欢迎回来"}</h1>
          <p class="login-subtitle">${y}${a?"注册":"登录"}</p>

          <form class="login-form" id="auth-form">
            <div class="input-group">
              <label class="input-label">用户名</label>
              <input class="input" type="text" id="username" placeholder="输入用户名" autocomplete="username" required />
            </div>

            <div class="input-group">
              <label class="input-label">密码</label>
              <input class="input" type="password" id="password" placeholder="输入密码" autocomplete="${a?"new-password":"current-password"}" required />
            </div>

            ${a&&s==="child"?`
              <div class="input-group">
                <label class="input-label">家庭码</label>
                <input class="input" type="text" id="family-code" placeholder="输入家长提供的六位家庭码" maxlength="6" required />
                <p class="input-hint">请向家长索取六位家庭码</p>
              </div>
            `:""}

            ${a&&s==="parent"?`
              <div class="input-group">
                <label class="input-label">家庭模式</label>
                <div class="tabs" style="margin-bottom:0" data-segmented="login-family-mode">
                  <button class="tab active" type="button" data-mode="create">创建新家庭</button>
                  <button class="tab" type="button" data-mode="join">加入已有家庭</button>
                </div>
              </div>
              <div class="input-group" id="join-code-group" style="display:none">
                <label class="input-label">家庭码</label>
                <input class="input" type="text" id="join-family-code" placeholder="输入已有家庭的六位家庭码" maxlength="6" />
                <p class="input-hint">向其他家长索取家庭码即可加入</p>
              </div>
            `:""}

            <button class="btn btn-primary btn-block btn-lg" type="submit" id="submit-btn">
              ${a?"注册":"登录"}
            </button>
          </form>

          <div class="login-switch">
            <button class="btn btn-ghost" id="switch-btn">
              ${a?"已有账号？去登录":"没有账号？去注册"}
            </button>
          </div>
        </div>

        ${a&&s==="parent"?`
          <div class="register-hint animate-fade-in stagger-3">
            <div class="hint-icon">${v("key",18)}</div>
            <p id="hint-text">创建新家庭后，系统会自动生成六位家庭码，用来邀请家人加入。</p>
          </div>
        `:""}
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
    `,e.querySelector("#back-btn").onclick=()=>g.navigate("/"),e.querySelector("#switch-btn").onclick=()=>{a=!a,b()},w(e),e.querySelectorAll(".tab[data-mode]").forEach(c=>{c.onclick=()=>{e.querySelectorAll(".tab[data-mode]").forEach(d=>d.classList.remove("active")),c.classList.add("active"),q(e.querySelector('[data-segmented="login-family-mode"]'));const t=e.querySelector("#join-code-group"),n=e.querySelector("#hint-text");c.dataset.mode==="join"?(t&&(t.style.display="block"),n&&(n.textContent="输入已有家庭码即可加入，与其他家长共同管理孩子学习。")):(t&&(t.style.display="none"),n&&(n.textContent="创建新家庭后，系统会自动生成六位家庭码，用来邀请家人加入。"))}}),e.querySelector("#auth-form").onsubmit=async c=>{c.preventDefault();const t=e.querySelector("#submit-btn"),n=t.innerHTML,d=e.querySelector("#username").value.trim(),u=e.querySelector("#password").value.trim();if(!d||!u){r("请填写完整信息","warning");return}if(a){let i="",p=!1;if(s==="child"){if(i=e.querySelector("#family-code")?.value.trim(),!i||i.length!==6){r("请输入有效的六位家庭码","warning");return}}else{const l=e.querySelector("#join-code-group");if(l&&l.style.display!=="none"&&(p=!0,i=e.querySelector("#join-family-code")?.value.trim(),!i||i.length!==6)){r("请输入有效的六位家庭码","warning");return}}t.disabled=!0,t.innerHTML="注册中...";try{const l=await o.register(d,u,s,i,p);r("注册成功","success"),s==="parent"&&!p&&r(`您的家庭码：${l.familyCode||"已生成"}`,"info",5e3)}catch(l){r(l.message||"注册失败，请重试","error"),t.disabled=!1,t.innerHTML=n;return}}else{t.disabled=!0,t.innerHTML="登录中...";try{await o.login(d,u),r("登录成功","success")}catch(i){r(i.message||"登录失败，请重试","error"),e.querySelector("#auth-form").classList.add("animate-shake"),setTimeout(()=>e.querySelector("#auth-form")?.classList.remove("animate-shake"),500),t.disabled=!1,t.innerHTML=n;return}}const x=o.getRole()==="parent"?"/parent":"/student";setTimeout(()=>g.navigate(x),300)}}m&&r(m,"warning",4e3),b()}export{$ as renderLogin};
