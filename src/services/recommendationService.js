// src/services/recommendationService.js
import { Op } from 'sequelize';
import { Producto, Promocion } from '../models/index.js';

const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

const LIKE_FIELDS = ['nombre', 'presentacion', 'marca', 'rubro', 'familia', 'observaciones'];

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
 * Enriquecida con señales de GPT:
 * opts.gpt = { must:[], should:[], negate:[] }
 */
export async function recomendarDesdeBBDD(termRaw = '', opts = {}) {
  const term = (termRaw || '').trim();
  const gpt = opts.gpt || { must: [], should: [], negate: [] };

  if (!term && (!gpt.must.length && !gpt.should.length)) {
    return { validos: [], top: null, similares: [] };
  }

  // Construcción de "candidatos" por LIKE (amplio) con tokens de must/should + palabras del texto
  const baseTokens = norm(term).split(/\s+/).filter(Boolean);
  const tokens = Array.from(new Set([
    ...baseTokens,
    ...gpt.must,
    ...gpt.should
  ])).filter(Boolean);

  const likeOr = [];
  for (const f of LIKE_FIELDS) for (const t of tokens) likeOr.push({ [f]: { [Op.like]: `%${t}%` } });

  const candidatos = await Producto.findAll({
    where: {
      visible: true,
      debaja: false,
      ...(likeOr.length ? { [Op.or]: likeOr } : { id: { [Op.gt]: 0 } })
    },
    include: [{ model: Promocion, attributes: ['nombre'], required: false }],
    limit: 100,
  });

  if (!candidatos.length) {
    console.log(`[RECO] no-db-matches term="${term}" gpt=${JSON.stringify(gpt)}`);
    return { validos: [], top: null, similares: [] };
  }

  // Post-filtro de relevancia REAL con pesos y exclusiones
  const neg = new Set((gpt.negate || []).map(norm));

  const scored = candidatos
    .map((p) => {
      const H = norm([p.nombre, p.presentacion, p.marca, p.rubro, p.familia, p.observaciones]
        .filter(Boolean).join(' | '));

      // "must": todos deben aparecer
      for (const m of gpt.must || []) {
        if (m && !H.includes(norm(m))) return null;
      }

      // "negate": si aparece alguno, descartamos
      for (const n of neg) {
        if (n && H.includes(n)) return null;
      }

      // scoring
      let s = 0;
      // Match general por tokens
      for (const t of tokens) {
        if (!t) continue;
        const nt = norm(t);
        if (H.includes(nt)) s += 2;
        if (nt && norm(p.nombre).startsWith(nt)) s += 1;
      }
      // Boost si match en observaciones (compuesto activo)
      for (const t of [...(gpt.must||[]), ...(gpt.should||[])]) {
        const nt = norm(t);
        if (p.observaciones && norm(p.observaciones).includes(nt)) s += 1.5;
      }
      // Leve sesgo por disponibilidad
      s += (Number(p.cantidad) || 0) / 1000;

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
  const similares = scored.slice(3, 6).map(toGPTProduct);

  return { validos, top, similares };
}
