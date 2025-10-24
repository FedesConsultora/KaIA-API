// src/models/Feedback.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Feedback = sequelize.define('Feedback', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuarioId:   { type: DataTypes.INTEGER, allowNull: true },           // ya está en la migración
  phone:       { type: DataTypes.STRING(32), allowNull: true },        // para mapear conversaciones WA
  cuit:        { type: DataTypes.STRING(11), allowNull: true },
  flow_id:     { type: DataTypes.STRING, allowNull: true },            // ej: 'feedback_inactive'
  satisfecho:  { type: DataTypes.STRING, allowNull: true },            // 'ok' | 'meh' | 'txt'
  comentario:  { type: DataTypes.TEXT, allowNull: true },
  origen:      { type: DataTypes.STRING, allowNull: true, defaultValue: 'whatsapp' } // canal
}, {
  tableName: 'feedback',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false,
  indexes: [{ fields: ['phone'] }, { fields: ['cuit'] }, { fields: ['flow_id'] }]
});
