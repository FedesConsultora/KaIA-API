import { Op } from 'sequelize';
import { Producto, Promocion } from '../models/index.js'; 
export const getPromosByProducto = async (req, res) => {
  const { id } = req.params;

  const prod = await Producto.findByPk(id, {
    include: {
      model: Promocion,
      where: {
        vigente: true,
        vigencia_desde: { [Op.lte]: new Date() },
        vigencia_hasta: { [Op.gte]: new Date() }
      },
      required: false,
      through: { attributes: [] }
    }
  });

  if (!prod) return res.status(404).json({ msg: 'Producto no encontrado' });
  res.json(prod.Promocions);
};
