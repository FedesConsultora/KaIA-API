// src/models/CondicionComercial.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const CondicionComercial = sequelize.define('CondicionComercial', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    codigo: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    vigencia_desde: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'vigencia_desde'
    },
    vigencia_hasta: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'vigencia_hasta'
    },
    meta: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'condiciones_comerciales',
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: false,
    indexes: [
        { fields: ['codigo'], unique: true }
    ]
});
