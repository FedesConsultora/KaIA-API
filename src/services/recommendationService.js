// src/services/recommendationService.js
import { Op } from 'sequelize';
import { Producto, Promocion } from '../models/index.js';

const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

const SYN = {
  pipetas: ['pipeta', 'pipetas', 'spot on', 'spot-on', 'antiparasitario', 'antiparasitarios'],
  gatos: ['gato', 'gatos', 'felino', 'felinos'],
  perros: ['perro', 'perros', 'canino', 'caninos'],
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

export async function recomendarDesdeBBDD(termRaw = '') {
  const term = (termRaw || '').trim();
  if (!term) return { top: null, similares: [] };

  const expanded = expandTerms(term);
  const likeOr = [];
  for (const f of LIKE_FIELDS) for (const t of expanded) likeOr.push({ [f]: { [Op.like]: `%${t}%` } });

  const candidatos = await Producto.findAll({
    where: { visible: true, debaja: false, [Op.or]: likeOr.length ? likeOr : [{ id: { [Op.gt]: 0 } }] },
    include: [{ model: Promocion, attributes: ['nombre'], required: false }],
    limit: 25,
  });

  if (!candidatos.length) {
    const similares = await Producto.findAll({
      where: { visible: true, debaja: false },
      order: [['cantidad', 'DESC']],
      limit: 3,
    });
    return { top: null, similares: similares.map(toGPTProduct) };
  }

  const tokens = expanded;
  const scored = candidatos
    .map((p) => {
      const H = norm([p.nombre, p.presentacion, p.marca, p.rubro, p.familia, p.observaciones].filter(Boolean).join(' | '));
      let s = 0;
      for (const t of tokens) {
        if (H.includes(t)) s += 2;
        if (norm(p.nombre).startsWith(t)) s += 1;
      }
      s += (Number(p.cantidad) || 0) / 1000; // leve sesgo a disponibilidad
      return { p, s };
    })
    .sort((a, b) => b.s - a.s);

  const top = scored[0]?.p || null;
  const similares = scored.slice(1, 4).map((x) => x.p);

  return { top: top ? toGPTProduct(top) : null, similares: similares.map(toGPTProduct) };
}
