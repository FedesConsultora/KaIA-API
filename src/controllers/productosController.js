import Producto from '../models/Producto.js';

export const buscarProductos = async (req, res) => {
  const { term } = req.query;

  if (!term || term.trim() === '') {
    return res.status(400).json({ msg: 'Debés ingresar un término de búsqueda' });
  }

  // Simulación de resultados filtrados
  const productosSimulados = [
    {
      id: 1,
      nombre: "Otoclean Plus",
      compuesto: "gentamicina + corticoide",
      descripcion: "Solución ótica para otitis externa en perros y gatos",
      precio: "1750.00",
      stock: 32,
      promo: "2x1"
    },
    {
      id: 2,
      nombre: "Aurisan Duo",
      compuesto: "enrofloxacina + antifúngico",
      descripcion: "Tratamiento de otitis con componente fúngico",
      precio: "1890.00",
      stock: 18,
      promo: null
    }
  ];

  res.json(productosSimulados);
};

export const getProductoById = async (req, res) => {
  const { id } = req.params;

  if (id === '1') {
    return res.json({
      id: 1,
      nombre: "Otoclean Plus",
      compuesto: "gentamicina + corticoide",
      descripcion: "Solución ótica para otitis externa en perros y gatos",
      precio: "1750.00",
      stock: 32,
      promo: "2x1"
    });
  }

  if (id === '2') {
    return res.json({
      id: 2,
      nombre: "Aurisan Duo",
      compuesto: "enrofloxacina + antifúngico",
      descripcion: "Tratamiento de otitis con componente fúngico",
      precio: "1890.00",
      stock: 18,
      promo: null
    });
  }

  res.status(404).json({ msg: 'Producto no encontrado' });
};
