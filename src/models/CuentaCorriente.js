// src/models/CuentaCorriente.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';
import Usuario from './Usuario.js';


/**
 * @swagger
 * components:
 *   schemas:
 *     CuentaCorriente:
 *       type: object
 *       required: [id, saldo, credito, usuarioId]
 *       properties:
 *         id:
 *           type: integer
 *           example: 3
 *         saldo:
 *           type: string
 *           example: "7320.50"
 *         credito:
 *           type: string
 *           example: "1200.00"
 *         usuarioId:
 *           type: integer
 *           example: 7
 */
const CuentaCorriente = sequelize.define('CuentaCorriente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  saldo: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  credito: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  }
});

// Relaciones
Usuario.hasOne(CuentaCorriente, { foreignKey: 'usuarioId' });
CuentaCorriente.belongsTo(Usuario, { foreignKey: 'usuarioId' });

export default CuentaCorriente;
