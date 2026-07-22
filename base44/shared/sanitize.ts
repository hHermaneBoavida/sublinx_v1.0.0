/**
 * Shared sanitization helpers for untrusted user input.
 */

/**
 * Neutralizes CSV formula injection by prefixing cells that start with
 * a formula-triggering character (=, +, -, @) with a single quote.
 */
export function csvCell(value) {
  let s = String(value ?? '');
  const trimmed = s.trim();
  if (/^[=+\-@]/.test(trimmed)) {
    s = "'" + s;
  }
  return s;
}

/**
 * Sanitizes a string before interpolating it into an LLM prompt:
 * strips line breaks and delimiter-breakout characters so the value
 * cannot escape its context or inject new instructions.
 */
export function sanitizeForPrompt(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;')
    .replace(/[\r\n\t]/g, ' ')
    .trim();
}

/**
 * Wraps untrusted user input in a delimited block and labels it,
 * so the model can be told to treat the content strictly as data.
 */
export function wrapUntrusted(label, value) {
  const s = sanitizeForPrompt(value);
  return `<untrusted_data label="${label}">${s}</untrusted_data>`;
}