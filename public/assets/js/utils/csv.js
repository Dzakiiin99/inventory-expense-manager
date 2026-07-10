// utils/csv.js
// Pure CSV utilities (RFC 4180) + browser file download.
// No DOM dependency except downloadFile (guarded for test environments).

/**
 * Escape a single CSV field per RFC 4180:
 * wrap in double-quotes if it contains comma, quote, CR or LF;
 * double any internal quote.
 * @param {*} value
 * @returns {string}
 */
export function escapeCsvField(value) {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/**
 * Build a CSV string from headers + rows (arrays of values).
 * Adds a UTF-8 BOM so Excel reads UTF-8 correctly.
 * @param {string[]} headers
 * @param {Array<Array<*>>} rows
 * @returns {string}
 */
export function arrayToCsv(headers, rows) {
  const lines = [headers.map(escapeCsvField).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(','));
  }
  return '﻿' + lines.join('\r\n');
}

/**
 * Parse CSV text into an array of row-arrays.
 * Handles quoted fields, embedded commas/quotes/newlines.
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsv(text) {
  if (text && text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip UTF-8 BOM
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    } else {
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += c; i++; continue;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  // drop a trailing blank line produced by a final newline
  const last = rows[rows.length - 1];
  if (last && last.length === 1 && last[0] === '') rows.pop();
  return rows;
}

/**
 * Trigger a client-side file download (browser only).
 * @param {string} filename
 * @param {string} content
 * @param {string} [mime]
 */
export function downloadFile(filename, content, mime = 'text/csv;charset=utf-8') {
  if (typeof document === 'undefined' || typeof Blob === 'undefined') return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
