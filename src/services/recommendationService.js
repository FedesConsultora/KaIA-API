// src/services/recommendationService.js
import { Op } from 'sequelize';
import { Producto, Promocion } from '../models/index.js';

const DEBUG = process.env.DEBUG_RECO === '1';

const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

const SYN = {
  pipetas: ['pipeta', 'pipetas', 'spot on', 'spot-on', 'antiparasitario', 'antiparasitarios'],
  gatos: ['gato', 'gatos', 'felino', 'felinos'],
  perros: ['perro', 'perros', 'canino', 'caninos'],
  condroprotectores: [
    'condroprotector', 'condroprotectores',
    'glucosamina', 'sulfato de condroitina', 'condroitina',
    'hialuronato', 'ácido hialurónico', 'hialuronico', 'msm',
    'perna canaliculus', 'cartilago', 'cartílago'
  ],
};

const LIKE_FIELDS = ['nombre', 'presentacion', 'marca', 'rubro', 'familia', 'observaciones'];

function expandTerms(raw) {
  const toks = norm(raw).split(/\s+/).filter(Boolean);
  const out = new Set(toks);
  for (const t of toks) {
    for (const [k, arr] of Object.entries(SYN)) {
      if (k === t || arr.includes(t)) arr.forEach((x) => out.add(x));
    }
  }
  return Array.from(out);
}

export function toGPTProduct(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    marca: p.marca || '',
    presentacion: p.presentacion || '',
    precio: p.precio ? Number(p.precio) : null,
    rubro: p.rubro || '',
    familia: p.familia || '',
    promo: p.Promocions?.[0]
      ? { activa: true, nombre: p.Promocions[0].nombre }
      : { activa: false, nombre: '' },
  };
}

/**
 * Recomienda desde BBDD con apoyo opcional de tokens GPT.
 * @param {string} termRaw
 * @param {{ gpt?: { must?: string[], should?: string[], negate?: string[] } }} opts
 */
export async function recomendarDesdeBBDD(termRaw = '', opts = {}) {
  const term = (termRaw || '').trim();
  const gpt = opts?.gpt || {};
  const must = Array.from(new Set((gpt.must || []).map(norm))).filter(Boolean);
  const should = Array.from(new Set((gpt.should || []).map(norm))).filter(Boolean);
  const negate = Array.from(new Set((gpt.negate || []).map(norm))).filter(Boolean);

  if (DEBUG) {
    console.log(`[RECO][INPUT] term="${term}" must=${must.length} should=${should.length} negate=${negate.length}`);
  }
  if (!term && !must.length && !should.length) {
    return { validos: [], top: null, similares: [] };
  }

  // Tokens base por query libre (sinónimos)
  const expanded = expandTerms(term);

  // --- WHERE dinámico ---
  // shouldLike: OR de LIKE por (expanded + should)
  const shouldTokens = Array.from(new Set([...expanded, ...should])).filter(Boolean);
  const likeOr = [];
  for (const f of LIKE_FIELDS) {
    for (const t of shouldTokens) likeOr.push({ [f]: { [Op.like]: `%${t}%` } });
  }

  // mustClauses: AND de (OR campos LIKE %token%)
  const mustClauses = must.map((t) => ({
    [Op.or]: LIKE_FIELDS.map((f) => ({ [f]: { [Op.like]: `%${t}%` } }))
  }));

  // negateClauses: AND de (todos los campos NOT LIKE %token%)
  const negateClauses = negate.map((t) => ({
    [Op.and]: LIKE_FIELDS.map((f) => ({ [f]: { [Op.notLike]: `%${t}%` } }))
  }));

  const where = {
    visible: true,
    debaja: false,
    ...(mustClauses.length ? { [Op.and]: mustClauses } : {}),
    ...(negateClauses.length ? { [Op.and]: [...(where?.[Op?.and] || []), ...negateClauses] } : {}),
    ...(likeOr.length ? { [Op.or]: likeOr } : {}),
  };

  if (DEBUG) {
    console.log(`[RECO][SQL] likeOr=${likeOr.length} mustAND=${mustClauses.length} negateAND=${negateClauses.length}`);
  }

  const candidatos = await Producto.findAll({
    where,
    include: [{ model: Promocion, attributes: ['nombre'], required: false }],
    limit: 80,
  });

  if (DEBUG) console.log(`[RECO][CAND] count=${candidatos.length}`);

  if (!candidatos.length) {
    return { validos: [], top: null, similares: [] };
  }

  // --- POST-FILTRO + SCORE ---
  const tokensForHit = Array.from(new Set([...shouldTokens, ...must])).filter(Boolean);

  const scored = candidatos
    .map((p) => {
      const H = norm([
        p.nombre, p.presentacion, p.marca, p.rubro, p.familia, p.observaciones
      ].filter(Boolean).join(' | '));

      let s = 0;
      let hits = 0;

      // MUST pesa fuerte (si vino por GPT)
      for (const t of must) {
        if (t && H.includes(t)) { s += 6; hits++; }
      }
      // SHOULD (incluye expanded query base)
      for (const t of shouldTokens) {
        if (t && H.includes(t)) { s += 2; hits++; }
        if (t && norm(p.nombre).startsWith(t)) s += 1;
      }
      // Penaliza si aparece algo negado
      for (const n of negate) {
        if (n && H.includes(n)) s -= 5;
      }
      // Disponibilidad leve
      s += (Number(p.cantidad) || 0) / 1000;

      return { p, s, hits, H };
    })
    // Si hay MUST, exigimos que haya al menos una coincidencia con MUST
    .filter(x => must.length ? must.some(t => t && x.H.includes(t)) : x.hits > 0)
    .sort((a, b) => b.s - a.s);

  if (DEBUG) {
    const topName = scored[0]?.p?.nombre || '—';
    console.log(`[RECO][POST] relevant=${scored.length} top="${topName}"`);
    // Muestra breve de causas
    for (const row of scored.slice(0, 3)) {
      const matched = tokensForHit.filter(t => row.H.includes(t));
      if (matched.length) console.log(`  • "${row.p.nombre}" ↦ +${row.s.toFixed(2)} hit=[${matched.join(', ')}]`);
    }
  }

  if (!scored.length) {
    return { validos: [], top: null, similares: [] };
  }

  const ordered = scored.map(x => x.p);
  const validos = ordered.slice(0, 3).map(toGPTProduct);
  const top = validos[0] || null;
  const similares = ordered.slice(3, 9).map(toGPTProduct);

  return { validos, top, similares };
}
