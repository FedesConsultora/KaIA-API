'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('whatsapp_sessions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      phone: {
        type: Sequelize.STRING(32),
        allowNull: false,
        unique: true
      },
      cuit: {
        type: Sequelize.STRING(11),
        allowNull: true
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'idle'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        // Si querés ON UPDATE automático en MySQL 8:
        // defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('whatsapp_sessions', ['expires_at'], {
      name: 'idx_whatsapp_sessions_expires_at'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('whatsapp_sessions');
  }
};
