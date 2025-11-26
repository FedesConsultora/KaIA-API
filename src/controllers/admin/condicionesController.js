// src/controllers/admin/condicionesController.js
import {
    CondicionComercial,
    CondicionComercialRegla,
    Usuario,
    UsuarioCondicionComercial,
    sequelize
} from '../../models/index.js';
import { Op } from 'sequelize';
import xlsx from 'xlsx';
import multer from 'multer';
import path from 'path';

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/tmp');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.xlsx' && ext !== '.xls') {
            return cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
        }
        cb(null, true);
    }
});

// ===== LISTAR CONDICIONES =====
export async function list(req, res) {
    try {
        const condiciones = await CondicionComercial.findAll({
            include: [{
                model: CondicionComercialRegla,
                required: false
            }],
            order: [['codigo', 'ASC']]
        });

        res.render('admin/condiciones/list', {
            title: 'Condiciones Comerciales',
            condiciones
        });
    } catch (err) {
        console.error('Error listando condiciones:', err);
        req.flash('error', 'Error al cargar condiciones comerciales');
        res.redirect('/admin');
    }
}

// ===== FORMULARIO NUEVA CONDICIÓN =====
export async function formNew(req, res) {
    res.render('admin/condiciones/form', {
        title: 'Nueva Condición Comercial',
        condicion: {},
        reglas: [],
        action: '/admin/condiciones',
        method: 'POST'
    });
}

// ===== CREAR CONDICIÓN =====
export async function create(req, res) {
    try {
        const { codigo, nombre, descripcion, vigencia_desde, vigencia_hasta } = req.body;

        const condicion = await CondicionComercial.create({
            codigo,
            nombre,
            descripcion,
            vigencia_desde: vigencia_desde || null,
            vigencia_hasta: vigencia_hasta || null
        });

        req.flash('success', `Condición ${codigo} creada exitosamente`);
        res.redirect(`/admin/condiciones/${condicion.id}/edit`);
    } catch (err) {
        console.error('Error creando condición:', err);
        req.flash('error', 'Error al crear condición comercial');
        res.redirect('/admin/condiciones/new');
    }
}

// ===== FORMULARIO EDITAR CONDICIÓN =====
export async function formEdit(req, res) {
    try {
        const condicion = await CondicionComercial.findByPk(req.params.id, {
            include: [{
                model: CondicionComercialRegla,
                required: false
            }]
        });

        if (!condicion) {
            req.flash('error', 'Condición no encontrada');
            return res.redirect('/admin/condiciones');
        }

        res.render('admin/condiciones/form', {
            title: `Editar Condición: ${condicion.codigo}`,
            condicion,
            reglas: condicion.CondicionComercialReglas || [],
            action: `/admin/condiciones/${condicion.id}?_method=PUT`,
            method: 'POST'
        });
    } catch (err) {
        console.error('Error cargando condición:', err);
        req.flash('error', 'Error al cargar condición');
        res.redirect('/admin/condiciones');
    }
}

// ===== ACTUALIZAR CONDICIÓN =====
export async function update(req, res) {
    try {
        const condicion = await CondicionComercial.findByPk(req.params.id);

        if (!condicion) {
            req.flash('error', 'Condición no encontrada');
            return res.redirect('/admin/condiciones');
        }

        const { codigo, nombre, descripcion, vigencia_desde, vigencia_hasta } = req.body;

        await condicion.update({
            codigo,
            nombre,
            descripcion,
            vigencia_desde: vigencia_desde || null,
            vigencia_hasta: vigencia_hasta || null
        });

        req.flash('success', 'Condición actualizada exitosamente');
        res.redirect(`/admin/condiciones/${condicion.id}/edit`);
    } catch (err) {
        console.error('Error actualizando condición:', err);
        req.flash('error', 'Error al actualizar condición');
        res.redirect(`/admin/condiciones/${req.params.id}/edit`);
    }
}

// ===== ELIMINAR CONDICIÓN =====
export async function remove(req, res) {
    try {
        const condicion = await CondicionComercial.findByPk(req.params.id);

        if (!condicion) {
            req.flash('error', 'Condición no encontrada');
            return res.redirect('/admin/condiciones');
        }

        await condicion.destroy();

        req.flash('success', `Condición ${condicion.codigo} eliminada`);
        res.redirect('/admin/condiciones');
    } catch (err) {
        console.error('Error eliminando condición:', err);
        req.flash('error', 'Error al eliminar condición');
        res.redirect('/admin/condiciones');
    }
}

// ===== VER USUARIOS ASIGNADOS A UNA CONDICIÓN =====
export async function viewAsignados(req, res) {
    try {
        const condicion = await CondicionComercial.findByPk(req.params.id, {
            include: [{
                model: Usuario,
                through: UsuarioCondicionComercial,
                required: false
            }]
        });

        if (!condicion) {
            req.flash('error', 'Condición no encontrada');
            return res.redirect('/admin/condiciones');
        }

        res.render('admin/condiciones/asignados', {
            title: `Usuarios con: ${condicion.codigo}`,
            condicion,
            usuarios: condicion.Usuarios || []
        });
    } catch (err) {
        console.error('Error listando usuarios asignados:', err);
        req.flash('error', 'Error al cargar usuarios');
        res.redirect('/admin/condiciones');
    }
}

// ===== HELPERS PARA IMPORTACIÓN =====

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

function parsearDescripcion(descripcion) {
    if (!descripcion) return [];

    const reglas = [];
    const regex = /([A-Z\.]+(?:\s+[A-Z\.&]+)*)\s+(\d+(?:\.\d+)?)\s*%/gi;

    let match;
    while ((match = regex.exec(descripcion)) !== null) {
        const rubroRaw = match[1].trim();
        const porcentaje = parseFloat(match[2]);

        if (isNaN(porcentaje) || porcentaje === 0) continue;
        if (/LISTA/i.test(rubroRaw)) continue;

        const palabrasPrincipales = rubroRaw.split(/\s+/);
        let rubroBase = palabrasPrincipales[0].replace(/\./g, '');
        rubroBase = normalizarRubro(rubroBase);

        if (!rubroBase) continue;

        reglas.push({
            rubro: rubroBase,
            descuento: porcentaje / 100
        });
    }

    return reglas;
}

async function buscarUsuarioPorRazonSocial(razonSocial, transaction) {
    if (!razonSocial) return null;

    const razonClean = razonSocial.trim();

    let usuario = await Usuario.findOne({
        where: { nombre: { [Op.like]: razonClean } },
        transaction
    });

    if (usuario) return usuario;

    const primeraPalabra = razonClean.split(/\s+/)[0];
    if (primeraPalabra && primeraPalabra.length > 2) {
        usuario = await Usuario.findOne({
            where: { nombre: { [Op.like]: `${primeraPalabra}%` } },
            transaction
        });
    }

    return usuario;
}

// ===== IMPORTAR CONDICIONES DESDE EXCEL =====
export async function importarCondiciones(req, res) {
    const transaction = await sequelize.transaction();

    try {
        if (!req.file) {
            req.flash('error', 'No se subió ningún archivo');
            return res.redirect('/admin/condiciones');
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet);

        let condicionesCreadas = 0;
        let reglasCreadas = 0;
        let errores = 0;

        for (const row of rows) {
            const iddto = row.IDDTO || row.ID || row.id;
            const descripcion = row.DESCRIPCION || row.descripcion || '';

            if (!iddto) {
                errores++;
                continue;
            }

            const codigo = `COND-${iddto}`;
            const nombre = descripcion.slice(0, 100);

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
                await condicion.update({
                    nombre,
                    descripcion,
                    meta: { iddto_original: iddto }
                }, { transaction });
            }

            const reglas = parsearDescripcion(descripcion);

            await CondicionComercialRegla.destroy({
                where: { condicionId: condicion.id },
                transaction
            });

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
        }

        await transaction.commit();

        req.flash('success', `✅ Importación completada: ${condicionesCreadas} condiciones, ${reglasCreadas} reglas. Errores: ${errores}`);
        res.redirect('/admin/condiciones');

    } catch (err) {
        await transaction.rollback();
        console.error('Error importando condiciones:', err);
        req.flash('error', `Error durante la importación: ${err.message}`);
        res.redirect('/admin/condiciones');
    }
}

// ===== ASIGNAR CONDICIONES A USUARIOS DESDE EXCEL =====
export async function asignarCondiciones(req, res) {
    const transaction = await sequelize.transaction();

    try {
        if (!req.file) {
            req.flash('error', 'No se subió ningún archivo');
            return res.redirect('/admin/condiciones');
        }

        const workbook = xlsx.readFile(req.file.path);

        let usuariosAsignados = 0;
        let usuariosNoEncontrados = 0;
        let condicionesNoEncontradas = 0;

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

                const usuario = await buscarUsuarioPorRazonSocial(razonSocial, transaction);

                if (!usuario) {
                    usuariosNoEncontrados++;
                    continue;
                }

                const codigoCondicion = `COND-${idDto}`;
                const condicion = await CondicionComercial.findOne({
                    where: { codigo: codigoCondicion },
                    transaction
                });

                if (!condicion) {
                    condicionesNoEncontradas++;
                    continue;
                }

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
                    usuariosAsignados++;
                } else {
                    await asignacion.update({
                        vigente_desde: new Date('2025-01-01'),
                        es_principal: true
                    }, { transaction });
                }
            }
        }

        await transaction.commit();

        const mensaje = `✅ Asignación completada: ${usuariosAsignados} usuarios actualizados. No encontrados: ${usuariosNoEncontrados} usuarios, ${condicionesNoEncontradas} condiciones.`;
        req.flash('success', mensaje);
        res.redirect('/admin/condiciones');

    } catch (err) {
        await transaction.rollback();
        console.error('Error asignando condiciones:', err);
        req.flash('error', `Error durante la asignación: ${err.message}`);
        res.redirect('/admin/condiciones');
    }
}

// ===== LIMPIAR ASIGNACIONES (PURGE) =====
export async function purgeAsignaciones(req, res) {
    const transaction = await sequelize.transaction();

    try {
        const count = await UsuarioCondicionComercial.count();

        await UsuarioCondicionComercial.destroy({
            where: {},
            truncate: true,
            transaction
        });

        await transaction.commit();

        req.flash('success', `✅ Eliminadas ${count} asignaciones. Las condiciones se mantienen, pero ningún usuario tiene condiciones asignadas.`);
        res.redirect('/admin/condiciones');

    } catch (err) {
        await transaction.rollback();
        console.error('Error limpiando asignaciones:', err);
        req.flash('error', `Error al limpiar asignaciones: ${err.message}`);
        res.redirect('/admin/condiciones');
    }
}

// ===== ELIMINAR TODO (PURGE ALL) =====
export async function purgeAll(req, res) {
    const transaction = await sequelize.transaction();

    try {
        const countAsignaciones = await UsuarioCondicionComercial.count();
        const countReglas = await CondicionComercialRegla.count();
        const countCondiciones = await CondicionComercial.count();

        // 1. Eliminar asignaciones
        await UsuarioCondicionComercial.destroy({
            where: {},
            truncate: true,
            transaction
        });

        // 2. Eliminar reglas
        await CondicionComercialRegla.destroy({
            where: {},
            truncate: true,
            transaction
        });

        // 3. Eliminar condiciones
        await CondicionComercial.destroy({
            where: {},
            truncate: true,
            transaction
        });

        await transaction.commit();

        const mensaje = `🗑️ Eliminación completa:
- ${countCondiciones} condiciones
- ${countReglas} reglas
- ${countAsignaciones} asignaciones
Todo limpio para reimportar.`;

        req.flash('success', mensaje);
        res.redirect('/admin/condiciones');

    } catch (err) {
        await transaction.rollback();
        console.error('Error eliminando todo:', err);
        req.flash('error', `Error al eliminar todo: ${err.message}`);
        res.redirect('/admin/condiciones');
    }
}
