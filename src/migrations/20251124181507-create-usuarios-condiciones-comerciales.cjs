'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('usuarios_condiciones_comerciales', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            usuarioId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'usuarios',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
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
            vigente_desde: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Fecha desde la cual aplica esta condición al usuario'
            },
            vigente_hasta: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Fecha hasta la cual aplica, NULL = indefinido'
            },
            es_principal: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
                comment: 'Si es la condición principal del usuario (solo una puede serlo)'
            },
            notas: {
                type: Sequelize.TEXT,
                allowNull: true,
                comment: 'Notas adicionales sobre la asignación'
            },
            creado_en: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Índice para búsquedas por usuario
        await queryInterface.addIndex('usuarios_condiciones_comerciales',
            ['usuarioId', 'condicionId'],
            {
                name: 'idx_usuarios_condiciones',
                unique: true
            }
        );

        // Índice para filtrar por vigencia
        await queryInterface.addIndex('usuarios_condiciones_comerciales',
            ['usuarioId', 'vigente_desde', 'vigente_hasta'],
            {
                name: 'idx_usuarios_condiciones_vigencia'
            }
        );
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable('usuarios_condiciones_comerciales');
    }
};
