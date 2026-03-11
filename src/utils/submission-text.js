import { escapeHtml } from './escape.js';
import {
  cancelExpandableAnimations,
  queueExpandableFrame,
  registerHeightTransitionEnd,
} from './expandable-transition.js';

export const SUBMISSION_TEXT_MAX_LENGTH = 1000;
export const SUBMISSION_TEXT_PREVIEW_LINES = 1;
const SUBMISSION_TEXT_PREVIEW_CHARS = 88;
const SUBMISSION_TEXT_PREVIEW_LINE_LENGTH = 28;
const SUBMISSION_TEXT_SUMMARY_CHARS = 72;

function toFiniteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPreviewLines(value) {
  return Math.max(1, Math.min(3, toFiniteNumber(value, SUBMISSION_TEXT_PREVIEW_LINES)));
}

export function normalizeSubmissionText(raw) {
  if (raw == null) return '';

  return String(raw)
    .replace(/\r\n?/g, '\n')
    .trim();
}

export function hasSubmissionText(raw) {
  return normalizeSubmissionText(raw).length > 0;
}

export function getSubmissionTextMetrics(raw) {
  const text = normalizeSubmissionText(raw);
  if (!text) {
    return {
      text,
      charCount: 0,
      lineCount: 0,
      longestLineLength: 0,
    };
  }

  const lines = text.split('\n');
  return {
    text,
    charCount: text.length,
    lineCount: lines.length,
    longestLineLength: lines.reduce((max, line) => Math.max(max, line.length), 0),
  };
}

export function isSubmissionTextCollapsible(raw, options = {}) {
  const previewLines = clampPreviewLines(options.previewLines);
  const metrics = getSubmissionTextMetrics(raw);

  if (!metrics.charCount) {
    return false;
  }

  return (
    metrics.lineCount > previewLines
    || metrics.charCount > SUBMISSION_TEXT_PREVIEW_CHARS
    || metrics.longestLineLength > SUBMISSION_TEXT_PREVIEW_LINE_LENGTH
  );
}

export function getSubmissionTextPreview(raw, limit = SUBMISSION_TEXT_SUMMARY_CHARS) {
  const text = normalizeSubmissionText(raw);
  if (!text) {
    return '';
  }

  const summary = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' / ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (summary.length <= limit) {
    return summary;
  }

  return `${summary.slice(0, limit).trimEnd()}...`;
}

export function renderSubmissionTextBlock(raw, options = {}) {
  const text = normalizeSubmissionText(raw);
  if (!text) {
    return '';
  }

  const previewLines = clampPreviewLines(options.previewLines);
  const collapsible = isSubmissionTextCollapsible(text, { previewLines });
  const label = options.label || '文字提交';
  const collapsedLabel = options.collapsedLabel || '展开';
  const expandedLabel = options.expandedLabel || '收起';
  const className = options.className ? ` ${options.className}` : '';

  return `
    <section
      class="submission-text-card${className} ${collapsible ? 'is-collapsible' : 'is-inline'}"
      data-submission-text-block
      ${collapsible ? `data-preview-lines="${previewLines}" data-expanded="false"` : ''}
    >
      <div class="submission-text-inline">
        <span class="submission-text-label">${escapeHtml(label)}</span>
        <div class="submission-text-shell" data-submission-text-shell>
          <div class="submission-text-body" data-submission-text-body>${escapeHtml(text)}</div>
        </div>
        ${collapsible ? `
          <button
            class="submission-text-toggle"
            data-submission-text-toggle
            data-collapsed-label="${escapeHtml(collapsedLabel)}"
            data-expanded-label="${escapeHtml(expandedLabel)}"
            aria-expanded="false"
            aria-label="${escapeHtml(collapsedLabel)}"
            title="${escapeHtml(collapsedLabel)}"
            type="button"
          >
            <span class="submission-text-toggle-chevron" aria-hidden="true"></span>
          </button>
        ` : ''}
      </div>
    </section>
  `;
}

export function setupSubmissionTextBlocks(scope = document) {
  const blocks = scope?.matches?.('[data-submission-text-block]')
    ? [scope, ...scope.querySelectorAll('[data-submission-text-block]')]
    : Array.from(scope?.querySelectorAll?.('[data-submission-text-block]') || []);

  blocks.forEach((block) => {
    const shell = block.querySelector('[data-submission-text-shell]');
    const body = block.querySelector('[data-submission-text-body]');
    const toggle = block.querySelector('[data-submission-text-toggle]');

    if (!shell || !body) {
      return;
    }

    if (!toggle) {
      shell.style.height = 'auto';
      return;
    }

    const heights = measureSubmissionTextHeights(block, body);
    if (!heights) {
      return;
    }

    const expanded = block.dataset.expanded === 'true';
    syncSubmissionTextToggle(toggle, expanded);
    shell.style.height = expanded ? 'auto' : `${heights.collapsedHeight}px`;

    if (toggle.dataset.bound === 'true') {
      return;
    }

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleSubmissionTextBlock(block);
    });
    toggle.dataset.bound = 'true';
  });
}

function toggleSubmissionTextBlock(block) {
  const shell = block.querySelector('[data-submission-text-shell]');
  const body = block.querySelector('[data-submission-text-body]');
  const toggle = block.querySelector('[data-submission-text-toggle]');
  if (!shell || !body || !toggle) {
    return;
  }

  const heights = measureSubmissionTextHeights(block, body);
  if (!heights) {
    return;
  }

  cancelExpandableAnimations(shell);

  if (block.dataset.expanded === 'true') {
    shell.style.height = `${shell.offsetHeight || heights.expandedHeight}px`;
    queueExpandableFrame(shell, () => {
      block.dataset.expanded = 'false';
      syncSubmissionTextToggle(toggle, false);
      shell.style.height = `${heights.collapsedHeight}px`;
    });
    return;
  }

  block.dataset.expanded = 'true';
  syncSubmissionTextToggle(toggle, true);
  shell.style.height = `${shell.offsetHeight || heights.collapsedHeight}px`;

  queueExpandableFrame(shell, () => {
    shell.style.height = `${heights.expandedHeight}px`;
  });

  registerHeightTransitionEnd(shell, () => {
    if (block.dataset.expanded === 'true') {
      shell.style.height = 'auto';
    }
  });
}

function syncSubmissionTextToggle(toggle, expanded) {
  const label = expanded
    ? (toggle.dataset.expandedLabel || '收起')
    : (toggle.dataset.collapsedLabel || '展开');

  toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  toggle.setAttribute('aria-label', label);
  toggle.setAttribute('title', label);
}

function measureSubmissionTextHeights(block, body) {
  const lineHeight = getLineHeight(body);
  if (!lineHeight) {
    return null;
  }

  const previousExpanded = block.dataset.expanded;
  block.dataset.expanded = 'true';
  const expandedHeight = body.scrollHeight;

  if (previousExpanded == null) {
    delete block.dataset.expanded;
  } else {
    block.dataset.expanded = previousExpanded;
  }

  if (!expandedHeight) {
    return null;
  }

  return {
    collapsedHeight: Math.ceil(lineHeight + 2),
    expandedHeight,
  };
}

function getLineHeight(element) {
  const computed = globalThis.getComputedStyle?.(element);
  const explicitLineHeight = Number.parseFloat(computed?.lineHeight || '');
  if (Number.isFinite(explicitLineHeight) && explicitLineHeight > 0) {
    return explicitLineHeight;
  }

  const fontSize = Number.parseFloat(computed?.fontSize || '12');
  return fontSize * 1.5;
}
