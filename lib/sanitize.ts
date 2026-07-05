/**
 * XSS-safe rendering guidance:
 *
 * - Prefer JSX text interpolation (`{value}`) for user-generated content.
 *   React auto-escapes HTML in text nodes.
 * - Avoid `dangerouslySetInnerHTML` for user content.
 * - If you must render untrusted HTML, sanitize with DOMPurify first
 *   (`isomorphic-dompurify` for SSR) before passing to dangerouslySetInnerHTML.
 * - Use `escapeHtml` only when assembling HTML/attribute strings manually.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape characters that have special meaning in HTML text/attributes. */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}
