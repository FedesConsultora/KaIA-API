export const sugerirProducto = (req, res) => {
  const { query } = req.body;

  if (!query || query.trim() === '') {
    return res.status(400).json({ msg: 'La consulta no puede estar vacía' });
  }

  // Simulamos lógica de recomendación
  const sugerencias = [];

  // Caso: búsqueda relacionada a "otitis"
  if (query.toLowerCase().includes('otitis') || query.toLowerCase().includes('oído')) {
    sugerencias.push({
      producto: {
        id: 1,
        nombre: "Otoclean Plus",
        compuesto: "gentamicina + corticoide",
        descripcion: "Solución ótica para otitis externa en perros y gatos",
        precio: "1750.00",
        stock: 32
      },
      promo: "2x1",
      qtySugerida: 3
    });

    sugerencias.push({
      producto: {
        id: 2,
        nombre: "Aurisan Duo",
        compuesto: "enrofloxacina + antifúngico",
        descripcion: "Tratamiento de otitis con componente fúngico",
        precio: "1890.00",
        stock: 18
      },
      promo: null,
      qtySugerida: 2
    });
  }

  // Caso genérico si no se detecta nada
  if (sugerencias.length === 0) {
    sugerencias.push({
      producto: {
        id: 99,
        nombre: "Producto genérico",
        compuesto: "composición simulada",
        descripcion: "Producto ejemplo para casos generales",
        precio: "1000.00",
        stock: 20
      },
      promo: null,
      qtySugerida: 1
    });
  }

  res.json({ sugerencias });
};
