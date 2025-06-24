export const getPromosByProducto = (req, res) => {
  const { id } = req.params;

  // Simulación: solo el producto 1 tiene promos activas
  if (id === '1') {
    return res.json([
      {
        id: 1,
        nombre: "Promo 2x1",
        tipo: "2x1",
        fin: "2025-07-31"
      },
      {
        id: 2,
        nombre: "Regalo por 5 unidades",
        tipo: "regalo",
        fin: "2025-08-15"
      }
    ]);
  }

  // Otros productos no tienen promos activas
  return res.json([]);
};
