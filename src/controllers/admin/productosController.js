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
/* ─────────────────────── Importar Excel (ROBUSTO) ─────────────────────── */
export const importExcel = async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error', 'Debés adjuntar un archivo .xlsx');
      return res.redirect('/admin/productos');
    }

    // 1) Leer Excel
    const wb    = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet || !sheet['!ref']) {
      req.flash('error', 'Hoja vacía o inválida en el Excel');
      return res.redirect('/admin/productos');
    }

    // 2) Volcar a matriz de celdas (respetando merges) para poder hacer forward-fill
    const range  = XLSX.utils.decode_range(sheet['!ref']);
    const merges = sheet['!merges'] || [];
    const rows   = [];
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const row = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        let val = sheet[addr]?.v ?? null;

        // Si está vacío, ver si cae dentro de un merge y tomar la celda origen
        if (val === null) {
          const merge = merges.find(m => R >= m.s.r && R <= m.e.r && C >= m.s.c && C <= m.e.c);
          if (merge) {
            const mainCell = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
            val = sheet[mainCell]?.v ?? null;
          }
        }
        row.push(val);
      }
      rows.push(row);
    }

    // 3) Normalizadores
    const norm = (s) => (s ?? '')
      .toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // sin acentos
      .replace(/\s+/g, ' ')                             // colapsa espacios
      .trim()
      .toUpperCase();

    const isTrue  = (v) => ['1','TRUE','SI','SÍ','YES','Y','X'].includes(norm(v));
    const isFalse = (v) => ['0','FALSE','NO','N'].includes(norm(v));

    // Decimales tolerantes (AR/US)
    const parseDecimal = (val) => {
      if (val === null || val === '') return null;
      if (typeof val === 'number') return val;

      let s = String(val).trim();
      s = s.replace(/[^\d.,-]/g, ''); // deja dígitos, coma, punto, signo

      const hasComma = s.includes(',');
      const hasDot   = s.includes('.');

      if (hasComma && hasDot) {
        // Asumimos coma como decimal (12.345,67 => 12345.67)
        s = s.replace(/\./g, '').replace(',', '.');
      } else if (hasComma) {
        // Sólo coma => decimal (12345,67 => 12345.67)
        s = s.replace(',', '.');
      } // sólo punto => ya sirve

      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };

    // 4) Detección de cabecera "inteligente"
    // Nombres normalizados que aceptamos como cabecera
    // podés sumar sinónimos según tu layout de Excel
    const HEADER_SYNONYMS = {
      'ID ARTICULO'   : 'IDARTICULO',
      'IDARTICULO'    : 'IDARTICULO',
      'CODIGO'        : 'IDARTICULO',
      'CODIGOARTICULO': 'IDARTICULO',

      'DESCRIPCION' : 'DESCRIPCION',
      'NOMBRE'      : 'DESCRIPCION',
      'PRODUCTO'    : 'DESCRIPCION',

      'COSTO'       : 'COSTO',

      'PRECIO'      : 'PRECIO1',
      'PRECIO 1'    : 'PRECIO1',
      'PRECIO1'     : 'PRECIO1',
      'PVP'         : 'PRECIO1',
      'PRECIOPUBLICO': 'PRECIO1',

      'PRESENTACION': 'PRESENTACION',
      'PRESENTACION COMERCIAL': 'PRESENTACION',

      'MARCA'      : 'MARCA',
      'RUBRO'      : 'RUBRO',
      'FAMILIA'    : 'FAMILIA',
      'PROVEEDOR'  : 'PROVEEDOR',

      'CODIGO DE BARRAS': 'CODIGOBARRAS',
      'CODIGOBARRAS'    : 'CODIGOBARRAS',
      'EAN'             : 'CODIGOBARRAS',
      'CODBARRAS'       : 'CODIGOBARRAS',

      'DE BAJA'    : 'DEBAJA',
      'DEBAJA'     : 'DEBAJA',
      'BAJA'       : 'DEBAJA',

      'PUBLICAR'   : 'PUBLICAR',
      'VISIBLE'    : 'PUBLICAR',

      'DISP'       : 'DISP',
      'DISPONIBLE' : 'DISP',
      'CANTIDAD'   : 'DISP',

      'OBSERVACIONES': 'OBSERVACIONES',
      'OBS'          : 'OBSERVACIONES',

      'PRINCIPIO ACTIVO': 'PRINCIPIOACTIVO',
      'PRINCIPIOACTIVO' : 'PRINCIPIOACTIVO',

      'USO PRINCIPAL' : 'USOPRINCIPAL',
      'USOPRINCIPAL'  : 'USOPRINCIPAL'
    };

    const REQUIRED = ['IDARTICULO','DESCRIPCION','PRECIO1']; // con 2/3 ya aceptamos
    const normalizeHeaderToken = (raw) => HEADER_SYNONYMS[norm(raw)] || norm(raw);

    const guessHeaderRow = (rows) => {
      for (let i = 0; i < rows.length; i++) {
        const normalized = rows[i].map(normalizeHeaderToken);
        const hits = REQUIRED.filter(h => normalized.includes(h)).length;
        if (hits >= 2) return i;
      }
      return -1;
    };

    const headerRowIndex = guessHeaderRow(rows);
    if (headerRowIndex === -1) {
      req.flash('error', 'No pude detectar la fila de cabeceras (IdArticulo/Descripcion/Precio). Revisá el Excel.');
      return res.redirect('/admin/productos');
    }

    const headersNorm = rows[headerRowIndex].map(normalizeHeaderToken);
    const dataRows    = rows.slice(headerRowIndex + 1);

    // 5) Forward-fill: completa celdas vacías con el último valor visto por columna
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

    // 6) Mapeo cabecera → campos del modelo
    // (usar los mismos nombres que tu modelo Producto)
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
      OBSERVACIONES: 'observaciones',
      PRINCIPIOACTIVO: 'principio_activo',
      USOPRINCIPAL : 'uso_principal'
    };

    // 7) Construir objetos Producto desde las filas
    // índice obligatorio para filtrar filas vacías
    const idxDescripcion = headersNorm.findIndex(h => h === 'DESCRIPCION');

    const productos = filledRows
      .filter(r => idxDescripcion >= 0 && r[idxDescripcion])
      .map((r, i) => {
        const obj = {};
        r.forEach((val, idx) => {
          const key = headersNorm[idx];
          const attr = map[key];
          if (!attr) return;            // columna no mapeada
          if (val === null || val === '') return;

          let v = val;

          if (['costo','precio'].includes(attr)) {
            v = parseDecimal(v);
          } else if (attr === 'cantidad') {
            v = parseInt(String(v).replace(/\D+/g,''), 10);
            if (!Number.isFinite(v)) v = 0;
          } else if (attr === 'debaja') {
            v = isTrue(v);
          } else if (attr === 'visible') {
            v = isTrue(v);
          } else if (attr === 'codBarras') {
            v = String(v).split('.')[0]; // evita notación 123456789012.0
          } else {
            // strings comunes
            v = (v ?? '').toString().trim();
          }

          obj[attr] = v;
        });

        // Limpieza de strings vacíos => null
        Object.keys(obj).forEach(k => { if (obj[k] === '') obj[k] = null; });

        // Sanitarios
        if (typeof obj.cantidad !== 'number' || isNaN(obj.cantidad)) obj.cantidad = 0;
        if (!obj.id_articulo) obj.id_articulo = `AUTO-${Date.now()}-${i}`;

        return obj;
      });

    if (!productos.length) {
      req.flash('error', 'No se encontró ninguna fila válida para importar');
      return res.redirect('/admin/productos');
    }

    // 8) Upsert masivo
    // Agregá aquí todos los campos que quieras actualizar si el id_articulo ya existe
    const updatable = [
      'costo','precio','presentacion','proveedor','marca','rubro','familia',
      'debaja','cantidad','codBarras','observaciones','visible',
      'principio_activo','uso_principal','nombre'
    ];

    await Producto.bulkCreate(productos, {
      updateOnDuplicate: updatable,
      validate: true
    });

    // (Opcional) conteo para verificar que quedó todo
    // const totalDB = await Producto.count();
    // console.log('✅ Productos totales tras import:', totalDB);

    req.flash('success', `Se importaron/actualizaron ${productos.length} productos correctamente`);
    res.redirect('/admin/productos');
  } catch (err) {
    console.error('⛔ Error al importar Excel:', err);
    if (err.errors) err.errors.forEach(e => console.error('Detalle:', e.message, e.value));
    req.flash('error', 'Error interno al procesar el Excel');
    res.redirect('/admin/productos');
  }
};
