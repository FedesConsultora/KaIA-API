// src/models/Producto.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  compuesto: {
    type: DataTypes.STRING
  },
  descripcion: {
    type: DataTypes.TEXT
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2)
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  promo: {
    type: DataTypes.STRING // texto “2x1”, “15 % off”, etc.
  }
});

export default Producto;
