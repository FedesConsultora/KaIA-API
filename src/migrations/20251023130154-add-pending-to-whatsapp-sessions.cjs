'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'whatsapp_sessions';
    const col   = 'pending';

    // Verificar esquema actual para evitar errores si ya existe
    const desc = await queryInterface.describeTable(table);

    if (!desc[col]) {
      // MySQL 5.7+ y Postgres soportan JSON sin drama
      await queryInterface.addColumn(table, col, {
        type: Sequelize.JSON,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const table = 'whatsapp_sessions';
    const col   = 'pending';

    // Remover sólo si existe (idempotente)
    const desc = await queryInterface.describeTable(table);
    if (desc[col]) {
      await queryInterface.removeColumn(table, col);
    }
  }
};
