// src/controllers/admin/promosController.js
import { Promocion, Producto } from '../../models/index.js';
import XLSX from 'xlsx';
import multer from 'multer';

export const uploadExcel = multer().single('archivo');

const strToBool = (v) => {
  const x = String(v ?? '').toLowerCase().trim();
  return x === 'true' || x === '1' || x === 'sí' || x === 'si';
};

/* ─────────────── Listado ─────────────── */
export const list = async (req, res) => {
  const promosRaw = await Promocion.findAll({
    include: { model: Producto, attributes: ['id', 'nombre'] },
    order  : [['vigente', 'DESC'], ['nombre', 'ASC']]
  });
  const promos = promosRaw.map(p => p.get({ plain: true }));
  res.render('admin/promos/list', {
    title: 'Promociones',
    promos,
    success: req.flash('success'),
    error: req.flash('error')
  });
};

/* ─────────────── Form Nuevo / Edit ─────────────── */
export const formNew = (_req, res) =>
  res.render('admin/promos/form', {
    title: 'Nueva promoción',
    promo: { vigencia_desde_iso: '', vigencia_hasta_iso: '' }
  });

export const formEdit = async (req, res) => {
  const promoInst = await Promocion.findByPk(req.params.id);
  if (!promoInst) return res.redirect('/admin/promos');

  const p = promoInst.get({ plain: true });
  p.vigencia_desde_iso = p.vigencia_desde ? p.vigencia_desde.toISOString().slice(0,10) : '';
  p.vigencia_hasta_iso = p.vigencia_hasta ? p.vigencia_hasta.toISOString().slice(0,10) : '';

  res.render('admin/promos/form', {
    title : `Editar ${p.nombre}`,
    promo : p,
    isEdit: true
  });
};

export const create = async (req, res) => {
  try {
    const { productosIds = [] } = req.body;

    const nueva = await Promocion.create(req.body);
    
    // Asociar productos si se seleccionaron
    if (Array.isArray(productosIds) && productosIds.length > 0) {
      await nueva.setProductos(productosIds);
    }

    req.flash('success', `Promoción “${nueva.nombre}” creada con éxito`);
    res.redirect('/admin/promos');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al crear promoción');
    res.redirect('/admin/promos');
  }
};

export const update = async (req, res) => {
  try {
    const { productosIds = [] } = req.body;

    await Promocion.update(req.body, { where: { id: req.params.id } });

    const promo = await Promocion.findByPk(req.params.id);
    
    // Actualizar asociaciones
    if (Array.isArray(productosIds)) {
      await promo.setProductos(productosIds); // Sequelize borra las existentes y crea nuevas
    }

    req.flash('success', `Promoción “${req.body.nombre}” actualizada con éxito`);
    res.redirect('/admin/promos');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al actualizar promoción');
    res.redirect(`/admin/promos/${req.params.id}/edit`);
  }
};

/* ─────────────── Delete ─────────────── */
export const remove = async (req, res) => {
  try {
    await Promocion.destroy({ where: { id: req.params.id } });
    req.flash('success', 'Promoción eliminada con éxito');
  } catch (err) {
    console.error(err);
    req.flash('error', 'No se pudo eliminar la promoción');
  }
  res.redirect('/admin/promos');
};

/* ─────────────── Importar Excel ─────────────── */
export const importExcel = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Adjuntá un archivo .xlsx');
      return res.redirect('/admin/promos');
    }

    const wb    = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows  = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (!rows.length) {
      req.flash('error', 'La hoja está vacía');
      return res.redirect('/admin/promos');
    }

    const map = {
      PROMO_ID       : null,
      NOMBRE         : 'nombre',
      PRODUCTO       : 'nombre',
      TIPO           : 'tipo',
      DETALLE        : 'detalle',
      REGALO         : 'regalo',
      PRESENTACION   : 'presentacion',
      ESPECIE        : 'especie',
      LABORATORIO    : 'laboratorio',
      PRODUCTOS_TXT  : 'productos_txt',
      PRODUCTO_TXT   : 'productos_txt',
      UNIDADES       : 'stock_disponible',
      STOCK          : 'stock_disponible',
      VIG_DESDE      : 'vigencia_desde',
      VIGENCIA_DESDE : 'vigencia_desde',
      VIG_HASTA      : 'vigencia_hasta',
      VIGENCIA_HASTA : 'vigencia_hasta',
      VIGENTE        : 'vigente'
    };

    const normKey = (k) =>
      k ? k.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim() : '';

    const promos = rows.map((r) => {
      const obj = {};
      for (const [colRaw, val] of Object.entries(r)) {
        const col = normKey(colRaw);
        const attr = map[col];
        if (!attr) continue;

        let v = val;
        if (attr === 'stock_disponible') {
          v = parseInt(String(v).replace(',', '.'), 10) || 0;
        } else if (attr === 'vigente') {
          v = strToBool(v) ?? true;
        } else if (attr === 'vigencia_desde' || attr === 'vigencia_hasta') {
          v = v ? new Date(v) : null;
        }

        obj[attr] = v;
      }
      return obj;
    }).filter(p => p.nombre && p.nombre.toString().trim() !== '');

    if (!promos.length) {
      req.flash('error', 'No se encontró ninguna fila válida');
      return res.redirect('/admin/promos');
    }

    await Promocion.bulkCreate(promos, {
      updateOnDuplicate: [
        'tipo','detalle','regalo','presentacion','especie','laboratorio',
        'productos_txt','stock_disponible','vigencia_desde','vigencia_hasta','vigente'
      ],
      validate: true
    });

    req.flash('success', `Se importaron / actualizaron ${promos.length} promociones`);
    res.redirect('/admin/promos');
  } catch (err) {
    console.error('Import Excel Promos error:', err);
    req.flash('error', 'Error al procesar el Excel');
    res.redirect('/admin/promos');
  }
};
