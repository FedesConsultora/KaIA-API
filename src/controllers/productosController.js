// src/controllers/productosController.js
import Producto from '../models/Producto.js';

export const getProductos = async (_req, res) => {
  try {
    const productos = await Producto.findAll();
    res.json(productos);
  } catch (err) {
    console.error('Error al listar productos:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};

export const getProductoById = async (req, res) => {
  const { id } = req.params;
  try {
    const prod = await Producto.findByPk(id);
    if (!prod) {
      return res.status(404).json({ msg: 'No encontrado' });
    }
    res.json(prod);
  } catch (err) {
    console.error(`Error al buscar producto ${id}:`, err);
    res.status(500).json({ msg: 'Error interno' });
  }
};
