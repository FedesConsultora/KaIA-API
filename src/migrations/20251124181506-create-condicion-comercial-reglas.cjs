'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('condicion_comercial_reglas', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            condicionId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'condiciones_comerciales',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            rubro: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'Ej: FARMACIA, ALIMENTO, CORDERO'
            },
            familia: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'Ej: ANTIPARASITARIOS, VACUNAS'
            },
            marca: {
                type: Sequelize.STRING,
                allowNull: true,
                comment: 'Ej: BAYER, MERIAL'
            },
            productoId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'productos',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
                comment: 'Si está seteado, aplica solo a este producto específico'
            },
            descuento: {
                type: Sequelize.DECIMAL(5, 4),
                allowNull: false,
                comment: 'Descuento en decimal, ej: 0.1500 = 15%'
            },
            creado_en: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Índice compuesto para búsquedas eficientes de matching
        await queryInterface.addIndex('condicion_comercial_reglas',
            ['condicionId', 'rubro', 'familia', 'marca', 'productoId'],
            {
                name: 'idx_condicion_reglas_match'
            }
        );

        // Índice por producto para búsquedas inversas
        await queryInterface.addIndex('condicion_comercial_reglas', ['productoId'], {
            name: 'idx_reglas_producto'
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('condicion_comercial_reglas');
    }
};
