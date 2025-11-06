// src/services/recommendationService.js
// ----------------------------------------------------
import { Op } from 'sequelize';
import { Producto, Promocion } from '../models/index.js';

const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

const LIKE_FIELDS = ['nombre', 'presentacion', 'marca', 'rubro', 'familia', 'observaciones'];

// Sinónimos / typos frecuentes (extendible)
const SYNONYMS = new Map([
  ['biogenes', ['biogenesis', 'bagó', 'bago', 'biogenesis bago', 'biogenesis bagó']],
  ['biogenesis bago', ['biogenes', 'bago', 'bagó']],
  ['brouwer', ['laboratorios brouwer']],
  ['fatro', ['fatro von franken', 'von franken', 'fatrovonfranken']],
  ['pipetas', ['pipeta', 'spot on', 'tópico', 'topico']],
  ['antiparasitario', ['antiparasitarias', 'pulgas', 'garrapatas']]
]);

function expandWithSynonyms(tokens = []) {
  const out = new Set(tokens.map(norm));
  for (const t of tokens) {
    const k = norm(t);
    if (SYNONYMS.has(k)) SYNONYMS.get(k).forEach(v => out.add(norm(v)));
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

/** Buscar por término + señales gpt { must, should, negate } */
export async function recomendarDesdeBBDD(termRaw = '', opts = {}) {
  const term = (termRaw || '').trim();
  const gpt = opts.gpt || { must: [], should: [], negate: [] };

  if (!term && (!gpt.must.length && !gpt.should.length)) {
    return { validos: [], top: null, similares: [] };
  }

  const baseTokens = norm(term).split(/\s+/).filter(Boolean);
  const tokensRaw = Array.from(new Set([
    ...baseTokens,
    ...(gpt.must || []),
    ...(gpt.should || [])
  ]));
  const tokens = expandWithSynonyms(tokensRaw);

  const likeOr = [];
  for (const f of LIKE_FIELDS) for (const t of tokens) likeOr.push({ [f]: { [Op.like]: `%${t}%` } });

  const candidatos = await Producto.findAll({
    where: {
      visible: true,
      debaja: false,
      ...(likeOr.length ? { [Op.or]: likeOr } : { id: { [Op.gt]: 0 } })
    },
    include: [{ model: Promocion, attributes: ['nombre'], required: false }],
    limit: 120,
  });

  if (!candidatos.length) {
    console.log(`[RECO] no-db-matches term="${term}" gpt=${JSON.stringify(gpt)}`);
    return { validos: [], top: null, similares: [] };
  }

  const neg = new Set((gpt.negate || []).map(norm));

  const scored = candidatos
    .map((p) => {
      const H = norm([p.nombre, p.presentacion, p.marca, p.rubro, p.familia, p.observaciones]
        .filter(Boolean).join(' | '));

      // must
      for (const m of (gpt.must || [])) if (m && !H.includes(norm(m))) return null;
      // negate
      for (const n of neg) if (n && H.includes(n)) return null;

      // scoring
      let s = 0;
      for (const t of tokens) {
        if (!t) continue;
        if (H.includes(t)) s += 2.2;
        if (p.nombre && norm(p.nombre).startsWith(t)) s += 1.3;
        if (p.marca && norm(p.marca).includes(t)) s += 1.6;   // boost marca
      }
      if (p.observaciones) {
        for (const t of [...(gpt.must || []), ...(gpt.should || [])]) {
          const nt = norm(t);
          if (nt && norm(p.observaciones).includes(nt)) s += 1.2;
        }
      }
      s += (Number(p.cantidad) || 0) / 800;          // disponibilidad
      if (p.Promocions?.length) s += 1.5;           // tener promo ayuda
      if (p.precio) s += 0.3;                        // precio visible

      return { p, s };
    })
    .filter(Boolean)
    .sort((a, b) => b.s - a.s)
    .map(x => x.p);

  if (!scored.length) {
    console.log(`[RECO] no-relevant-hits term="${term}" gpt=${JSON.stringify(gpt)}`);
    return { validos: [], top: null, similares: [] };
  }

  const validos = scored.slice(0, 3).map(toGPTProduct);
  const top = validos[0] || null;
  const similares = scored.slice(3, 9).map(toGPTProduct); // más similares por si piden "ver más"

  return { validos, top, similares };
}

/** Helper para listar similares por IDs (para el botón "ver más") */
export async function fetchProductsByIds(ids = []) {
  if (!ids?.length) return [];
  const rows = await Producto.findAll({
    where: { id: { [Op.in]: ids } },
    include: [{ model: Promocion, attributes: ['nombre'], required: false }],
    order: [['nombre', 'ASC']]
  });
  return rows.map(toGPTProduct);
}