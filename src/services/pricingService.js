// src/services/pricingService.js
import { Op } from 'sequelize';
import {
    Usuario,
    CondicionComercial,
    CondicionComercialRegla
} from '../models/index.js';

/**
 * Obtiene el mejor descuento aplicable para un producto dado un usuario.
 * 
 * @param {number} usuarioId - ID del usuario
 * @param {Object} producto - Objeto producto con id, rubro, familia, marca
 * @returns {Promise<{descuento: number, origen: string|null, reglaAplicada: Object|null}>}
 */
export async function getDescuentoParaProducto({ usuarioId, producto }) {
    if (!usuarioId || !producto) {
        return { descuento: 0, origen: null, reglaAplicada: null };
    }

    const hoy = new Date();

    // Buscar usuario con sus condiciones comerciales vigentes
    const usuario = await Usuario.findByPk(usuarioId, {
        include: [{
            model: CondicionComercial,
            required: false,
            through: {
                where: {
                    [Op.and]: [
                        // vigente_desde <= hoy O es null
                        {
                            [Op.or]: [
                                { vigente_desde: null },
                                { vigente_desde: { [Op.lte]: hoy } }
                            ]
                        },
                        // vigente_hasta >= hoy O es null
                        {
                            [Op.or]: [
                                { vigente_hasta: null },
                                { vigente_hasta: { [Op.gte]: hoy } }
                            ]
                        }
                    ]
                }
            },
            include: [{
                model: CondicionComercialRegla,
                required: false
            }]
        }]
    });

    if (!usuario || !usuario.CondicionComercials || usuario.CondicionComercials.length === 0) {
        return { descuento: 0, origen: null, reglaAplicada: null };
    }

    // Aplanar todas las reglas de todas las condiciones del usuario
    const todasLasReglas = usuario.CondicionComercials.flatMap(
        condicion => condicion.CondicionComercialReglas || []
    );

    if (todasLasReglas.length === 0) {
        return { descuento: 0, origen: null, reglaAplicada: null };
    }

    // Normalizar datos del producto para matching case-insensitive
    const prodRubro = (producto.rubro || '').toUpperCase().trim();
    const prodFamilia = (producto.familia || '').toUpperCase().trim();
    const prodMarca = (producto.marca || '').toUpperCase().trim();
    const prodId = producto.id;

    let mejorDescuento = 0;
    let mejorRegla = null;

    // Evaluar cada regla y encontrar el mejor match
    for (const regla of todasLasReglas) {
        const descuentoRegla = Number(regla.descuento) || 0;

        // Prioridad 1: Match por productoId específico (más específico)
        if (regla.productoId && prodId && regla.productoId === prodId) {
            if (descuentoRegla > mejorDescuento) {
                mejorDescuento = descuentoRegla;
                mejorRegla = regla;
            }
            continue;
        }

        // Para reglas generales, verificar match en rubro/familia/marca
        const reglaRubro = (regla.rubro || '').toUpperCase().trim();
        const reglaFamilia = (regla.familia || '').toUpperCase().trim();
        const reglaMarca = (regla.marca || '').toUpperCase().trim();

        let match = true;

        // Si la regla especifica rubro, debe coincidir
        if (reglaRubro && reglaRubro !== prodRubro) {
            match = false;
        }

        // Si la regla especifica familia, debe coincidir
        if (match && reglaFamilia && reglaFamilia !== prodFamilia) {
            match = false;
        }

        // Si la regla especifica marca, debe coincidir
        if (match && reglaMarca && reglaMarca !== prodMarca) {
            match = false;
        }

        // Si no especifica nada (rubro, familia, marca, productoId), no aplica
        if (!reglaRubro && !reglaFamilia && !reglaMarca && !regla.productoId) {
            match = false;
        }

        if (match && descuentoRegla > mejorDescuento) {
            mejorDescuento = descuentoRegla;
            mejorRegla = regla;
        }
    }

    return {
        descuento: mejorDescuento,
        origen: mejorDescuento > 0 ? 'condicion_comercial' : null,
        reglaAplicada: mejorRegla ? {
            id: mejorRegla.id,
            rubro: mejorRegla.rubro,
            familia: mejorRegla.familia,
            marca: mejorRegla.marca,
            productoId: mejorRegla.productoId
        } : null
    };
}

/**
 * Aplica un descuento al precio de lista.
 * 
 * @param {number} precioLista - Precio sin descuento
 * @param {number} descuento - Descuento en decimal (ej: 0.15 = 15%)
 * @returns {number} Precio con descuento aplicado
 */
export function aplicarDescuento(precioLista, descuento) {
    const precio = Number(precioLista) || 0;
    const desc = Number(descuento) || 0;

    if (desc <= 0 || desc > 1) {
        return precio;
    }

    return precio * (1 - desc);
}

/**
 * Obtiene todas las condiciones comerciales vigentes de un usuario.
 * 
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Array>} Lista de condiciones comerciales con sus reglas
 */
export async function getCondicionesUsuario(usuarioId) {
    if (!usuarioId) {
        return [];
    }

    const hoy = new Date();

    const usuario = await Usuario.findByPk(usuarioId, {
        include: [{
            model: CondicionComercial,
            required: false,
            through: {
                where: {
                    [Op.and]: [
                        { [Op.or]: [{ vigente_desde: null }, { vigente_desde: { [Op.lte]: hoy } }] },
                        { [Op.or]: [{ vigente_hasta: null }, { vigente_hasta: { [Op.gte]: hoy } }] }
                    ]
                }
            },
            include: [{
                model: CondicionComercialRegla,
                required: false
            }]
        }]
    });

    return usuario?.CondicionComercials || [];
}

/**
 * Calcula precio con descuento para mostrar en respuestas del bot.
 * 
 * @param {Object} producto - Producto con precio
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<{precioLista: number, precioFinal: number, descuento: number, ahorro: number}>}
 */
export async function calcularPrecioConDescuento({ producto, usuarioId }) {
    const precioLista = Number(producto.precio) || 0;

    if (!usuarioId || precioLista === 0) {
        return {
            precioLista,
            precioFinal: precioLista,
            descuento: 0,
            ahorro: 0
        };
    }

    const { descuento } = await getDescuentoParaProducto({ usuarioId, producto });
    const precioFinal = aplicarDescuento(precioLista, descuento);
    const ahorro = precioLista - precioFinal;

    return {
        precioLista,
        precioFinal,
        descuento,
        ahorro
    };
}
