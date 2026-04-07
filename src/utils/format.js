// ════════════════════════════════════════
//  Formatting and date utilities
// ════════════════════════════════════════

/** Unique ID: timestamp + random string */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Today as "YYYY-MM-DD" */
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/** Current datetime as "YYYY-MM-DD HH:mm" */
export function nowTimestamp() {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  return `${date} ${time}`;
}

/** Days elapsed since a date string "YYYY-MM-DD" */
export function daysSince(ds) {
  if (!ds) return 0;
  return Math.floor((Date.now() - new Date(ds).getTime()) / 86400000);
}

/** Escape HTML special characters to prevent XSS */
export function esc(s) {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Format a fee number as "1,234,567원" */
export function feeStr(n) {
  return n ? n.toLocaleString() + '원' : '';
}

/**
 * Escape a CSV field: wrap in quotes, double any internal quotes.
 * Required to prevent corrupt CSV when fields contain commas or newlines.
 */
export function csvField(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
