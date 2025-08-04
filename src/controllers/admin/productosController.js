// src/controllers/admin/productosController.js
import { Producto, Promocion } from '../../models/index.js';
import XLSX from 'xlsx';
import multer from 'multer';

/* ---------- Multer memoria ---------- */
export const uploadExcel = multer().single('archivo');

/* ─────────────────────────── Helpers ─────────────────────────── */
const toBool = (val) => val === 'on' || val === 'true' || val === true;

/* ─────────────────────── Listado (GET) ──────────────────────── */
export const list = async (req, res) => {
  const productosRaw = await Producto.findAll({
    include: { model: Promocion, attributes: ['id', 'nombre'] },
    order: [['nombre', 'ASC']]
  });

  const productos = productosRaw.map(p => p.get({ plain: true }));

  res.render('admin/productos/list', {
    title: 'Productos',
    productos,
    success: req.flash('success'),
    error: req.flash('error')
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
    visible: visible === 'on',
    debaja: debaja === 'on'
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

    // --- Leer filas considerando celdas mergeadas ---
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

    console.log('🔹 Filas totales leídas del Excel:', rows.length);

    // Normalizador de encabezados → sin tildes, sin espacios
    const norm = s => (s ?? '')
      .toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .trim()
      .toUpperCase();

    // Mapeo actualizado para el nuevo Excel
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

    // Buscar fila de encabezados
    const headerRowIndex = rows.findIndex(r => r.some(c => c));
    const headersNorm = rows[headerRowIndex].map(norm);

    console.log('🔹 Encabezados normalizados:', headersNorm);

    const dataRows = rows.slice(headerRowIndex + 1);

    // Forward-fill vertical para merges
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
      return parseFloat(
        String(val).replace(/\./g, '').replace(',', '.')
      ) || null;
    };

    const productos = filledRows
      .filter(r => idxDescripcion >= 0 && r[idxDescripcion]) // Solo filas con descripción
      .map((r, i) => {
        const obj = {};
        r.forEach((val, idx) => {
          const attr = map[headersNorm[idx]];
          if (!attr || val === null || val === '') return;

          // Casting
          if (['costo','precio'].includes(attr)) {
            val = parseDecimal(val);
          } else if (['cantidad'].includes(attr)) {
            val = parseInt(val, 10) || 0;
          } else if (attr === 'debaja') {
            val = ['1','TRUE','SI','SÍ'].includes(norm(val));
          } else if (attr === 'visible') {
            val = ['1','TRUE','SI','SÍ'].includes(norm(val));
          } else if (attr === 'codBarras') {
            val = String(val).split('.')[0]; // Aseguramos string sin decimales
          }

          obj[attr] = val;
        });

        // Generar ID automático si falta
        if (!obj.id_articulo) obj.id_articulo = `AUTO-${Date.now()}-${i}`;
        return obj;
      });

    console.log('🔹 Productos válidos parseados:', productos.length);
    console.log('🔹 Ejemplo primeras 5 filas:', productos.slice(0, 5));

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
    if (err.errors) {
      err.errors.forEach(e => console.error('Detalle:', e.message, e.value));
    }
    req.flash('error', 'Error interno al procesar el Excel');
    res.redirect('/admin/productos');
  }
};
