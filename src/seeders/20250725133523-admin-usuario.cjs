'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const password = await bcrypt.hash('admin1234!', 10);

    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'Administrador General',
        phone: '5491100000000',
        cuit: null,
        email: 'admin@example.com',
        password,
        role: 'admin',
        creado_en: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('usuarios', {
      email: 'admin@example.com'
    }, {});
  }
};
