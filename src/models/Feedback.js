// src/models/Feedback.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Feedback = sequelize.define('Feedback', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  flow_id:    { type: DataTypes.STRING, allowNull: true },
  satisfecho: { type: DataTypes.STRING, allowNull: true },
  comentario: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'feedback',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false
});

