// src/dev/import-condiciones-comerciales.js
/**
 * Script para importar condiciones comerciales desde Excel "Plantillas" (IDDTO + DESCRIPCION)
 * 
 * Uso:
 *   node src/dev/import-condiciones-comerciales.js ruta/al/excel.xlsx
 */

import xlsx from 'xlsx';
import {
    sequelize,
    CondicionComercial,
    CondicionComercialRegla
} from '../models/index.js';

// Normalizar nombres de rubros
const RUBRO_ALIASES = {
    'FARM': 'FARMACIA',
    'ALM': 'ALIMENTO',
    'ALI': 'ALIMENTO',
    'ALIM': 'ALIMENTO',
    'COR': 'CORDERO',
    'CORD': 'CORDERO'
};

function normalizarRubro(texto) {
    const upper = (texto || '').toUpperCase().trim();
    return RUBRO_ALIASES[upper] || upper;
}

/**
 * Parsea la descripción de una condición para extraer reglas de descuento.
 * 
 * Ejemplos:
 *   "FARMACIA 15% - ALIMENTO 20%"
 *   → [{rubro: 'FARMACIA', descuento: 0.15}, {rubro: 'ALIMENTO', descuento: 0.20}]
 *   
 *   "FARM. 8% - ALM 9.09% - CORDERO MyG 23%"
 *   → [{rubro: 'FARMACIA', descuento: 0.08}, {rubro: 'ALIMENTO', descuento: 0.0909}, {rubro: 'CORDERO', descuento: 0.23}]
 */
function parsearDescripcion(descripcion) {
    if (!descripcion) return [];

    const reglas = [];

    // Pattern: captura palabras clave + porcentaje
    // Ej: "FARMACIA 15%" o "ALM 9.09%" o "CORDERO MyG 23%"
    const regex = /([A-Z\.]+(?:\s+[A-Z\.&]+)*)\s+(\d+(?:\.\d+)?)\s*%/gi;

    let match;
    while ((match = regex.exec(descripcion)) !== null) {
        const rubroRaw = match[1].trim();
        const porcentaje = parseFloat(match[2]);

        if (isNaN(porcentaje) || porcentaje === 0) continue;

        // Detectar si es "LISTA" = precio de lista (0% descuento), skip
        if (/LISTA/i.test(rubroRaw)) continue;

        // Extraer el rubro base (primera palabra antes de "LISTA", "TODA", "MyG", etc.)
        const palabrasPrincipales = rubroRaw.split(/\s+/);
        let rubroBase = palabrasPrincipales[0].replace(/\./g, '');

        // Normalizar
        rubroBase = normalizarRubro(rubroBase);

        if (!rubroBase) continue;

        reglas.push({
            rubro: rubroBase,
            descuento: porcentaje / 100 // Convertir a decimal
        });
    }

    return reglas;
}

async function main() {
    const archivoExcel = process.argv[2];

    if (!archivoExcel) {
        console.error('❌ Uso: node src/dev/import-condiciones-comerciales.js <archivo-excel>');
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

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);

    console.log(`📊 Encontradas ${rows.length} filas en hoja "${sheetName}"`);

    let condicionesCreadas = 0;
    let reglasCreadas = 0;
    let errores = 0;

    const transaction = await sequelize.transaction();

    try {
        for (const row of rows) {
            const iddto = row.IDDTO || row.ID || row.id;
            const descripcion = row.DESCRIPCION || row.descripcion || '';

            if (!iddto) {
                console.warn(`⚠️  Fila sin IDDTO, skip: ${JSON.stringify(row)}`);
                errores++;
                continue;
            }

            const codigo = `COND-${iddto}`;
            const nombre = descripcion.slice(0, 100); // Primeros 100 chars como nombre

            // Crear condición comercial
            const [condicion, created] = await CondicionComercial.findOrCreate({
                where: { codigo },
                defaults: {
                    codigo,
                    nombre,
                    descripcion,
                    vigencia_desde: null,
                    vigencia_hasta: null,
                    meta: { iddto_original: iddto }
                },
                transaction
            });

            if (created) {
                condicionesCreadas++;
            } else {
                console.log(`ℹ️  Condición ${codigo} ya existe, actualizando...`);
                await condicion.update({
                    nombre,
                    descripcion,
                    meta: { iddto_original: iddto }
                }, { transaction });
            }

            // Parsear descripción para extraer reglas
            const reglas = parsearDescripcion(descripcion);

            if (reglas.length === 0) {
                console.warn(`⚠️  ${codigo}: No se encontraron reglas en "${descripcion}"`);
            }

            // Borrar reglas existentes de esta condición para re-crearlas
            await CondicionComercialRegla.destroy({
                where: { condicionId: condicion.id },
                transaction
            });

            // Crear nuevas reglas
            for (const regla of reglas) {
                await CondicionComercialRegla.create({
                    condicionId: condicion.id,
                    rubro: regla.rubro,
                    familia: null,
                    marca: null,
                    productoId: null,
                    descuento: regla.descuento
                }, { transaction });
                reglasCreadas++;
            }

            console.log(`✅ ${codigo}: ${reglas.length} regla(s) - ${descripcion.slice(0, 60)}...`);
        }

        await transaction.commit();

        console.log('\n═══════════════════════════════════════');
        console.log('✅ IMPORTACIÓN COMPLETADA');
        console.log(`   Condiciones creadas/actualizadas: ${condicionesCreadas}`);
        console.log(`   Reglas creadas: ${reglasCreadas}`);
        console.log(`   Errores: ${errores}`);
        console.log('═══════════════════════════════════════\n');

    } catch (err) {
        await transaction.rollback();
        console.error('❌ Error durante importación:', err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

main();
