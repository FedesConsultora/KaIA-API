'use strict';

module.exports = {
  up: async (qi, S) => {
    await qi.createTable('precios_log', {
      id:              { type: S.INTEGER, primaryKey: true, autoIncrement: true },

      productoId: {
        type: S.INTEGER,
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      cambiado_por: {
        type: S.INTEGER,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      precio_anterior: { type: S.DECIMAL(10,2), allowNull: false },
      nuevo_precio:    { type: S.DECIMAL(10,2), allowNull: false },
      motivo:          { type: S.TEXT },
      cambiado_en:     { type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') }
    });
  },

  down: async (qi) => {
    await qi.dropTable('precios_log');
  }
};

