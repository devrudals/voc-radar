/**
 * Security sanitization module: Prevents DOM XSS and CSV injection
 */

/**
 * Escapes HTML characters to prevent XSS attacks in client-side rendering.
 * @param {string} str 
 * @returns {string} Sanitized string safe for HTML insertion
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes strings for CSV export to prevent spreadsheet formula injection (=, +, -, @).
 * @param {string} str 
 * @returns {string} Sanitized CSV cell value
 */
export function sanitizeCSVCell(str) {
  if (typeof str !== 'string') return '""';
  let cleaned = str.trim();
  // If cell starts with dangerous formula triggers, prepend a single quote
  if (/^[=\+\-@\t\r]/.test(cleaned)) {
    cleaned = "'" + cleaned;
  }
  // Escape internal double quotes by doubling them
  return `"${cleaned.replace(/"/g, '""')}"`;
}

/**
 * Strips HTML tags from input string while preserving line breaks.
 * @param {string} html 
 * @returns {string} Clean plain text
 */
export function stripHTML(html) {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}
