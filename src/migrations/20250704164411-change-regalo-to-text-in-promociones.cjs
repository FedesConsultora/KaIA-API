'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // agrandamos “regalo” a TEXT
    await queryInterface.changeColumn('promociones', 'regalo', {
      type     : Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // revertimos a VARCHAR(255)
    await queryInterface.changeColumn('promociones', 'regalo', {
      type     : Sequelize.STRING,
      allowNull: true
    });

  }
};
