// src/models/Producto.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     Producto:
 *       type: object
 *       required: [id, nombre]
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: "IverPro 6 mg"
 *         compuesto:
 *           type: string
 *           example: "Ivermectina"
 *         descripcion:
 *           type: string
 *           example: "Antiparasitario de amplio espectro..."
 *         precio:
 *           type: string
 *           example: "1234.50"
 *         stock:
 *           type: integer
 *           example: 25
 *         promo:
 *           type: string
 *           example: "2x1"
 */
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
