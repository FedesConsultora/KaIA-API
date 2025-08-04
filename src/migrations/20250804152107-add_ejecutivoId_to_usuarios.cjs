'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'ejecutivoId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'ejecutivos_cuenta',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'ejecutivoId');
  }
};
