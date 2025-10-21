export default {
  // Comparaciones básicas
  eq: (a, b) => String(a) === String(b),
  ne: (a, b) => String(a) !== String(b),
  lt: (a, b) => Number(a) <  Number(b),
  gt: (a, b) => Number(a) >  Number(b),
  and: (a, b) => !!(a && b),
  or:  (a, b) => !!(a || b),

  // Aritmética / utilitarios
  add: (a, b) => Number(a) + Number(b),
  min: (a, b) => Math.min(Number(a), Number(b)),
  max: (a, b) => Math.max(Number(a), Number(b)),

  // Rango simple 1..N
  range: (start, end) => {
    const s = Number(start), e = Number(end);
    if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return [];
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  },

  // Ventana de paginación centrada (p.ej. 7 botones)
  pageWindow: (page, totalPages, width) => {
    const p = Number(page) || 1;
    const T = Number(totalPages) || 1;
    const W = Math.max(Number(width) || 7, 3); // mínimo ancho 3
    if (T <= W) return Array.from({ length: T }, (_, i) => i + 1);

    const half = Math.floor(W / 2);
    let start = p - half;
    let end   = p + half;

    if (start < 1) { end += (1 - start); start = 1; }
    if (end > T)   { start -= (end - T); end = T; }
    if (start < 1) start = 1;

    const out = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }
};
