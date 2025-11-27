// src/migrations/YYYYMMDDHHMMSS-add-codigo-producto-to-reglas.cjs
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('condicion_comercial_reglas', 'codigoProducto', {
            type: Sequelize.STRING,
            allowNull: true,
            comment: 'Código del artículo en KronenVet (id_articulo)',
            after: 'productoId'
        });

        await queryInterface.addIndex('condicion_comercial_reglas', ['codigoProducto'], {
            name: 'condicion_comercial_reglas_codigo_producto'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex('condicion_comercial_reglas', 'condicion_comercial_reglas_codigo_producto');
        await queryInterface.removeColumn('condicion_comercial_reglas', 'codigoProducto');
    }
};
