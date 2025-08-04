import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const EjecutivoCuenta = sequelize.define('EjecutivoCuenta', {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:   { type: DataTypes.STRING, allowNull: false },
  phone:    { type: DataTypes.STRING, unique: true, allowNull: true, field: 'telefono' },
  email:    { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'ejecutivos_cuenta',
  timestamps: false
});