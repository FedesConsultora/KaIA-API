'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('promociones', 'inicio', 'vigencia_desde');
    await queryInterface.renameColumn('promociones', 'fin', 'vigencia_hasta');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('promociones', 'vigencia_desde', 'inicio');
    await queryInterface.renameColumn('promociones', 'vigencia_hasta', 'fin');
  }
};