//controllers/productosController.js
import { Op } from 'sequelize';
import { Producto } from '../models/index.js';
import { Promocion } from '../models/index.js';
import XLSX from 'xlsx';
import multer from 'multer';

/* ---------- Multer memoria ---------- */
export const uploadExcel = multer().single('archivo');

// ───────── Buscar por término ─────────
export const buscarProductos = async (req, res) => {
  const { term } = req.query;

  if (!term || term.trim() === '') {
    return res.status(400).json({ msg: 'Debés ingresar un término de búsqueda' });
  }

  try {
    const productos = await Producto.findAll({
      where: {
        [Op.or]: [
          { nombre:      { [Op.like]: `%${term}%` } },
          { compuesto:   { [Op.like]: `%${term}%` } },
          { descripcion: { [Op.like]: `%${term}%` } }
        ]
      },
      include: {
        model: Promocion,
        attributes: ['promo_id', 'nombre', 'tipo', 'beneficio', 'vigencia_desde', 'vigencia_hasta'],
        through: { attributes: [] }
      }
    });

    res.json(productos);
  } catch (err) {
    console.error('Error al buscar productos:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};

// ───────── Obtener por ID ─────────
export const getProductoById = async (req, res) => {
  const { id } = req.params;

  try {
    const prod = await Producto.findByPk(id, {
      include: {
        model: Promocion,
        attributes: ['promo_id', 'nombre', 'tipo', 'beneficio', 'vigencia_desde', 'vigencia_hasta'],
        through: { attributes: [] }
      }
    });

    if (!prod) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.json(prod);
  } catch (err) {
    console.error(`Error al buscar producto ${id}:`, err);
    res.status(500).json({ msg: 'Error interno' });
  }
};

// ───────── Promos activas por producto ─────────
export const getPromosByProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await Producto.findByPk(id, {
      include: {
        model: Promocion,
        where: {
          vigencia_desde: { [Op.lte]: new Date() },
          vigencia_hasta: { [Op.gte]: new Date() }
        },
        required: false,            // si no hay promos activas → []
        through: { attributes: [] }
      }
    });

    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    res.json(producto.Promocions); // plural por convención Sequelize
  } catch (err) {
    console.error('Error al obtener promos:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};


export const cargarProductosDesdeExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'Adjuntá un .xlsx' });

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

    if (!productos.length)
      return res.status(400).json({ msg: 'Ninguna fila válida para importar' });

    const updatable = [
      'costo','precio','presentacion','proveedor','marca','rubro','familia',
      'debaja','cantidad','codBarras','observaciones','visible'
    ];

    await Producto.bulkCreate(productos, {
      updateOnDuplicate: updatable,
      validate: true
    });

    res.json({ msg: 'Carga exitosa', total: productos.length });
  } catch (err) {
    console.error('⛔ Error al cargar productos:', err);
    if (err.errors) {
      err.errors.forEach(e => console.error('Detalle:', e.message, e.value));
    }
    res.status(500).json({ msg: 'Error interno al procesar el Excel', error: err.message });
  }
};



