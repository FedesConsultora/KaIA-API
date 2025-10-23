// src/models/WhatsAppSession.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const WhatsAppSession = sequelize.define('WhatsAppSession', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  phone:       { type: DataTypes.STRING(32), allowNull: false, unique: true },
  cuit:        { type: DataTypes.STRING(11), allowNull: true },
  verifiedAt:  { type: DataTypes.DATE, allowNull: true },
  expiresAt:   { type: DataTypes.DATE, allowNull: true },
  state:       { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'idle' },
  pending:     { type: DataTypes.JSON, allowNull: true }
}, {
  tableName: 'whatsapp_sessions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['phone'], unique: true },
    { fields: ['expiresAt'] }
  ]
});

export default WhatsAppSession;
