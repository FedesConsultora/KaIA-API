import { Op } from 'sequelize';
import { Producto, Promocion } from '../models/index.js';

/**
 * Devuelve un string en formato Markdown con los productos
 * que “podrían” matchear la consulta del veterinario.
 *
 * - term: texto crudo del usuario (ej.: “otitis”, “ivermectina”)
 * - max  : cuántas líneas incluir (para no gastar tokens)
 */
export async function buildCatalogContext(term = '', max = 5) {
  const hoy = new Date();

  const whereBase = { visible: true, debaja: false };
  const whereTerm = term
    ? {
        [Op.or]: [
          { nombre      : { [Op.like]: `%${term}%` } },
          { presentacion: { [Op.like]: `%${term}%` } },
          { marca       : { [Op.like]: `%${term}%` } }
        ]
      }
    : {};

  const productos = await Producto.findAll({
    where   : { ...whereBase, ...whereTerm },
    include : {
      model    : Promocion,
      attributes: ['nombre'],
      where    : {
        vigencia_desde: { [Op.lte]: hoy },
        vigencia_hasta: { [Op.gte]: hoy }
      },
      required: false
    },
    order   : [['cantidad', 'DESC']],   
    limit   : max
  });

  if (!productos.length) return '';   // sin contexto extra

  return productos
    .map(p => {
      const promo = p.Promocions?.[0]?.nombre
        ? ` │ Promo: ${p.Promocions[0].nombre}`
        : '';
      const precio = p.precio ? ` │ Precio: $${Number(p.precio).toFixed(0)}` : '';
      return `- ${p.nombre}${precio}${promo}`;
    })
    .join('\n');
}
