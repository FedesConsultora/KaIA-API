// Promocion.js
const Promocion = sequelize.define('Promocion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:     DataTypes.STRING,
  descripcion:DataTypes.TEXT,
  tipo:       DataTypes.STRING,   // '2x1', '%off', 'regalo', etc.
  inicio:     DataTypes.DATE,
  fin:        DataTypes.DATE
});

// ProductoPromocion.js (tabla puente)
Producto.belongsToMany(Promocion, { through: 'ProductoPromocion' });
Promocion.belongsToMany(Producto, { through: 'ProductoPromocion' });

// Compra.js
const Compra = sequelize.define('Compra', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  qty:        DataTypes.INTEGER,
  precio_unit:DataTypes.DECIMAL(10,2)
});
Usuario.hasMany(Compra); Compra.belongsTo(Usuario);
Producto.hasMany(Compra); Compra.belongsTo(Producto);
