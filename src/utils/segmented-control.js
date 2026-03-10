const segmentedSnapshots = new Map();

export function enhanceSegmentedControls(container) {
    container.querySelectorAll('[data-segmented]').forEach((control, index) => {
        bindSegmentedControl(control);
        syncSegmentedControl(control, `${control.dataset.segmented || 'segmented'}-${index}`);
    });
}

export function syncSegmentedControl(control, fallbackKey = 'segmented', options = {}) {
    if (!control) return;

    const buttons = getSegmentedButtons(control);
    const activeButton = buttons.find((button) => button.classList.contains('active'));
    if (!activeButton) return;

    control.classList.add('segmented-enhanced');

    let indicator = control.querySelector('.segmented-indicator');
    if (!indicator) {
        indicator = document.createElement('span');
        indicator.className = 'segmented-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        control.prepend(indicator);
    }

    const key = sanitizeKey(control.dataset.segmented || fallbackKey);

    const nextSnapshot = measureButton(control, activeButton);
    const previousSnapshot = segmentedSnapshots.get(key);

    if (previousSnapshot && !prefersReducedMotion()) {
        applySnapshot(indicator, previousSnapshot, false);
        indicator.getBoundingClientRect();
        requestAnimationFrame(() => applySnapshot(indicator, nextSnapshot, true));
    } else {
        applySnapshot(indicator, nextSnapshot, false);
    }

    segmentedSnapshots.set(key, nextSnapshot);
    if (options.reveal !== false) {
        maybeRevealActiveButton(control, activeButton, Boolean(previousSnapshot));
    }
}

export function runViewTransition(update) {
    if (typeof update !== 'function') return Promise.resolve();
    update();
    return Promise.resolve();
}

function getSegmentedButtons(control) {
    return [...control.querySelectorAll('[data-segmented-item], .tab, .review-switch-btn')];
}

function bindSegmentedControl(control) {
    if (control.dataset.segmentedBound === 'true') return;

    let rafId = 0;
    const sync = () => {
        rafId = 0;
        syncSegmentedControl(control, undefined, { reveal: false });
    };

    control.addEventListener('scroll', () => {
        if (rafId) return;
        rafId = requestAnimationFrame(sync);
    }, { passive: true });

    control.dataset.segmentedBound = 'true';
}

function measureButton(control, button) {
    const controlRect = control.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const buttonStyle = getComputedStyle(button);

    return {
        x: buttonRect.left - controlRect.left,
        y: buttonRect.top - controlRect.top,
        width: buttonRect.width,
        height: buttonRect.height,
        radius: readRadius(buttonStyle.borderTopLeftRadius, buttonRect.height),
    };
}

function applySnapshot(indicator, snapshot, animated) {
    indicator.style.transition = animated
        ? 'transform 280ms cubic-bezier(.22, 1, .36, 1), width 280ms cubic-bezier(.22, 1, .36, 1), height 280ms cubic-bezier(.22, 1, .36, 1)'
        : 'none';
    indicator.style.width = `${snapshot.width}px`;
    indicator.style.height = `${snapshot.height}px`;
    indicator.style.borderRadius = `${snapshot.radius}px`;
    indicator.style.transform = `translate3d(${snapshot.x}px, ${snapshot.y}px, 0)`;
}

function maybeRevealActiveButton(control, activeButton, animated) {
    if (control.dataset.segmentedScroll !== 'true') return;

    requestAnimationFrame(() => {
        activeButton.scrollIntoView({
            behavior: animated && !prefersReducedMotion() ? 'smooth' : 'auto',
            block: 'nearest',
            inline: 'nearest',
        });
    });
}

function prefersReducedMotion() {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function sanitizeKey(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '-');
}

function readRadius(rawRadius, fallbackHeight) {
    const radius = parseFloat(String(rawRadius).split(' ')[0]);
    if (Number.isFinite(radius) && radius > 0) {
        return radius;
    }

    return Math.min(fallbackHeight / 2, 999);
}
