// src/models/Producto.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Producto = sequelize.define('Producto', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_articulo:   { type: DataTypes.STRING, unique: true, allowNull: true }, // código KronenVet
  nombre:        { type: DataTypes.STRING, allowNull: false },
  costo:         { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  precio:        { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  presentacion:  { type: DataTypes.STRING, allowNull: true },
  proveedor:     { type: DataTypes.STRING, allowNull: true },
  marca:         { type: DataTypes.STRING, allowNull: true },
  rubro:         { type: DataTypes.STRING, allowNull: true },
  familia:       { type: DataTypes.STRING, allowNull: true },
  debaja:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  cantidad:      { type: DataTypes.INTEGER, allowNull: true },
  stockMin:      { type: DataTypes.INTEGER, allowNull: true },
  stockMax:      { type: DataTypes.INTEGER, allowNull: true },
  codBarras:     { type: DataTypes.STRING, allowNull: true },
  observaciones: { type: DataTypes.TEXT, allowNull: true },
  visible:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'productos',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false,
  indexes: [{ fields: ['nombre', 'presentacion', 'marca'] }]
});
