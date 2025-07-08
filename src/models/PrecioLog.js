// src/models/PrecioLog.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const PrecioLog = sequelize.define('PrecioLog', {
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  precio_anterior: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  nuevo_precio:    { type: DataTypes.DECIMAL(10,2), allowNull: false },
  motivo:          { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'precios_log',
  timestamps: true,
  createdAt: 'cambiado_en',
  updatedAt: false
});

