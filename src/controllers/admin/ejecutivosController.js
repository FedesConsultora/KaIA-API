import { EjecutivoCuenta, Usuario } from '../../models/index.js';
import multer from 'multer';

export const uploadExcel = multer().single('archivo');      // (opcional)

export const list = async (_req, res) => {
  const ejecutivos = (await EjecutivoCuenta.findAll({
    include: {              // cuántos clientes atiende cada uno
      model: Usuario,
      attributes: []
    },
    attributes: {
      include: [
        [EjecutivoCuenta.sequelize.fn('COUNT', '*'), 'clientes']
      ]
    },
    group: ['EjecutivoCuenta.id'],
    order: [['nombre', 'ASC']]
  })).map(e => e.toJSON());

  res.render('admin/ejecutivos/list', {
    title: 'Ejecutivos',
    ejecutivos
  });
};

export const formNew = (_req, res) =>
  res.render('admin/ejecutivos/form', { title: 'Nuevo ejecutivo', ejecutivo: {} });

export const formEdit = async (req, res) => {
  const ejecutivo = await EjecutivoCuenta.findByPk(req.params.id);
  if (!ejecutivo) return res.redirect('/admin/ejecutivos');

  res.render('admin/ejecutivos/form', {
    title   : `Editar ${ejecutivo.nombre}`,
    ejecutivo,
    isEdit  : true
  });
};

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

/* Import-Excel → deja la firma para futuro
export const importExcel = async (req,res)=>{ … }
*/
