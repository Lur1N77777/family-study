export function registerExpandTransitionEnd(detail, isExpanded) {
  const handler = (event) => {
    if (event?.propertyName !== 'max-height') {
      return;
    }

    if (isExpanded()) {
      detail.style.maxHeight = 'none';
    }

    detail.removeEventListener('transitionend', handler);
  };

  detail.addEventListener('transitionend', handler);
  return handler;
}

export function registerCollapseTransitionEnd(detail, isCollapsed) {
  const handler = (event) => {
    if (event?.propertyName !== 'max-height') {
      return;
    }

    if (isCollapsed()) {
      detail.hidden = true;
    }

    detail.removeEventListener('transitionend', handler);
  };

  detail.addEventListener('transitionend', handler);
  return handler;
}
