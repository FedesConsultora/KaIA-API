'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ejecutivos_cuenta', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'telefono' 
    });

    await queryInterface.changeColumn('ejecutivos_cuenta', 'telefono', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ejecutivos_cuenta', 'email');
    await queryInterface.changeColumn('ejecutivos_cuenta', 'telefono', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};
