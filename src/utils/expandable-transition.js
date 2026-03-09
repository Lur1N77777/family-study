const FRAME_KEY = Symbol('expandableFrame');
const HANDLER_KEY = Symbol('expandableHandler');
const TIMER_KEY = Symbol('expandableTimer');

function getFrameScheduler() {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    return globalThis.requestAnimationFrame.bind(globalThis);
  }

  return (callback) => globalThis.setTimeout(callback, 16);
}

function getFrameCanceller() {
  if (typeof globalThis.cancelAnimationFrame === 'function') {
    return globalThis.cancelAnimationFrame.bind(globalThis);
  }

  return globalThis.clearTimeout.bind(globalThis);
}

function clearPendingFrame(detail) {
  if (!detail?.[FRAME_KEY]) {
    return;
  }

  getFrameCanceller()(detail[FRAME_KEY]);
  detail[FRAME_KEY] = null;
}

function clearPendingTransition(detail) {
  if (detail?.[HANDLER_KEY]) {
    detail.removeEventListener('transitionend', detail[HANDLER_KEY]);
    detail[HANDLER_KEY] = null;
  }

  if (detail?.[TIMER_KEY]) {
    globalThis.clearTimeout(detail[TIMER_KEY]);
    detail[TIMER_KEY] = null;
  }
}

function registerTransitionEnd(detail, propertyName, onComplete, fallbackMs = 520) {
  clearPendingTransition(detail);

  const finish = () => {
    clearPendingTransition(detail);
    onComplete();
  };

  const handler = (event) => {
    if (event?.propertyName !== propertyName) {
      return;
    }

    if (event?.target && event.target !== detail) {
      return;
    }

    finish();
  };

  detail[HANDLER_KEY] = handler;
  detail.addEventListener('transitionend', handler);
  detail[TIMER_KEY] = globalThis.setTimeout(finish, fallbackMs);
  return handler;
}

export function cancelExpandableAnimations(detail) {
  clearPendingFrame(detail);
  clearPendingTransition(detail);
}

export function queueExpandableFrame(detail, callback) {
  clearPendingFrame(detail);

  const frame = getFrameScheduler()(() => {
    if (detail?.[FRAME_KEY] !== frame) {
      return;
    }

    detail[FRAME_KEY] = null;
    callback();
  });

  detail[FRAME_KEY] = frame;
  return frame;
}

export function registerExpandTransitionEnd(detail, isExpanded) {
  return registerTransitionEnd(detail, 'max-height', () => {
    if (isExpanded()) {
      detail.style.maxHeight = 'none';
    }
  });
}

export function registerCollapseTransitionEnd(detail, isCollapsed) {
  return registerTransitionEnd(detail, 'max-height', () => {
    if (isCollapsed()) {
      detail.hidden = true;
    }
  });
}

export function registerHeightTransitionEnd(detail, onComplete) {
  return registerTransitionEnd(detail, 'height', onComplete);
}
