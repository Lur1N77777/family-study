import { describe, expect, it } from 'vitest';
import {
  registerCollapseTransitionEnd,
  registerExpandTransitionEnd,
} from '../src/utils/expandable-transition.js';

describe('expandable transition helpers', () => {
  it('waits for the max-height transition before unlocking expanded content', () => {
    const detail = createMockDetail();
    detail.style.maxHeight = '128px';

    registerExpandTransitionEnd(detail, () => true);

    detail.emit('transitionend', { propertyName: 'opacity' });
    expect(detail.style.maxHeight).toBe('128px');
    expect(detail.hasListener('transitionend')).toBe(true);

    detail.emit('transitionend', { propertyName: 'max-height' });
    expect(detail.style.maxHeight).toBe('none');
    expect(detail.hasListener('transitionend')).toBe(false);
  });

  it('waits for the max-height transition before hiding collapsed content', () => {
    const detail = createMockDetail();

    registerCollapseTransitionEnd(detail, () => true);

    detail.emit('transitionend', { propertyName: 'transform' });
    expect(detail.hidden).toBe(false);
    expect(detail.hasListener('transitionend')).toBe(true);

    detail.emit('transitionend', { propertyName: 'max-height' });
    expect(detail.hidden).toBe(true);
    expect(detail.hasListener('transitionend')).toBe(false);
  });
});

function createMockDetail() {
  const listeners = new Map();

  return {
    hidden: false,
    style: {},
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    removeEventListener(type, handler) {
      if (listeners.get(type) === handler) {
        listeners.delete(type);
      }
    },
    emit(type, event) {
      const handler = listeners.get(type);
      if (handler) {
        handler(event);
      }
    },
    hasListener(type) {
      return listeners.has(type);
    },
  };
}
