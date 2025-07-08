'use strict';

module.exports = {
  up: async (qi, S) => {
    await qi.createTable('compras', {
      id:          { type: S.INTEGER, primaryKey: true, autoIncrement: true },

      /* ── FK ─────────────────────────────── */
      usuarioId: {
        type: S.INTEGER,
        allowNull: true,                 // ← debe admitir NULL
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      productoId: {
        type: S.INTEGER,
        allowNull: true,                 // ← debe admitir NULL
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      promo_aplicada: {
        type: S.INTEGER,
        allowNull: true,
        references: { model: 'promociones', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      /* ── Datos de la compra ─────────────── */
      qty:         { type: S.INTEGER,       allowNull: false },
      precio_unit: { type: S.DECIMAL(10,2), allowNull: false },
      subtotal:    { type: S.DECIMAL(10,2), allowNull: false },
      fecha:       { type: S.DATE, allowNull: false,
                     defaultValue: S.literal('CURRENT_TIMESTAMP') }
    });

    await qi.addIndex('compras', ['usuarioId', 'productoId'],
                      { name: 'idx_historial' });
  },

  down: async (qi) => {
    await qi.dropTable('compras');
  }
};
