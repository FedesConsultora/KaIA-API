'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Cambiar phone para permitir null
    await queryInterface.changeColumn('usuarios', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir a NOT NULL (lo original)
    await queryInterface.changeColumn('usuarios', 'phone', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  }
};
