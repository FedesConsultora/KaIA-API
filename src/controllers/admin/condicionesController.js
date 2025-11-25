// src/controllers/admin/condicionesController.js
import {
    CondicionComercial,
    CondicionComercialRegla,
    Usuario,
    UsuarioCondicionComercial
} from '../../models/index.js';
import { Op } from 'sequelize';

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
