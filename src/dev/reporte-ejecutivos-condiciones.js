// src/dev/reporte-ejecutivos-condiciones.js
/**
 * Genera un reporte completo de:
 * 1. Usuarios del Excel que NO se encontraron en la BD
 * 2. Resumen por Ejecutivo: sus clientes y condiciones asignadas
 * 
 * Uso:
 *   node src/dev/reporte-ejecutivos-condiciones.js ruta/al/excel.xlsx
 */

import xlsx from 'xlsx';
import fs from 'fs';
import { Op } from 'sequelize';
import {
    sequelize,
    Usuario,
    EjecutivoCuenta,
    CondicionComercial,
    UsuarioCondicionComercial
} from '../models/index.js';

async function buscarUsuarioPorRazonSocial(razonSocial) {
    if (!razonSocial) return null;

    const razonClean = razonSocial.trim();

    // Intento 1: Match exacto
    let usuario = await Usuario.findOne({
        where: { nombre: { [Op.like]: razonClean } }
    });

    if (usuario) return usuario;

    // Intento 2: Match por primera palabra
    const primeraPalabra = razonClean.split(/\s+/)[0];
    if (primeraPalabra && primeraPalabra.length > 2) {
        usuario = await Usuario.findOne({
            where: { nombre: { [Op.like]: `${primeraPalabra}%` } }
        });
    }

    return usuario;
}

async function main() {
    const archivoExcel = process.argv[2];

    if (!archivoExcel) {
        console.error('❌ Uso: node src/dev/reporte-ejecutivos-condiciones.js <archivo-excel>');
        process.exit(1);
    }

    console.log(`📂 Leyendo archivo: ${archivoExcel}`);

    const workbook = xlsx.readFile(archivoExcel);
    const usuariosNoEncontrados = [];

    // 1. Buscar usuarios no encontrados
    console.log('\n🔍 Buscando usuarios no encontrados...\n');

    for (const sheetName of workbook.SheetNames) {
        if (sheetName === '2025' || sheetName.includes('TOTAL') || sheetName.includes('Resumen')) {
            continue;
        }

        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet);

        for (const row of rows) {
            let razonSocial = row['RAZON SOCIAL'] || row.RAZON_SOCIAL || row['RAZÓN SOCIAL'] || row.RAZON || '';
            razonSocial = String(razonSocial).trim();

            if (!razonSocial || razonSocial === 'RAZON SOCIAL' || razonSocial.length < 2) {
                continue;
            }

            let idDto = row.ID || row.id || row.IDDTO || row.Id || '';
            idDto = String(idDto).trim();

            if (!idDto || idDto === 'ID' || isNaN(parseInt(idDto))) {
                continue;
            }

            const usuario = await buscarUsuarioPorRazonSocial(razonSocial);

            if (!usuario) {
                usuariosNoEncontrados.push({
                    razonSocial,
                    condicionId: `COND-${idDto}`,
                    hoja: sheetName
                });
            }
        }
    }

    // 2. Obtener resumen por ejecutivo
    console.log('📊 Generando resumen por ejecutivo...\n');

    const ejecutivos = await EjecutivoCuenta.findAll({
        include: [{
            model: Usuario,
            required: false,
            include: [{
                model: CondicionComercial,
                through: UsuarioCondicionComercial,
                required: false
            }]
        }],
        order: [['nombre', 'ASC']]
    });

    // 3. Generar reporte
    let reporte = '# REPORTE DE EJECUTIVOS Y CONDICIONES COMERCIALES\n\n';
    reporte += `Generado: ${new Date().toLocaleString('es-AR')}\n\n`;
    reporte += '---\n\n';

    // Usuarios no encontrados
    reporte += `## 🔴 USUARIOS NO ENCONTRADOS EN LA BD (${usuariosNoEncontrados.length})\n\n`;

    if (usuariosNoEncontrados.length > 0) {
        reporte += '| Razón Social | Condición | Hoja |\n';
        reporte += '|---|---|---|\n';
        usuariosNoEncontrados.forEach(u => {
            reporte += `| ${u.razonSocial} | ${u.condicionId} | ${u.hoja} |\n`;
        });
    } else {
        reporte += '✅ Todos los usuarios del Excel fueron encontrados.\n';
    }

    reporte += '\n---\n\n';

    // Resumen por ejecutivo
    reporte += `## 👥 RESUMEN POR EJECUTIVO\n\n`;

    for (const ejecutivo of ejecutivos) {
        const clientes = ejecutivo.Usuarios || [];

        reporte += `### ${ejecutivo.nombre}\n`;
        reporte += `- **Email:** ${ejecutivo.email || 'N/A'}\n`;
        reporte += `- **Teléfono:** ${ejecutivo.phone || 'N/A'}\n`;
        reporte += `- **Total Clientes:** ${clientes.length}\n\n`;

        if (clientes.length > 0) {
            // Agrupar por condición
            const porCondicion = {};
            const sinCondicion = [];

            clientes.forEach(cliente => {
                const condiciones = cliente.CondicionComercials || [];
                if (condiciones.length > 0) {
                    condiciones.forEach(cond => {
                        if (!porCondicion[cond.codigo]) {
                            porCondicion[cond.codigo] = {
                                nombre: cond.nombre,
                                clientes: []
                            };
                        }
                        porCondicion[cond.codigo].clientes.push(cliente.nombre);
                    });
                } else {
                    sinCondicion.push(cliente.nombre);
                }
            });

            // Mostrar por condición
            const condiciones = Object.keys(porCondicion).sort();
            if (condiciones.length > 0) {
                reporte += '**Clientes con condiciones:**\n\n';
                condiciones.forEach(codigo => {
                    const info = porCondicion[codigo];
                    reporte += `- **${codigo}** (${info.nombre}): ${info.clientes.length} cliente(s)\n`;
                    info.clientes.forEach(nombre => {
                        reporte += `  - ${nombre}\n`;
                    });
                });
                reporte += '\n';
            }

            // Mostrar sin condición
            if (sinCondicion.length > 0) {
                reporte += `**Clientes SIN condición:** ${sinCondicion.length}\n\n`;
                sinCondicion.forEach(nombre => {
                    reporte += `- ${nombre}\n`;
                });
                reporte += '\n';
            }
        } else {
            reporte += '*Sin clientes asignados*\n\n';
        }

        reporte += '---\n\n';
    }

    // Guardar reporte
    const rutaReporte = 'src/dev/reporte-ejecutivos.md';
    fs.writeFileSync(rutaReporte, reporte, 'utf-8');

    console.log('✅ Reporte generado exitosamente');
    console.log(`📄 Archivo: ${rutaReporte}`);
    console.log(`\n📊 Resumen:`);
    console.log(`   - Usuarios no encontrados: ${usuariosNoEncontrados.length}`);
    console.log(`   - Ejecutivos: ${ejecutivos.length}`);
    console.log(`   - Total clientes en BD: ${ejecutivos.reduce((sum, e) => sum + (e.Usuarios?.length || 0), 0)}`);

    await sequelize.close();
}

main().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
