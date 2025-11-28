// src/controllers/admin/usuariosController.js
import { Op } from 'sequelize';
import {
  EjecutivoCuenta,
  Usuario,
  CondicionComercial,
  UsuarioCondicionComercial
} from '../../models/index.js';
import bcrypt from 'bcrypt';
import XLSX from 'xlsx';
import multer from 'multer';

export const uploadExcel = multer().single('archivo');

/* ───────── Listado ───────── */
export const list = async (req, res) => {
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '25', 10), 5), 200);
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const q = (req.query.q || '').trim();

  const sortAllow = ['nombre', 'phone', 'cuit', 'email', 'role', 'id'];
  const sort = sortAllow.includes(req.query.sort) ? req.query.sort : 'nombre';
  const dir = req.query.dir === 'DESC' ? 'DESC' : 'ASC';

  const where = q
    ? {
      [Op.or]: [
        { nombre: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
        { cuit: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } }
      ]
    }
    : {};

  const { rows, count } = await Usuario.findAndCountAll({
    where,
    include: [
      {
        model: EjecutivoCuenta,
        as: 'EjecutivoCuenta',
        required: false,
        attributes: ['id', 'nombre']
      },
      {
        model: CondicionComercial,
        through: UsuarioCondicionComercial,
        required: false,
        attributes: ['id', 'codigo', 'nombre']
      }
    ],
    order: [[sort, dir], ['id', 'ASC']],
    limit: pageSize,
    offset: (page - 1) * pageSize
  });

  const usuariosPlain = rows.map(r => r.toJSON());
  console.log('Usuarios data sample:', JSON.stringify(usuariosPlain[0], null, 2));

  res.render('admin/usuarios/list', {
    title: 'Usuarios',
    usuarios: usuariosPlain,
    q, page, pageSize, sort, dir,
    total: count,
    totalPages: Math.max(Math.ceil(count / pageSize), 1),
    success: req.flash?.('success'),
    error: req.flash?.('error')
  });
};

export const formNew = async (req, res) => {
  const ejecutivos = await EjecutivoCuenta.findAll({ order: [['nombre', 'ASC']] });
  const condiciones = await CondicionComercial.findAll({ order: [['codigo', 'ASC']] });

  res.render('admin/usuarios/form', {
    title: 'Nuevo usuario',
    usuario: {},
    ejecutivos: ejecutivos.map(e => e.toJSON()),
    condiciones: condiciones.map(c => c.toJSON())
  });
};

export const formEdit = async (req, res) => {
  const user = await Usuario.findByPk(req.params.id, {
    include: [
      { model: CondicionComercial, through: UsuarioCondicionComercial }
    ]
  });
  if (!user) return res.redirect('/admin/usuarios');

  const ejecutivos = await EjecutivoCuenta.findAll({ order: [['nombre', 'ASC']] });
  const condiciones = await CondicionComercial.findAll({ order: [['codigo', 'ASC']] });

  // IDs de condiciones asignadas
  const condicionesAsignadas = user.CondicionComercials?.map(c => c.id) || [];

  res.render('admin/usuarios/form', {
    title: `Editar ${user.nombre || user.phone}`,
    usuario: user.toJSON(),
    ejecutivos: ejecutivos.map(e => e.toJSON()),
    condiciones: condiciones.map(c => c.toJSON()),
    condicionesAsignadas,
    isEdit: true
  });
};

/* ───────── CRUD ───────── */
export const create = async (req, res) => {
  const { nombre, phone, cuit, email, role, password, ejecutivoId, condicionesIds } = req.body;
  const data = {
    nombre, phone, cuit, email, role,
    ejecutivoId: ejecutivoId || null
  };

  if (role === 'admin' && password) data.password = await bcrypt.hash(password, 10);

  const nuevoUsuario = await Usuario.create(data);

  // Asignar condiciones comerciales (puede ser un array o vacío)
  if (condicionesIds && Array.isArray(condicionesIds) && condicionesIds.length > 0) {
    // Crear asignaciones con vigencia_desde
    const asignaciones = condicionesIds.map(condicionId => ({
      usuarioId: nuevoUsuario.id,
      condicionId: parseInt(condicionId),
      vigencia_desde: new Date(),
      vigente_hasta: null,
      es_principal: true
    }));

    await UsuarioCondicionComercial.bulkCreate(asignaciones);
  }

  req.flash('success', `✅ Usuario #${nuevoUsuario.id} "${nombre || phone}" creado exitosamente`);
  res.redirect('/admin/usuarios');
};

export const update = async (req, res) => {
  try {
    // ===== DEBUGGING =====
    console.log('====== UPDATE USUARIO ======');
    console.log('req.body completo:', JSON.stringify(req.body, null, 2));
    console.log('condicionesIds tipo:', typeof req.body.condicionesIds);
    console.log('condicionesIds valor:', req.body.condicionesIds);
    console.log('condicionesIds isArray:', Array.isArray(req.body.condicionesIds));
    // ===== FIN DEBUGGING =====

    const { nombre, phone, cuit, email, role, password, ejecutivoId, condicionesIds } = req.body;
    const data = {
      nombre,
      phone: phone || null,
      cuit: cuit || null,
      email: email || null,
      role,
      ejecutivoId: ejecutivoId || null
    };

    if (role === 'admin' && password) data.password = await bcrypt.hash(password, 10);

    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/admin/usuarios');
    }

    await usuario.update(data);

    // GESTIÓN DE CONDICIONES COMERCIALES
    // Solo actualizar si el campo viene en el formulario
    // Si condicionesIds es undefined, significa que el campo no existe en el form (no debería pasar)
    // Si condicionesIds es string, es un solo valor (convertir a array)
    // Si condicionesIds es array vacío, significa que desmarcó todas
    // Si condicionesIds es array con valores, usar esos

    let nuevasCondiciones = [];

    if (typeof condicionesIds === 'string') {
      // Un solo checkbox marcado
      nuevasCondiciones = [parseInt(condicionesIds)];
    } else if (Array.isArray(condicionesIds)) {
      // Múltiples checkboxes marcados (o ninguno si es array vacío)
      nuevasCondiciones = condicionesIds.map(id => parseInt(id));
    }
    // Si condicionesIds es undefined, nuevasCondiciones queda como array vacío

    console.log('nuevasCondiciones procesadas:', nuevasCondiciones);

    // Eliminar asignaciones actuales
    await UsuarioCondicionComercial.destroy({
      where: { usuarioId: usuario.id }
    });

    console.log('Asignaciones eliminadas para usuario:', usuario.id);

    // Crear nuevas asignaciones si hay condiciones seleccionadas
    if (nuevasCondiciones.length > 0) {
      const asignaciones = nuevasCondiciones.map(condicionId => ({
        usuarioId: usuario.id,
        condicionId,
        vigencia_desde: new Date(),
        vigente_hasta: null,
        es_principal: true
      }));

      console.log('Creando asignaciones:', asignaciones);

      await UsuarioCondicionComercial.bulkCreate(asignaciones);

      console.log('✅ Asignaciones creadas exitosamente');
    } else {
      console.log('⚠️ No hay condiciones para asignar (array vacío)');
    }

    req.flash('success', `✅ Usuario #${usuario.id} "${nombre || phone}" actualizado exitosamente`);
    res.redirect('/admin/usuarios');

  } catch (err) {
    console.error('Error actualizando usuario:', err);

    // Manejo especial para errores de campos únicos
    if (err.name === 'SequelizeUniqueConstraintError') {
      const campo = err.errors[0]?.path;
      const valor = err.errors[0]?.value;

      if (campo === 'email') {
        req.flash('error', `⚠️ El email "${valor}" ya está en uso por otro usuario. Por favor usa otro email o déjalo vacío.`);
      } else if (campo === 'phone') {
        req.flash('error', `⚠️ El teléfono "${valor}" ya está en uso por otro usuario. Por favor usa otro teléfono o déjalo vacío.`);
      } else if (campo === 'cuit') {
        req.flash('error', `⚠️ El CUIT "${valor}" ya está en uso por otro usuario.`);
      } else {
        req.flash('error', '⚠️ Ya existe un usuario con esos datos en el sistema.');
      }
    } else {
      req.flash('error', `Error al actualizar usuario: ${err.message}`);
    }

    return res.redirect(`/admin/usuarios/${req.params.id}/edit`);
  }
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

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
    if (!rows.length) { req.flash('error', 'La hoja está vacía'); return res.redirect('/admin/usuarios'); }

    const usuarios = [];
    const ejecutivosMap = {}; // { Id_Ejecutivo: { nombre, phone, email } }

    const normalizeCuit = cuit => cuit ? String(cuit).replace(/\D/g, '').padStart(11, '0').slice(0, 11) : null;
    const extractPhone = str => { if (!str) return null; const m = String(str).match(/\d{8,}/g); return m ? m.find(n => !/^0+$/.test(n)) || null : null; };
    const isEmail = str => /\S+@\S+\.\S+/.test(str || '');

    for (const r of rows) {
      const nombreCliente = r['Razon_Social'] || r['Empresa'];
      const cuit = normalizeCuit(r['CUIT']);
      const telefonoCliente = extractPhone(r['Telefono_Cliente']);

      const idEjecutivo = r['Id_Ejecutivo'];
      const nombreEjecutivo = r['Nombre_Ejecutivo'];
      const contactoEjecutivo = r['Contacto_Ejecutivo'];

      if (!nombreCliente && !cuit && !telefonoCliente) continue;

      if (idEjecutivo && nombreEjecutivo && !ejecutivosMap[idEjecutivo]) {
        ejecutivosMap[idEjecutivo] = {
          nombre: nombreEjecutivo,
          phone: isEmail(contactoEjecutivo) ? null : extractPhone(contactoEjecutivo),
          email: isEmail(contactoEjecutivo) ? contactoEjecutivo : null
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

    await Usuario.bulkCreate(payload, { updateOnDuplicate: ['nombre', 'phone', 'cuit', 'role', 'ejecutivoId'], validate: true });

    req.flash('success', `Importados/actualizados ${payload.length} usuarios y ${Object.keys(ejecutivosDB).length} ejecutivos`);
    res.redirect('/admin/usuarios');
  } catch (err) {
    console.error('❌ Error importando usuarios y ejecutivos:', err);
    req.flash('error', 'Error al procesar el Excel');
    res.redirect('/admin/usuarios');
  }
};
