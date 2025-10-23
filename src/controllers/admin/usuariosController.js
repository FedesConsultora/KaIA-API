// src/controllers/admin/usuariosController.js
import { Op } from 'sequelize';
import { EjecutivoCuenta, Usuario } from '../../models/index.js';
import bcrypt from 'bcrypt';
import XLSX from 'xlsx';
import multer from 'multer';

export const uploadExcel = multer().single('archivo');

/* ───────── Listado ───────── */
export const list = async (req, res) => {
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '25', 10), 5), 200);
  const page     = Math.max(parseInt(req.query.page || '1', 10), 1);
  const q        = (req.query.q || '').trim();

  const sortAllow = ['nombre', 'phone', 'cuit', 'email', 'role', 'id'];
  const sort      = sortAllow.includes(req.query.sort) ? req.query.sort : 'nombre';
  const dir       = req.query.dir === 'DESC' ? 'DESC' : 'ASC';

  const where = q
    ? {
        [Op.or]: [
          { nombre: { [Op.like]: `%${q}%` } },
          { phone : { [Op.like]: `%${q}%` } },
          { cuit  : { [Op.like]: `%${q}%` } },
          { email : { [Op.like]: `%${q}%` } }
        ]
      }
    : {};

  const { rows, count } = await Usuario.findAndCountAll({
    where,
    order : [[sort, dir], ['id', 'ASC']],
    limit : pageSize,
    offset: (page - 1) * pageSize
  });

  res.render('admin/usuarios/list', {
    title: 'Usuarios',
    usuarios  : rows.map(r => r.get({ plain: true })),
    q, page, pageSize, sort, dir,
    total     : count,
    totalPages: Math.max(Math.ceil(count / pageSize), 1),
    success: req.flash?.('success'),
    error  : req.flash?.('error')
  });
};

/* ───────── Form ───────── */
export const formNew = (_req, res) => {
  res.render('admin/usuarios/form', { title: 'Nuevo usuario', usuario: {} });
};

export const formEdit = async (req, res) => {
  const user = await Usuario.findByPk(req.params.id);
  if (!user) return res.redirect('/admin/usuarios');

  res.render('admin/usuarios/form', {
    title: `Editar ${user.nombre || user.phone}`,
    usuario: user,
    isEdit: true
  });
};

/* ───────── CRUD ───────── */
export const create = async (req, res) => {
  const { nombre, phone, cuit, email, role, password } = req.body;
  const data = { nombre, phone, cuit, email, role };
  if (role === 'admin' && password) data.password = await bcrypt.hash(password, 10);
  await Usuario.create(data);
  res.redirect('/admin/usuarios');
};

export const update = async (req, res) => {
  const { nombre, phone, cuit, email, role, password } = req.body;
  const data = { nombre, phone, cuit, email, role };
  if (role === 'admin' && password) data.password = await bcrypt.hash(password, 10);
  await Usuario.update(data, { where: { id: req.params.id } });
  req.flash('success', `Usuario ${nombre || phone} actualizado con éxito`);
  res.redirect('/admin/usuarios');
};

export const remove = async (req, res) => {
  const usuario = await Usuario.findByPk(req.params.id);
  if (!usuario) { req.flash('error', 'El usuario no existe'); return res.redirect('/admin/usuarios'); }
  await usuario.destroy();
  req.flash('success', `Usuario ${usuario.nombre || usuario.phone} eliminado con éxito`);
  res.redirect('/admin/usuarios');
};

/* ───────── Importar Excel Clientes + Ejecutivos ───────── */
export const importExcel = async (req, res) => {
  try {
    if (!req.file) { req.flash('error', 'Debés adjuntar un archivo .xlsx'); return res.redirect('/admin/usuarios'); }

    const wb    = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows  = XLSX.utils.sheet_to_json(sheet, { defval: null });
    if (!rows.length) { req.flash('error', 'La hoja está vacía'); return res.redirect('/admin/usuarios'); }

    const usuarios      = [];
    const ejecutivosMap = {}; // { Id_Ejecutivo: { nombre, phone, email } }

    const normalizeCuit = cuit => cuit ? String(cuit).replace(/\D/g, '').padStart(11, '0').slice(0, 11) : null;
    const extractPhone  = str => { if (!str) return null; const m = String(str).match(/\d{8,}/g); return m ? m.find(n => !/^0+$/.test(n)) || null : null; };
    const isEmail       = str => /\S+@\S+\.\S+/.test(str || '');

    for (const r of rows) {
      const nombreCliente   = r['Razon_Social'] || r['Empresa'];
      const cuit            = normalizeCuit(r['CUIT']);
      const telefonoCliente = extractPhone(r['Telefono_Cliente']);

      const idEjecutivo       = r['Id_Ejecutivo'];
      const nombreEjecutivo   = r['Nombre_Ejecutivo'];
      const contactoEjecutivo = r['Contacto_Ejecutivo'];

      if (!nombreCliente && !cuit && !telefonoCliente) continue;

      if (idEjecutivo && nombreEjecutivo && !ejecutivosMap[idEjecutivo]) {
        ejecutivosMap[idEjecutivo] = {
          nombre: nombreEjecutivo,
          phone : isEmail(contactoEjecutivo) ? null : extractPhone(contactoEjecutivo),
          email : isEmail(contactoEjecutivo) ? contactoEjecutivo : null
        };
      }

      if (!telefonoCliente && !cuit) continue;

      usuarios.push({ nombre: nombreCliente || null, phone: telefonoCliente || null, cuit: cuit || null, role: 'vet', idEjecutivo });
    }

    if (!usuarios.length) { req.flash('error', 'No se encontró ningún usuario válido'); return res.redirect('/admin/usuarios'); }

    usuarios.forEach(u => { if (u.cuit === '00000000000') u.cuit = null; });

    const seen = new Set();
    const usuariosDedup = [];
    for (const u of usuarios) {
      const key = u.cuit ?? u.phone ?? u.nombre;
      if (seen.has(key)) continue;
      seen.add(key);
      usuariosDedup.push(u);
    }

    const ejecutivosDB = {};
    for (const [code, data] of Object.entries(ejecutivosMap)) {
      const [ejecutivo] = await EjecutivoCuenta.findOrCreate({ where: { nombre: data.nombre }, defaults: data });
      await ejecutivo.update(data);
      ejecutivosDB[code] = ejecutivo.id;
    }

    const payload = usuariosDedup.map(u => ({
      nombre: u.nombre, phone: u.phone, cuit: u.cuit, role: 'vet', ejecutivoId: ejecutivosDB[u.idEjecutivo] || null
    }));

    await Usuario.bulkCreate(payload, { updateOnDuplicate: ['nombre','phone','cuit','role','ejecutivoId'], validate: true });

    req.flash('success', `Importados/actualizados ${payload.length} usuarios y ${Object.keys(ejecutivosDB).length} ejecutivos`);
    res.redirect('/admin/usuarios');
  } catch (err) {
    console.error('❌ Error importando usuarios y ejecutivos:', err);
    req.flash('error', 'Error al procesar el Excel');
    res.redirect('/admin/usuarios');
  }
};
