// ========================================
// JS 动画工具
// ========================================

// 数字计数动画
export function animateNumber(element, from, to, duration = 800) {
    const start = performance.now();
    const diff = to - from;

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(from + diff * eased);
        element.textContent = current.toLocaleString();
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// 交错渐显动画
export function staggerIn(container, selector, delay = 60) {
    const items = container.querySelectorAll(selector);
    items.forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(16px)';
        item.style.transition = `opacity var(--duration-slow) var(--ease-out), transform var(--duration-slow) var(--ease-out)`;
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, i * delay + 50);
    });
}

// 弹簧物理动画
export function springAnimation(element, property, target, config = {}) {
    const { stiffness = 200, damping = 20, mass = 1 } = config;
    let velocity = 0;
    let current = parseFloat(getComputedStyle(element)[property]) || 0;
    let animating = true;

    function step() {
        if (!animating) return;
        const force = stiffness * (target - current);
        const dampingForce = damping * velocity;
        const acceleration = (force - dampingForce) / mass;
        velocity += acceleration * 0.016;
        current += velocity * 0.016;

        if (Math.abs(target - current) < 0.5 && Math.abs(velocity) < 0.5) {
            current = target;
            animating = false;
        }

        element.style[property] = `${current}px`;
        if (animating) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
    return () => { animating = false; };
}

// 触感反馈（iOS Haptic）
export function haptic(type = 'light') {
    if (navigator.vibrate) {
        switch (type) {
            case 'light': navigator.vibrate(10); break;
            case 'medium': navigator.vibrate(20); break;
            case 'heavy': navigator.vibrate(30); break;
            case 'success': navigator.vibrate([10, 50, 10]); break;
            case 'error': navigator.vibrate([30, 50, 30, 50, 30]); break;
        }
    }
}

// 打勾弹出动画
export function checkPopAnimation(element) {
    element.style.animation = 'checkPop var(--duration-slow) var(--ease-spring) both';
    haptic('success');
}
