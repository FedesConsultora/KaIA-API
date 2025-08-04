'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'password', {
      type: Sequelize.STRING,
      allowNull: true, // Por ahora lo dejamos opcional
      after: 'email'   // Opcional: depende del motor si lo respeta
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'password');
  }
};
