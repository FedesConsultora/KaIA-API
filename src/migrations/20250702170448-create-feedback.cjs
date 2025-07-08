'use strict';

module.exports = {
  up: async (qi, S) => {
    await qi.createTable('feedback', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },

      usuarioId: {
        type: S.INTEGER,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      flow_id:    { type: S.STRING },
      satisfecho: { type: S.STRING },
      comentario: { type: S.TEXT },
      creado_en:  { type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') }
    });
  },

  down: async (qi) => {
    await qi.dropTable('feedback');
  }
};
