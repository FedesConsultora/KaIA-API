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
    if (!req.file) {
      return res.status(400).json({ msg: 'No se adjuntó archivo .xlsx' });
    }

    /* 1. Leemos la planilla */
    const wb     = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet  = wb.Sheets[wb.SheetNames[0]];
    const rows   = XLSX.utils.sheet_to_json(sheet, { defval: null }); // defval → null evita undefined

    if (!rows.length) {
      return res.status(400).json({ msg: 'La hoja está vacía' });
    }

    /* 2. Preparo un mapa encabezado→atributo del modelo */
    //  Ej: { IDARTICULO: 'id_articulo', DESCRIPCION: 'nombre', ... }
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
      OBSERVACIONES: 'observaciones',
      PUNTOS       : 'puntos',
      PROMO        : 'promo'
    };

    /* 3. Transformo cada fila a la forma que entiende Sequelize */
    const productos = rows
      .filter(r => r.DESCRIPCION) // ignoramos filas sin nombre
      .map(r => {
        const obj = {};
        for (const [col, attr] of Object.entries(map)) {
          obj[attr] = r[col] ?? null;
        }
        return obj;
      });

    if (!productos.length) {
      return res.status(400).json({ msg: 'Ninguna fila válida para importar' });
    }

    /* 4. Inserto / actualizo en bloque */
    await Producto.bulkCreate(productos, {
      updateOnDuplicate: Object.values(map),   // campos que se pisan si ya existe id_articulo
      validate         : true
    });

    res.json({ msg: 'Carga exitosa', total: productos.length });
  } catch (err) {
    console.error('Error al cargar productos:', err);
    res.status(500).json({ msg: 'Error interno al procesar el Excel' });
  }
};