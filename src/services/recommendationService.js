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

function logDiversity(tag, arr = []) {
  const weights = new Set();
  const packs = new Set();
  const brands = new Set();
  const forms = new Set();
  for (const p of arr) {
    const txt = norm(`${p.nombre} ${p.presentacion} ${p.rubro} ${p.familia} ${p.observaciones||''}`);
    const w = (txt.match(/\b(\d+(?:[.,]\d+)?)\s*(?:a|-|–|hasta)\s*(\d+(?:[.,]\d+)?)\s*kg\b/i) ||
               txt.match(/hasta\s*(\d+(?:[.,]\d+)?)\s*kg\b/i) ||
               txt.match(/\b(\d+(?:[.,]\d+)?)\s*kg\b/i)) ? 'peso' : null;
    if (w) weights.add('peso');

    const mPack = txt.match(/\bx\s*(\d{1,2})\b/i);
    if (mPack) packs.add(`x${mPack[1]}`);

    if (/\bpipet|spot[- ]?on|t[oó]pico\b/i.test(txt)) forms.add('pipeta');
    else if (/\bcomprimid|tableta|tabs\b/i.test(txt)) forms.add('comprimido');
    else if (/\binyect\b/i.test(txt)) forms.add('inyectable');

    if (p.marca) brands.add(norm(p.marca));
  }
  console.log(`[RECO][STATS] ${tag} :: candidatos=${arr.length} | marcas=${brands.size} | formas=${forms.size} | packs=${packs.size} | pesos=${weights.size}`);
}

/**
 * Recomienda desde BBDD con apoyo opcional de tokens GPT y señales ricas.
 * @param {string} termRaw
 * @param {{ gpt?: { must?: string[], should?: string[], negate?: string[] }, signals?: object }} opts
 */
export async function recomendarDesdeBBDD(termRaw = '', opts = {}) {
  const term = (termRaw || '').trim();
  const gpt = opts?.gpt || {};
  const sig = opts?.signals || {};

  const must = Array.from(new Set([
    ...(gpt.must || []).map(norm),
    ...(Array.isArray(sig.actives) ? sig.actives.map(norm) : [])
  ])).filter(Boolean);

  const should = Array.from(new Set([
    ...(gpt.should || []).map(norm),
    ...(sig.species ? [norm(sig.species)] : []),
    ...(sig.form ? [norm(sig.form)] : []),
    ...(Array.isArray(sig.brands) ? sig.brands.map(norm) : []),
    ...(Array.isArray(sig.indications) ? sig.indications.map(norm) : []),
    ...(Array.isArray(sig.packs) ? sig.packs.map(norm) : []),
    ...(sig.weight_hint ? [norm(sig.weight_hint)] : []),
  ])).filter(Boolean);

  const negate = Array.from(new Set([
    ...(gpt.negate || []).map(norm),
    ...(Array.isArray(sig.negatives) ? sig.negatives.map(norm) : [])
  ])).filter(Boolean);

  if (DEBUG) {
    console.log(`[RECO][INPUT] term="${term}" must=${must.length} should=${should.length} negate=${negate.length}`);
  }
  if (!term && !must.length && !should.length) {
    return { validos: [], top: null, similares: [] };
  }
  if (/^main\./i.test(term)) {
    if (DEBUG) console.log(`[RECO][SKIP] term="${term}" reason=main_cmd`);
    return { validos: [], top: null, similares: [] };
  }

  const expanded = expandTerms(term);

  // LIKE dinámico
  const shouldTokens = Array.from(new Set([...expanded, ...should])).filter(Boolean);
  const likeOr = [];
  for (const f of LIKE_FIELDS) {
    for (const t of shouldTokens) likeOr.push({ [f]: { [Op.like]: `%${t}%` } });
  }

  const mustClauses = must.map((t) => ({
    [Op.or]: LIKE_FIELDS.map((f) => ({ [f]: { [Op.like]: `%${t}%` } }))
  }));

  const negateClauses = negate.map((t) => ({
    [Op.and]: LIKE_FIELDS.map((f) => ({ [f]: { [Op.notLike]: `%${t}%` } }))
  }));

  const andClauses = [];
  if (mustClauses.length) andClauses.push(...mustClauses);
  if (negateClauses.length) andClauses.push(...negateClauses);

  const where = {
    visible: true,
    debaja: false,
    ...(likeOr.length ? { [Op.or]: likeOr } : {}),
    ...(andClauses.length ? { [Op.and]: andClauses } : {}),
  };

  if (DEBUG) {
    console.log(`[RECO][SQL] likeOr=${likeOr.length} andClauses=${andClauses.length} (must=${mustClauses.length}, negate=${negateClauses.length})`);
  }

  const candidatos = await Producto.findAll({
    where,
    include: [{ model: Promocion, attributes: ['nombre'], required: false }],
    limit: 120,
  });

  if (DEBUG) console.log(`[RECO][CAND] count=${candidatos.length}`);
  logDiversity('pre-score', candidatos);

  if (!candidatos.length) {
    return { validos: [], top: null, similares: [] };
  }

  // POST-FILTRO + SCORE con pesos para señales ricas
  const tokensForHit = Array.from(new Set([...shouldTokens, ...must])).filter(Boolean);

  const scored = candidatos
    .map((p) => {
      const H = norm([
        p.nombre, p.presentacion, p.marca, p.rubro, p.familia, p.observaciones
      ].filter(Boolean).join(' | '));

      let s = 0;
      let hits = 0;

      // MUST fuerte (activos, etc.)
      for (const t of must) {
        if (t && H.includes(t)) { s += 6; hits++; }
      }
      // SHOULD (consulta + signals generales)
      for (const t of shouldTokens) {
        if (t && H.includes(t)) { s += 2; hits++; }
        if (t && norm(p.nombre).startsWith(t)) s += 1;
      }
      // Negativos
      for (const n of negate) {
        if (n && H.includes(n)) s -= 5;
      }

      // Bonos por señales ricas bien mapeadas
      if (sig.species && H.includes(norm(sig.species))) s += 3;
      if (sig.form && H.includes(norm(sig.form))) s += 3;
      (sig.brands || []).forEach(b => { if (b && H.includes(norm(b))) s += 2; });
      (sig.indications || []).forEach(i => { if (i && H.includes(norm(i))) s += 1; });
      (sig.packs || []).forEach(px => { if (px && H.includes(norm(px))) s += 2; });
      if (sig.weight_hint && H.includes(norm(sig.weight_hint))) s += 3;

      // Disponibilidad leve
      s += (Number(p.cantidad) || 0) / 1000;

      return { p, s, hits, H };
    })
    .filter(x => must.length ? must.some(t => t && x.H.includes(t)) : x.hits > 0)
    .sort((a, b) => b.s - a.s);

  if (!scored.length) {
    return { validos: [], top: null, similares: [] };
  }

  const ordered = scored.map(x => x.p);
  logDiversity('post-score', ordered);

  // Top N para conversación (preferimos 3-4, tope 6)
  const TOP_N = 6;
  const validos = ordered.slice(0, TOP_N).map(toGPTProduct);
  const top = validos[0] || null;
  const similares = ordered.slice(TOP_N, TOP_N + 6).map(toGPTProduct);

  if (DEBUG) console.log(`[RECO][OUT] validos=${validos.length} similares=${similares.length} top="${top?.nombre || '—'}"`);

  return { validos, top, similares };
}
