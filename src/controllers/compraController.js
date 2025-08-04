import { Compra, Producto, Promocion } from '../models/index.js';

export const registrarCompra = async (req, res) => {
  const { productoId, qty, promo_aplicada = null } = req.body;
  const { user } = req;

  try {
    const producto = await Producto.findByPk(productoId);
    if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });

    const precio_unit = producto.precio;
    const subtotal = precio_unit * qty;

    const nueva = await Compra.create({
      usuarioId: user.id,
      productoId,
      qty,
      precio_unit,
      subtotal,
      promo_aplicada
    });

    res.status(201).json({ msg: 'Compra registrada', data: nueva });
  } catch (err) {
    console.error('Error al registrar compra:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};

export const listarMisCompras = async (req, res) => {
  const { user } = req;
  try {
    const compras = await Compra.findAll({
      where: { usuarioId: user.id },
      include: [
        { model: Producto },
        { model: Promocion, required: false }
      ],
      order: [['fecha', 'DESC']]
    });

    res.json(compras);
  } catch (err) {
    console.error('Error al listar compras:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};
