'use strict';

module.exports = {
  up: async (qi, S) => {
    await qi.createTable('productos_promociones', {
      productoId:  {
        type: S.INTEGER,
        primaryKey: true,
        references: { model: 'productos', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      promocionId: {
        type: S.INTEGER,
        primaryKey: true,
        references: { model: 'promociones', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }
    });
  },

  down: async (qi) => {
    await qi.dropTable('productos_promociones');
  }
};
