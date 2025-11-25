// src/controllers/admin/ejecutivosController.js
import { sequelize, EjecutivoCuenta, Usuario } from '../../models/index.js';
import multer from 'multer';

export const uploadExcel = multer().single('archivo'); // reservado por si lo usás luego

/* ───────── Listado ───────── */
export const list = async (req, res) => {
  const ejecutivos = (await EjecutivoCuenta.findAll({
    include: [{ model: Usuario, attributes: [] }],
    attributes: {
      include: [[sequelize.fn('COUNT', sequelize.col('Usuarios.id')), 'clientes']]
    },
    group: ['EjecutivoCuenta.id'],
    order: [['nombre', 'ASC']]
  })).map(e => e.toJSON());

  res.render('admin/ejecutivos/list', {
    title: 'Ejecutivos',
    ejecutivos,
    success: req.flash?.('success'),
    error: req.flash?.('error')
  });
};

/* ───────── Ver Clientes de Ejecutivo ───────── */
export const viewClientes = async (req, res) => {
  const ejecutivo = await EjecutivoCuenta.findByPk(req.params.id, {
    include: [{
      model: Usuario,
      required: false,
      order: [['nombre', 'ASC']]
    }]
  });

  if (!ejecutivo) {
    req.flash('error', 'Ejecutivo no encontrado');
    return res.redirect('/admin/ejecutivos');
  }

  res.render('admin/ejecutivos/clientes', {
    title: `Clientes de ${ejecutivo.nombre}`,
    ejecutivo: ejecutivo.toJSON(),
    clientes: ejecutivo.Usuarios || []
  });
};

/* ───────── Form ───────── */
export const formNew = (_req, res) =>
  res.render('admin/ejecutivos/form', { title: 'Nuevo ejecutivo', ejecutivo: {} });

export const formEdit = async (req, res) => {
  const ejecutivo = await EjecutivoCuenta.findByPk(req.params.id);
  if (!ejecutivo) return res.redirect('/admin/ejecutivos');

  res.render('admin/ejecutivos/form', {
    title: `Editar ${ejecutivo.nombre}`,
    ejecutivo,
    isEdit: true
  });
};

/* ───────── CRUD ───────── */
export const create = async (req, res) => {
  const { nombre, phone, email } = req.body;
  await EjecutivoCuenta.create({ nombre, phone, email });
  req.flash('success', `Ejecutivo ${nombre} creado`);
  res.redirect('/admin/ejecutivos');
};

export const update = async (req, res) => {
  const { nombre, phone, email } = req.body;
  await EjecutivoCuenta.update({ nombre, phone, email }, { where: { id: req.params.id } });
  req.flash('success', `Ejecutivo ${nombre} actualizado`);
  res.redirect('/admin/ejecutivos');
};

export const remove = async (req, res) => {
  const ej = await EjecutivoCuenta.findByPk(req.params.id);
  if (!ej) {
    req.flash('error', 'El ejecutivo no existe');
    return res.redirect('/admin/ejecutivos');
  }
  await ej.destroy();
  req.flash('success', `Ejecutivo ${ej.nombre} eliminado`);
  res.redirect('/admin/ejecutivos');
};

