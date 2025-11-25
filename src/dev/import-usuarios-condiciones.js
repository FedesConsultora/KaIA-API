// src/dev/import-usuarios-condiciones.js
/**
 * Script para asignar condiciones comerciales a usuarios desde Excel
 * 
 * Uso:
 *   node src/dev/import-usuarios-condiciones.js ruta/al/excel.xlsx
 */

import xlsx from 'xlsx';
import { Op } from 'sequelize';
import {
    sequelize,
    Usuario,
    CondicionComercial,
    UsuarioCondicionComercial
} from '../models/index.js';

/**
 * Busca un usuario por razón social.
 * Primero intenta match completo, luego por primera palabra.
 */
async function buscarUsuarioPorRazonSocial(razonSocial, transaction) {
    if (!razonSocial) return null;

    const razonClean = razonSocial.trim();

    // Intento 1: Match exacto (case insensitive)
    let usuario = await Usuario.findOne({
        where: {
            nombre: {
                [Op.like]: razonClean
            }
        },
        transaction
    });

    if (usuario) return usuario;

    // Intento 2: Match por primera palabra
    const primeraPalabra = razonClean.split(/\s+/)[0];

    if (primeraPalabra && primeraPalabra.length > 2) {
        usuario = await Usuario.findOne({
            where: {
                nombre: {
                    [Op.like]: `${primeraPalabra}%`
                }
            },
            transaction
        });
    }

    return usuario;
}

async function main() {
    const archivoExcel = process.argv[2];

    if (!archivoExcel) {
        console.error('❌ Uso: node src/dev/import-usuarios-condiciones.js <archivo-excel>');
        process.exit(1);
    }

    console.log(`📂 Leyendo archivo: ${archivoExcel}`);

    let workbook;
    try {
        workbook = xlsx.readFile(archivoExcel);
    } catch (err) {
        console.error(`❌ Error leyendo archivo Excel: ${err.message}`);
        process.exit(1);
    }

    let usuariosAsignados = 0;
    let usuariosNoEncontrados = 0;
    let condicionesNoEncontradas = 0;
    let errores = 0;

    const transaction = await sequelize.transaction();

    try {
        // Procesar todas las hojas (una por ejecutivo)
        for (const sheetName of workbook.SheetNames) {
            // Skip hojas de resumen o especiales
            if (sheetName === '2025' || sheetName.includes('TOTAL') || sheetName.includes('Resumen')) {
                console.log(`⏭️  Saltando hoja "${sheetName}" (resumen)`);
                continue;
            }

            console.log(`\n📊 Procesando hoja: "${sheetName}"`);

            const sheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(sheet);

            console.log(`   Encontradas ${rows.length} filas`);

            let procesados = 0;
            for (const row of rows) {
                // Intentar obtener RAZON SOCIAL de varias formas posibles
                let razonSocial = row['RAZON SOCIAL'] || row.RAZON_SOCIAL || row['RAZÓN SOCIAL'] || row.RAZON || '';

                // Limpiar espacios y convertir a string
                razonSocial = String(razonSocial).trim();

                // Si la razón social está vacía o es un encabezado, skip
                if (!razonSocial || razonSocial === 'RAZON SOCIAL' || razonSocial.length < 2) {
                    continue;
                }

                // Intentar obtener ID de varias formas (puede haber múltiples columnas ID)
                let idDto = row.ID || row.id || row.IDDTO || row.Id || '';
                idDto = String(idDto).trim();

                // Si no hay ID, skip
                if (!idDto || idDto === 'ID' || isNaN(parseInt(idDto))) {
                    console.warn(`⚠️  ID inválido para "${razonSocial}" (ID: "${idDto}")`);
                    continue;
                }

                procesados++;

                // Buscar usuario por razón social
                const usuario = await buscarUsuarioPorRazonSocial(razonSocial, transaction);

                if (!usuario) {
                    console.warn(`⚠️  Usuario no encontrado: "${razonSocial}" (ID condición: ${idDto})`);
                    usuariosNoEncontrados++;
                    continue;
                }

                const codigoCondicion = `COND-${idDto}`;

                // Buscar condición comercial
                const condicion = await CondicionComercial.findOne({
                    where: { codigo: codigoCondicion },
                    transaction
                });

                if (!condicion) {
                    console.warn(`⚠️  Condición "${codigoCondicion}" no encontrada para "${usuario.nombre}"`);
                    condicionesNoEncontradas++;
                    continue;
                }

                // Crear/actualizar asignación
                const [asignacion, created] = await UsuarioCondicionComercial.findOrCreate({
                    where: {
                        usuarioId: usuario.id,
                        condicionId: condicion.id
                    },
                    defaults: {
                        usuarioId: usuario.id,
                        condicionId: condicion.id,
                        vigente_desde: new Date('2025-01-01'),
                        vigente_hasta: null,
                        es_principal: true,
                        notas: `Importado desde Excel - Hoja: ${sheetName}`
                    },
                    transaction
                });

                if (created) {
                    console.log(`✅ ${usuario.nombre} → ${codigoCondicion}`);
                    usuariosAsignados++;
                } else {
                    // Actualizar fecha de vigencia si ya existe
                    await asignacion.update({
                        vigente_desde: new Date('2025-01-01'),
                        es_principal: true
                    }, { transaction });
                    console.log(`🔄 ${usuario.nombre} → ${codigoCondicion} (actualizado)`);
                }
            }

            console.log(`   ✅ Procesadas ${procesados} filas de esta hoja`);
        }

        await transaction.commit();

        console.log('\n═══════════════════════════════════════');
        console.log('✅ IMPORTACIÓN COMPLETADA');
        console.log(`   Usuarios asignados: ${usuariosAsignados}`);
        console.log(`   Usuarios no encontrados: ${usuariosNoEncontrados}`);
        console.log(`   Condiciones no encontradas: ${condicionesNoEncontradas}`);
        console.log(`   Errores: ${errores}`);
        console.log('═══════════════════════════════════════\n');

        if (usuariosNoEncontrados > 0) {
            console.warn(`⚠️  ${usuariosNoEncontrados} usuarios del Excel NO se encontraron en la BD.`);
            console.warn('   Verifica que las razones sociales coincidan con el campo "nombre" de la tabla usuarios.\n');
        }

    } catch (err) {
        await transaction.rollback();
        console.error('❌ Error durante importación:', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

main();