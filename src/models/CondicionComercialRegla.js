// src/models/CondicionComercialRegla.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const CondicionComercialRegla = sequelize.define('CondicionComercialRegla', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    condicionId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rubro: {
        type: DataTypes.STRING,
        allowNull: true
    },
    familia: {
        type: DataTypes.STRING,
        allowNull: true
    },
    marca: {
        type: DataTypes.STRING,
        allowNull: true
    },
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'DEPRECATED: Usar codigoProducto en su lugar'
    },
    codigoProducto: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Código del artículo en KronenVet (id_articulo)'
    },
    descuento: {
        type: DataTypes.DECIMAL(5, 4),
        allowNull: false
    }
}, {
    tableName: 'condicion_comercial_reglas',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: false,
    indexes: [
        { fields: ['condicionId', 'rubro', 'familia', 'marca'] },
        { fields: ['productoId'] },
        { fields: ['codigoProducto'] }
    ]
});
