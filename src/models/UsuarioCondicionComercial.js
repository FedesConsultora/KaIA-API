// src/models/UsuarioCondicionComercial.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const UsuarioCondicionComercial = sequelize.define('UsuarioCondicionComercial', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    condicionId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    vigente_desde: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'vigente_desde'
    },
    vigente_hasta: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'vigente_hasta'
    },
    es_principal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'es_principal'
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'usuarios_condiciones_comerciales',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: false,
    indexes: [
        { fields: ['usuarioId', 'condicionId'], unique: true },
        { fields: ['usuarioId', 'vigente_desde', 'vigente_hasta'] }
    ]
});
