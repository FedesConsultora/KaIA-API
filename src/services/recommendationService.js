// src/services/recommendationService.js
import { Op } from 'sequelize';
import { Producto, Promocion } from '../models/index.js';

const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
const scoreHit = (haystack, needle) => haystack.includes(needle) ? 1 : 0;

export function toGPTProduct(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    marca: p.marca || '',
    principio_activo: p.principio_activo || '',
    presentacion: p.presentacion || '',
    uso_principal: p.uso_principal || '',
    precio: p.precio ? Number(p.precio) : null,
    promo: p.Promocions?.[0]
      ? { activa: true, nombre: p.Promocions[0].nombre }
      : { activa: false, nombre: '' }
  };
}

/**
 * Encuentra el top (máx. 1) y hasta 3 similares desde BBDD.
 * Devuelve objetos completos para pasar a GPT (toGPTProduct).
 */
export async function recomendarDesdeBBDD(termRaw = '') {
  const term = norm(termRaw);
  if (!term) return { top: null, similares: [] };

  const like = { [Op.like]: `%${termRaw}%` };
  const candidatos = await Producto.findAll({
    where: {
      visible: true, debaja: false,
      [Op.or]: [
        { nombre: like },
        { presentacion: like },
        { marca: like },
        { principio_activo: like },
        { uso_principal: like }
      ]
    },
    include: {
      model: Promocion,
      attributes: ['nombre', 'vigencia_desde', 'vigencia_hasta'],
      required: false
    },
    limit: 25
  });

  if (!candidatos.length) {
    const similares = await Producto.findAll({
      where: { visible: true, debaja: false },
      order: [['cantidad', 'DESC']],
      limit: 3
    });
    return { top: null, similares: similares.map(toGPTProduct) };
  }

  const tok = term.split(/\s+/).filter(Boolean);
  const scored = candidatos.map(p => {
    const H = [
      norm(p.nombre),
      norm(p.presentacion),
      norm(p.marca),
      norm(p.principio_activo),
      norm(p.uso_principal)
    ].join(' | ');

    let s = 0;
    for (const t of tok) {
      s += scoreHit(H, t) * 2;
      if (norm(p.nombre).startsWith(t)) s += 1;
    }
    s += (Number(p.cantidad) || 0) / 1000;
    return { p, s };
  }).sort((a, b) => b.s - a.s);

  const top = scored[0]?.p || null;
  const similares = scored.slice(1, 4).map(x => x.p);

  return {
    top: top ? toGPTProduct(top) : null,
    similares: similares.map(toGPTProduct)
  };
}
