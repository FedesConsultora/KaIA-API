'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('condiciones_comerciales', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            codigo: {
                type: Sequelize.STRING,
                unique: true,
                allowNull: false,
                comment: 'Código único, ej: COND-19, COND-21'
            },
            nombre: {
                type: Sequelize.STRING,
                allowNull: false,
                comment: 'Nombre descriptivo de la condición'
            },
            descripcion: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Descripción completa con detalles de descuentos'
            },
            vigencia_desde: {
                type: Sequelize.DATE,
                allowNull: true
            },
            vigencia_hasta: {
                type: Sequelize.DATE,
                allowNull: true
            },
            meta: {
                type: Sequelize.JSON,
                allowNull: true,
                comment: 'Metadata adicional (mínimos, condiciones especiales, etc.)'
            },
            creado_en: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('condiciones_comerciales', ['codigo'], {
            name: 'idx_condiciones_codigo'
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('condiciones_comerciales');
    }
};
