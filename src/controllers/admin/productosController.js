// src/controllers/admin/productosController.js
import { sequelize, Producto, Promocion, ProductoPromocion } from '../../models/index.js';
import { Op } from 'sequelize';
import XLSX from 'xlsx';
import multer from 'multer';

export const uploadExcel = multer().single('archivo');

const toBool = (val) => val === 'on' || val === 'true' || val === true;

/* ─────────────────────── Listado (GET) ──────────────────────── */
export const list = async (req, res) => {
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '25', 10), 5), 200); // 5..200
  const page     = Math.max(parseInt(req.query.page || '1', 10), 1);
  const q        = (req.query.q || '').trim();
  const sort     = ['nombre','precio','cantidad','id'].includes(req.query.sort) ? req.query.sort : 'nombre';
  const dir      = req.query.dir === 'DESC' ? 'DESC' : 'ASC';

  const where = q
    ? {
        [Op.and]: [
          { visible: { [Op.in]: [true, false] } }, // no filtramos por visible en admin
          {
            [Op.or]: [
              { nombre      : { [Op.like]: `%${q}%` } },
              { presentacion: { [Op.like]: `%${q}%` } },
              { marca       : { [Op.like]: `%${q}%` } },
              { id_articulo : { [Op.like]: `%${q}%` } }
            ]
          }
        ]
      }
    : {};

  const { rows, count } = await Producto.findAndCountAll({
    where,
    order: [[sort, dir]],
    limit: pageSize,
    offset: (page - 1) * pageSize
  });

  res.render('admin/productos/list', {
    title: 'Productos',
    productos : rows.map(r => r.get({ plain: true })),
    q, page, pageSize, sort, dir,
    total     : count,
    totalPages: Math.max(Math.ceil(count / pageSize), 1),
    success: req.flash('success'),
    error  : req.flash('error')
  });
};

/* ───────────────────── Form Nuevo / Edit ────────────────────── */
export const formNew = (_req, res) =>
  res.render('admin/productos/form', { title: 'Nuevo producto', producto: {} });

export const formEdit = async (req, res) => {
  const prodInst = await Producto.findByPk(req.params.id, {
    include: { model: Promocion, attributes: ['id', 'nombre'] }
  });

  if (!prodInst) return res.redirect('/admin/productos');

  const producto = prodInst.get({ plain: true });

  res.render('admin/productos/form', {
    title   : `Editar ${producto.nombre}`,
    producto,
    isEdit  : true
  });
};

/* ───────────────────────── Create ───────────────────────────── */
export const create = async (req, res) => {
  const { id_articulo, nombre, precio, cantidad, visible, debaja } = req.body;

  await Producto.create({
    id_articulo,
    nombre,
    precio,
    cantidad,
    visible: toBool(visible),
    debaja : toBool(debaja)
  });

  req.flash('success', `Producto ${nombre} creado con éxito`);
  res.redirect('/admin/productos');
};

/* ───────────────────────── Update ───────────────────────────── */
export const update = async (req, res) => {
  try {
    const data = {
      ...req.body,
      debaja : toBool(req.body.debaja),
      visible: toBool(req.body.visible)
    };
    Object.keys(data).forEach(k => { if (data[k] === '') data[k] = null; });

    await Producto.update(data, { where: { id: req.params.id } });

    req.flash('success', `Producto ${data.nombre || data.id_articulo} actualizado con éxito`);
    res.redirect('/admin/productos');
  } catch (err) {
    console.error('⛔ ERROR al actualizar producto:', err.message);
    req.flash('error', 'No se pudo actualizar el producto');
    res.redirect(`/admin/productos/${req.params.id}/edit`);
  }
};

/* ───────────────────────── Delete ───────────────────────────── */
export const remove = async (req, res) => {
  await Producto.destroy({ where: { id: req.params.id } });
  req.flash('success', 'Producto eliminado con éxito');
  res.redirect('/admin/productos');
};

/* Acciones masivas */
export const bulkAction = async (req, res) => {
  try {
    let ids = req.body?.ids ?? [];
    if (!Array.isArray(ids)) ids = [ids];
    ids = ids.map(x => Number(x)).filter(Boolean);

    const action = req.body?.action;
    if (!ids.length) { req.flash('error', 'No seleccionaste productos.'); return res.redirect('/admin/productos'); }
    if (!['delete','show','hide','alta','baja'].includes(action)) {
      req.flash('error', 'Acción inválida.'); return res.redirect('/admin/productos');
    }

    if (action === 'delete') {
      await ProductoPromocion.destroy({ where: { productoId: ids } });
      await Producto.destroy({ where: { id: ids } });
      req.flash('success', `Eliminados ${ids.length} productos.`);
    }
    if (action === 'show') { await Producto.update({ visible: true  }, { where: { id: ids } }); req.flash('success', `Marcados como visibles ${ids.length}.`); }
    if (action === 'hide') { await Producto.update({ visible: false }, { where: { id: ids } }); req.flash('success', `Ocultados ${ids.length}.`); }
    if (action === 'alta') { await Producto.update({ debaja: false }, { where: { id: ids } }); req.flash('success', `Marcados en alta ${ids.length}.`); }
    if (action === 'baja') { await Producto.update({ debaja: true  }, { where: { id: ids } }); req.flash('success', `Marcados de baja ${ids.length}.`); }

    res.redirect('/admin/productos');
  } catch (err) {
    console.error('bulkAction error:', err);
    req.flash('error', 'No se pudo ejecutar la acción masiva');
    res.redirect('/admin/productos');
  }
};


/* Vaciar catálogo (purge) */
export const purgeAll = async (req, res) => {
  try {
    if (req.body?.confirm !== 'ELIMINAR-TODO') {
      req.flash('error', 'Debés escribir ELIMINAR-TODO para confirmar.');
      return res.redirect('/admin/productos');
    }

    await sequelize.transaction(async (t) => {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });
      await sequelize.query('TRUNCATE TABLE productos_promociones', { transaction: t });
      await sequelize.query('TRUNCATE TABLE productos', { transaction: t });
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
    });

    req.flash('success', 'Catálogo vaciado por completo.');
    res.redirect('/admin/productos');
  } catch (err) {
    console.error('purgeAll error:', err);
    req.flash('error', 'No se pudo vaciar el catálogo.');
    res.redirect('/admin/productos');
  }
};


/* ─────────────────────── Importar Excel ─────────────────────── */
export const importExcel = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Debés adjuntar un archivo .xlsx');
      return res.redirect('/admin/productos');
    }

    const wb    = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];

    const range  = XLSX.utils.decode_range(sheet['!ref']);
    const merges = sheet['!merges'] || [];
    const rows   = [];

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const row = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        let cell = sheet[cellAddress]?.v ?? null;

        if (cell === null) {
          const merge = merges.find(m =>
            R >= m.s.r && R <= m.e.r && C >= m.s.c && C <= m.e.c
          );
          if (merge) {
            const mainCell = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
            cell = sheet[mainCell]?.v ?? null;
          }
        }
        row.push(cell);
      }
      rows.push(row);
    }

    const norm = s => (s ?? '')
      .toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .trim()
      .toUpperCase();

    const map = {
      IDARTICULO   : 'id_articulo',
      DESCRIPCION  : 'nombre',
      COSTO        : 'costo',
      PRECIO1      : 'precio',
      PRESENTACION : 'presentacion',
      MARCA        : 'marca',
      RUBRO        : 'rubro',
      FAMILIA      : 'familia',
      PROVEEDOR    : 'proveedor',
      CODIGOBARRAS : 'codBarras',
      DEBAJA       : 'debaja',
      PUBLICAR     : 'visible',
      DISP         : 'cantidad',
      OBSERVACIONES: 'observaciones'
    };

    const headerRowIndex = rows.findIndex(r => r.some(c => c));
    const headersNorm = rows[headerRowIndex].map(norm);
    const dataRows = rows.slice(headerRowIndex + 1);

    const prevVals = Array(headersNorm.length).fill(null);
    const filledRows = dataRows.map(row =>
      row.map((cell, idx) => {
        if (cell !== null && cell !== '') {
          prevVals[idx] = cell;
          return cell;
        }
        return prevVals[idx];
      })
    );

    const idxDescripcion = headersNorm.findIndex(h => h === 'DESCRIPCION');
    const parseDecimal = (val) => {
      if (val === null || val === '') return null;
      return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || null;
    };

    const productos = filledRows
      .filter(r => idxDescripcion >= 0 && r[idxDescripcion])
      .map((r, i) => {
        const obj = {};
        r.forEach((val, idx) => {
          const attr = map[headersNorm[idx]];
          if (!attr || val === null || val === '') return;

          if (['costo','precio'].includes(attr)) {
            val = parseDecimal(val);
          } else if (['cantidad'].includes(attr)) {
            val = parseInt(val, 10) || 0;
          } else if (attr === 'debaja') {
            val = ['1','TRUE','SI','SÍ'].includes(norm(val));
          } else if (attr === 'visible') {
            val = ['1','TRUE','SI','SÍ'].includes(norm(val));
          } else if (attr === 'codBarras') {
            val = String(val).split('.')[0];
          }
          obj[attr] = val;
        });

        if (!obj.id_articulo) obj.id_articulo = `AUTO-${Date.now()}-${i}`;
        return obj;
      });

    if (!productos.length) {
      req.flash('error', 'No se encontró ninguna fila válida para importar');
      return res.redirect('/admin/productos');
    }

    const updatable = [
      'costo','precio','presentacion','proveedor','marca','rubro','familia',
      'debaja','cantidad','codBarras','observaciones','visible'
    ];

    await Producto.bulkCreate(productos, {
      updateOnDuplicate: updatable,
      validate: true
    });

    req.flash('success', `Se importaron ${productos.length} productos correctamente`);
    res.redirect('/admin/productos');
  } catch (err) {
    console.error('⛔ Error al importar Excel:', err);
    if (err.errors) err.errors.forEach(e => console.error('Detalle:', e.message, e.value));
    req.flash('error', 'Error interno al procesar el Excel');
    res.redirect('/admin/productos');
  }
};
