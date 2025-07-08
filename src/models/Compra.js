// src/models/Compra.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Compra = sequelize.define('Compra', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  qty:         { type: DataTypes.INTEGER, allowNull: false },
  precio_unit: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  subtotal:    { type: DataTypes.DECIMAL(10,2), allowNull: false }
}, {
  tableName: 'compras',
  timestamps: true,
  createdAt: 'fecha',
  updatedAt: false,
  indexes: [{ fields: ['usuarioId', 'productoId'] }]
});

