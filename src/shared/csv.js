'use strict';
/** CSV helpers shared by main (file export) and renderer (previews). */
function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
/** headers: string[]; rows: arrays (positional) or objects (keyed by header). UTF-8 BOM for Excel/Arabic. */
function toCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  for (const r of rows) lines.push(headers.map((h, i) => csvEscape(Array.isArray(r) ? r[i] : r[h])).join(','));
  return '﻿' + lines.join('\r\n') + '\r\n';
}
module.exports = { csvEscape, toCsv };
