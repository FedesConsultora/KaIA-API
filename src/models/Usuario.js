// src/models/Usuario.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';


/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required: [id, phone]
 *       properties:
 *         id:
 *           type: integer
 *           example: 7
 *         nombre:
 *           type: string
 *           example: "Carolina Giménez"
 *         phone:
 *           type: string
 *           example: "5492215551234"
 *         role:
 *           type: string
 *           example: "vet"
 */
const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING,
    unique: true
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'vet'
  }
});

export default Usuario;
export async function createUsuario(nombre, phone, role = 'vet') {
  return await Usuario.create({ nombre, phone, role });
}