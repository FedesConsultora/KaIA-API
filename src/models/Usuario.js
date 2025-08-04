// src/models/Usuario.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Usuario = sequelize.define('Usuario', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:    { type: DataTypes.STRING, allowNull: true },
  phone:     { type: DataTypes.STRING, unique: true, allowNull: true }, // WhatsApp
  cuit:      { type: DataTypes.STRING, unique: true, allowNull: true },   // autenticación
  email:     { type: DataTypes.STRING, unique: true, allowNull: true },
  password:  { type: DataTypes.STRING, allowNull: true },
  role:      { type: DataTypes.STRING, allowNull: false, defaultValue: 'vet' },
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false
});
