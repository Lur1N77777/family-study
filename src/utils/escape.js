// HTML 转义工具 - 防止 XSS 攻击

/**
 * 转义 HTML 特殊字符，防止 XSS 攻击
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
export function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}
