'use strict';

module.exports = {
  up: async (qi, S) => {
    await qi.createTable('cuentas_corrientes', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },

      usuarioId: {
        type: S.INTEGER,
        allowNull: true,                 // ← ahora admite NULL
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      saldo:   { type: S.DECIMAL(10,2), allowNull: false, defaultValue: 0.00 },
      credito: { type: S.DECIMAL(10,2), allowNull: false, defaultValue: 0.00 },
      actualizado_en: {
        type: S.DATE,
        allowNull: false,
        defaultValue: S.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (qi) => {
    await qi.dropTable('cuentas_corrientes');
  }
};
