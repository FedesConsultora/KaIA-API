// src/controllers/admin/productosController.js
import { Producto, Promocion } from '../../models/index.js';
import XLSX from 'xlsx';
import multer from 'multer';

/* ---------- Multer memoria ---------- */
export const uploadExcel = multer().single('archivo');

/* ─────────────────────────── Helpers ─────────────────────────── */
const toBool = (val) => val === 'on' || val === 'true' || val === true;

/* ─────────────────────── Listado (GET) ──────────────────────── */
export const list = async (_req, res) => {
  const productosRaw = await Producto.findAll({
    include: { model: Promocion, attributes: ['id', 'nombre'] },
    order  : [['nombre', 'ASC']]
  });

  const productos = productosRaw.map(p => p.get({ plain: true }));
  res.render('admin/productos/list', { title: 'Productos', productos });
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
  try {
    const data = {
      ...req.body,
      debaja : toBool(req.body.debaja),
      visible: toBool(req.body.visible)
    };

    Object.keys(data).forEach(k => { if (data[k] === '') data[k] = null; });

    await Producto.create(data);
    res.redirect('/admin/productos');
  } catch (err) {
    console.error('⛔ ERROR al crear producto:', err.message);
    res.status(500).send(`
      <h1>Error al guardar el producto</h1>
      <pre>${err.message}</pre>
      <a href="/admin/productos/new">Volver</a>
    `);
  }
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
    res.redirect('/admin/productos');
  } catch (err) {
    console.error('⛔ ERROR al actualizar producto:', err.message);
    res.redirect(`/admin/productos/${req.params.id}/edit`);
  }
};

/* ───────────────────────── Delete ───────────────────────────── */
export const remove = async (req, res) => {
  await Producto.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/productos');
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
    const rows  = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (!rows.length) {
      req.flash('error', 'La hoja está vacía');
      return res.redirect('/admin/productos');
    }

    const map = {
      IDARTICULO   : 'id_articulo',
      DESCRIPCION  : 'nombre',
      COSTO        : 'costo',
      PRECIO1      : 'precio',
      PRESENTACION : 'presentacion',
      PROVEEDOR    : 'proveedor',
      MARCA        : 'marca',
      RUBRO        : 'rubro',
      FAMILIA      : 'familia',
      DEBAJA       : 'debaja',
      CANTIDAD     : 'cantidad',
      STOCKMINIMO  : 'stockMin',
      STOCKMAXIMO  : 'stockMax',
      CODIGOBARRAS : 'codBarras',
      OBSERVACIONES: 'observaciones'
    };

    const productos = rows
      .filter(r =>
        r.DESCRIPCION &&
        !(String(r.IDMARCA || '').toUpperCase().includes('PROM')) // excluir si IDMARCA contiene 'PROM'
      )
      .map(r => {
        const obj = {};

        for (const [col, attr] of Object.entries(map)) {
          let val = r[col] ?? null;

          if (['costo', 'precio'].includes(attr)) {
            val = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
          }

          else if (['cantidad', 'stockMin', 'stockMax'].includes(attr)) {
            val = typeof val === 'string' ? parseInt(val) : val;
          }

          else if (attr === 'debaja') {
            const v = String(val).toLowerCase().trim();
            val = v === 'true' || v === '1' || v === 'sí' || v === 'si';
          }

          obj[attr] = val;
        }

        return obj;
      });

    if (!productos.length) {
      req.flash('error', 'No se encontró ninguna fila válida');
      return res.redirect('/admin/productos');
    }

    await Producto.bulkCreate(productos, {
      updateOnDuplicate: Object.values(map),
      validate: true
    });

    req.flash('success', `Se importaron ${productos.length} productos`);
    res.redirect('/admin/productos');
  } catch (err) {
    console.error('Import Excel error:', err);
    req.flash('error', 'Error al procesar el Excel');
    res.redirect('/admin/productos');
  }
};