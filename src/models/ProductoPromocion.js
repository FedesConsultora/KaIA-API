// src/models/ProductoPromocion.js  (tabla puente M:N)
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const ProductoPromocion = sequelize.define('ProductoPromocion', {
  productoId:  { type: DataTypes.INTEGER, primaryKey: true },
  promocionId: { type: DataTypes.INTEGER, primaryKey: true }
}, {
  tableName: 'productos_promociones',
  timestamps: false
});
