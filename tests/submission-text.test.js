import { describe, expect, it } from 'vitest';

import {
  getSubmissionTextMetrics,
  getSubmissionTextPreview,
  isSubmissionTextCollapsible,
  normalizeSubmissionText,
  renderSubmissionTextBlock,
} from '../src/utils/submission-text.js';

describe('submission text helpers', () => {
  it('normalizes line endings and trims surrounding whitespace', () => {
    expect(normalizeSubmissionText('  line one\r\nline two  ')).toBe('line one\nline two');
  });

  it('keeps short text inline', () => {
    expect(isSubmissionTextCollapsible('Read and noted.')).toBe(false);
  });

  it('collapses text when lines or length exceed the preview threshold', () => {
    expect(isSubmissionTextCollapsible('line one\nline two\nline three\nline four')).toBe(true);
    expect(isSubmissionTextCollapsible('a'.repeat(96))).toBe(true);
  });

  it('reports metrics for persisted submission text', () => {
    expect(getSubmissionTextMetrics('ab\ncd')).toEqual({
      text: 'ab\ncd',
      charCount: 5,
      lineCount: 2,
      longestLineLength: 2,
    });
  });

  it('builds a one-line preview from multiline content', () => {
    expect(getSubmissionTextPreview('  line one \n\n line two  ')).toBe('line one / line two');
    expect(getSubmissionTextPreview('abcdefghijklmnopqrstuvwxyz', 10)).toBe('abcdefghij...');
  });

  it('renders collapsible content as a compact summary row with hidden detail', () => {
    const html = withMockDocument(() => renderSubmissionTextBlock('line one\nline two\nline three\nline four'));

    expect(html).toContain('submission-text-toggle');
    expect(html).toContain('submission-text-inline');
    expect(html).toContain('data-submission-text-body');
    expect(html).toContain('aria-expanded="false"');
  });

  it('renders short content inline without a toggle', () => {
    const html = withMockDocument(() => renderSubmissionTextBlock('Short note.', { label: '说明' }));

    expect(html).toContain('submission-text-inline');
    expect(html).not.toContain('data-submission-text-toggle');
  });
});

function withMockDocument(run) {
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement() {
      return createEscaperElement();
    },
  };

  try {
    return run();
  } finally {
    if (previousDocument) {
      globalThis.document = previousDocument;
    } else {
      delete globalThis.document;
    }
  }
}

function createEscaperElement() {
  return {
    _text: '',
    innerHTML: '',
    set textContent(value) {
      this._text = String(value);
      this.innerHTML = this._text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    get textContent() {
      return this._text;
    },
  };
}
