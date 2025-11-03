// src/models/WhatsAppSession.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const WhatsAppSession = sequelize.define('WhatsAppSession', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  phone:       { type: DataTypes.STRING(32), allowNull: false, unique: true },
  cuit:        { type: DataTypes.STRING(11), allowNull: true },
  verifiedAt:  { type: DataTypes.DATE, allowNull: true, field: 'verified_at' },
  expiresAt:   { type: DataTypes.DATE, allowNull: true, field: 'expires_at' },
  state:       { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'idle' },
  pending:     { type: DataTypes.JSON, allowNull: true },

  feedbackLastPromptAt:   { type: DataTypes.DATE, allowNull: true, field: 'feedback_last_prompt_at' },
  feedbackLastResponseAt: { type: DataTypes.DATE, allowNull: true, field: 'feedback_last_response_at' }
}, {
  tableName: 'whatsapp_sessions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['phone'], unique: true },
    { fields: ['expires_at'] },
    { fields: ['feedback_last_prompt_at'] },
    { fields: ['feedback_last_response_at'] }
  ]
});

export default WhatsAppSession;