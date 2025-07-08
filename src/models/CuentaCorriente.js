// src/models/CuentaCorriente.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const CuentaCorriente = sequelize.define('CuentaCorriente', {
  id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  saldo:   { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
  credito: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 }
}, {
  tableName: 'cuentas_corrientes',
  timestamps: true,
  createdAt: false,
  updatedAt: 'actualizado_en'
});

