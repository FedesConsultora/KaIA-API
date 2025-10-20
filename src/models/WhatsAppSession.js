import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const WhatsAppSession = sequelize.define('WhatsAppSession', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  phone:       { type: DataTypes.STRING(32), allowNull: false, unique: true }, // ej: "54911xxxxxxxx"
  cuit:        { type: DataTypes.STRING(11), allowNull: true },                // 11 dígitos normalizados
  verifiedAt:  { type: DataTypes.DATE, allowNull: true },
  expiresAt:   { type: DataTypes.DATE, allowNull: true },
  state:       { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'idle' } 
  // 'idle' | 'awaiting_cuit' (por si pedimos el CUIT y esperamos respuesta)
}, {
  tableName: 'whatsapp_sessions',
  underscored: true,
  timestamps: true,      // created_at / updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['phone'], unique: true },
    { fields: ['expiresAt'] }
  ]
});

export default WhatsAppSession;
