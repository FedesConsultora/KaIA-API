// src/models/CuentaCorriente.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';
import Usuario from './Usuario.js';

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
