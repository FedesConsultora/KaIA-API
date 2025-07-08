// src/models/Promocion.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Promocion = sequelize.define('Promocion', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:           { type: DataTypes.STRING, allowNull: false },
  tipo:             { type: DataTypes.STRING, allowNull: true },
  detalle:          { type: DataTypes.TEXT, allowNull: true },
  regalo:           { type: DataTypes.TEXT, allowNull: true },
  presentacion:     { type: DataTypes.STRING, allowNull: true },
  especie:          { type: DataTypes.STRING, allowNull: true },
  laboratorio:      { type: DataTypes.STRING, allowNull: true },
  productos_txt:    { type: DataTypes.TEXT, allowNull: true }, 
  stock_disponible: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  vigencia_desde:   { type: DataTypes.DATE, allowNull: true },
  vigencia_hasta:   { type: DataTypes.DATE, allowNull: true },
  vigente:          { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'promociones',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false
});