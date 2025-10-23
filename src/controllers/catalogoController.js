// src/controllers/catalogoController.js
import { Op } from 'sequelize';
import { Producto, Promocion } from '../models/index.js';
import XLSX from 'xlsx';
import multer from 'multer';

/* ---------- Multer memoria ---------- */
export const uploadExcel = multer().single('archivo');

// Helpers comunes
const likeTerm = (s) => ({ [Op.like]: `%${s}%` });

/* ───────── Buscar por término (con paginación simple) ───────── */
export const buscarProductos = async (req, res) => {
  const term = (req.query.term || '').trim();
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '25', 10), 5), 100);

  if (!term) return res.status(400).json({ msg: 'Debés ingresar un término de búsqueda' });

  try {
    const where = {
      visible: true,
      debaja : false,
      [Op.or]: [
        { nombre      : likeTerm(term) },
        { presentacion: likeTerm(term) },
        { marca       : likeTerm(term) },
        { rubro       : likeTerm(term) },
        { familia     : likeTerm(term) },
        { observaciones: likeTerm(term) },
      ],
    };

    const { rows, count } = await Producto.findAndCountAll({
      where,
      include: {
        model: Promocion,
        // atributos REALES del modelo Promocion
        attributes: ['id', 'nombre', 'tipo', 'detalle', 'regalo', 'vigencia_desde', 'vigencia_hasta', 'vigente'],
        through: { attributes: [] },
        required: false
      },
      order: [['cantidad', 'DESC'], ['nombre', 'ASC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });

    return res.json({
      items: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(count / pageSize), 1)
    });
  } catch (err) {
    console.error('Error al buscar productos:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};

/* ───────── Obtener por ID ───────── */
export const getProductoById = async (req, res) => {
  const { id } = req.params;

  try {
    const prod = await Producto.findByPk(id, {
      include: {
        model: Promocion,
        attributes: ['id', 'nombre', 'tipo', 'detalle', 'regalo', 'vigencia_desde', 'vigencia_hasta', 'vigente'],
        through: { attributes: [] },
        required: false
      }
    });

    if (!prod) return res.status(404).json({ msg: 'Producto no encontrado' });
    res.json(prod);
  } catch (err) {
    console.error(`Error al buscar producto ${id}:`, err);
    res.status(500).json({ msg: 'Error interno' });
  }
};

/* ───────── Promos activas por producto ───────── */
export const getPromosByProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await Producto.findByPk(id, {
      include: {
        model: Promocion,
        where: {
          vigencia_desde: { [Op.lte]: new Date() },
          vigencia_hasta: { [Op.gte]: new Date() },
          vigente: true
        },
        required: false,
        through: { attributes: [] }
      }
    });

    if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });
    res.json(producto.Promocions || []);
  } catch (err) {
    console.error('Error al obtener promos:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};

/* ───────── Importar Excel (con merges y normalización) ───────── */
export const cargarProductosDesdeExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'Adjuntá un .xlsx' });

    const wb    = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet || !sheet['!ref']) return res.status(400).json({ msg: 'Hoja vacía o inválida' });

    const range  = XLSX.utils.decode_range(sheet['!ref']);
    const merges = sheet['!merges'] || [];
    const rows   = [];

    // Leer celdas respetando merges
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const row = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        let val = sheet[addr]?.v ?? null;
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
      OBSERVACIONES: 'observaciones',
      // opcionales si decidís agregarlos luego al modelo:
      PRINCIPIOACTIVO: 'principio_activo',
      USOPRINCIPAL  : 'uso_principal'
    };

    const headerRowIndex = rows.findIndex(r => r.some(c => c));
    if (headerRowIndex < 0) return res.status(400).json({ msg: 'No se detectó fila de encabezados' });

    const headersNorm = rows[headerRowIndex].map(norm);
    const dataRows = rows.slice(headerRowIndex + 1);

    // Forward-fill
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
          const campo = map[headersNorm[idx]];
          if (!campo || val === null || val === '') return;

          let v = val;
          if (['costo','precio'].includes(campo)) {
            v = parseDecimal(v);
          } else if (campo === 'cantidad') {
            v = parseInt(v, 10) || 0;
          } else if (campo === 'debaja') {
            v = ['1','TRUE','SI','SÍ'].includes(norm(v));
          } else if (campo === 'visible') {
            v = ['1','TRUE','SI','SÍ'].includes(norm(v));
          } else if (campo === 'codBarras') {
            v = String(v).split('.')[0];
          } else {
            v = (v ?? '').toString().trim();
          }
          obj[campo] = v;
        });

        if (!obj.id_articulo) obj.id_articulo = `AUTO-${Date.now()}-${i}`;
        return obj;
      });

    if (!productos.length)
      return res.status(400).json({ msg: 'Ninguna fila válida para importar' });

    const updatable = [
      'costo','precio','presentacion','proveedor','marca','rubro','familia',
      'debaja','cantidad','codBarras','observaciones','visible',
      // opcionales si existen en el modelo:
      'principio_activo','uso_principal','nombre'
    ];

    await Producto.bulkCreate(productos, {
      updateOnDuplicate: updatable,
      validate: true
    });

    res.json({ msg: 'Carga exitosa', total: productos.length });
  } catch (err) {
    console.error('⛔ Error al cargar productos:', err);
    if (err.errors) err.errors.forEach(e => console.error('Detalle:', e.message, e.value));
    res.status(500).json({ msg: 'Error interno al procesar el Excel', error: err.message });
  }
};
