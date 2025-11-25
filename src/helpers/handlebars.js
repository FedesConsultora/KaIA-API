// src/helpers/handlebars.js
export default {
  /* ─── Comparaciones ─── */
  eq: (a, b) => String(a) === String(b),
  ne: (a, b) => String(a) !== String(b),
  lt: (a, b) => Number(a) < Number(b),
  gt: (a, b) => Number(a) > Number(b),
  and: (a, b) => !!(a && b),
  or: (a, b) => !!(a || b),

  /* ─── Aritmética / utilitarios ─── */
  add: (a, b) => Number(a) + Number(b),
  subtract: (a, b) => Number(a) - Number(b),
  min: (a, b) => Math.min(Number(a), Number(b)),
  max: (a, b) => Math.max(Number(a), Number(b)),

  /* Incrementos simples para paginación */
  inc: (v) => Number(v) + 1,
  dec: (v) => Number(v) - 1,

  /* Construye un array literal para #each (p.ej. (array 10 25 50 100 200)) */
  array: (...args) => {
    // Handlebars pasa el hash/metadata en el último arg
    const real = args.slice(0, -1);
    return real;
  },

  /* Rango 1..N para #each */
  range: (start, end) => {
    const s = Number(start), e = Number(end);
    if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return [];
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  },

  /* Ventana centrada de páginas (si más adelante la querés usar) */
  pageWindow: (page, totalPages, width) => {
    const p = Number(page) || 1;
    const T = Number(totalPages) || 1;
    const W = Math.max(Number(width) || 7, 3);
    if (T <= W) return Array.from({ length: T }, (_, i) => i + 1);

    const half = Math.floor(W / 2);
    let start = p - half;
    let end = p + half;

    if (start < 1) { end += (1 - start); start = 1; }
    if (end > T) { start -= (end - T); end = T; }
    if (start < 1) start = 1;

    const out = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  },

  includes: (arr, val) => {
    if (!arr) return false;
    if (!Array.isArray(arr)) return false;
    const needle = String(val);
    return arr.some(x => String(x?.id ?? x) === needle);
  },

  /* ─── Formateo de fechas ─── */
  formatDate: (date) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatDateInput: (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    // Formato YYYY-MM-DD para input type="date"
    return d.toISOString().split('T')[0];
  },

  /* ─── Formateo de porcentajes ─── */
  formatPercent: (decimal) => {
    if (!decimal) return '0';
    const num = Number(decimal);
    if (isNaN(num)) return '0';
    return (num * 100).toFixed(2);
  },

  /* ─── String utils ─── */
  substring: (str, start, end) => {
    if (!str) return '';
    return String(str).substring(Number(start) || 0, Number(end));
  }
};

