# Dump técnico de módulos App

> Generado desde `src` — 10/11/2025, 02:10:45


---

### src/config/app.js (5 líneas)

```js
// src/config/app.js
export const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'dev-token';
// Tel. Administrativo (solo dígitos para wa.me)
export const ADMIN_PHONE_DIGITS = process.env.ADMIN_PHONE_DIGITS || '5492216374218';

```

---

### src/config/texts.js (151 líneas)

```js
// src/config/texts.js
const TEXTS = {
  brand: { nombre: 'KrönenVet' },

  /* ====== Saludos / gating ====== */
  saludo_header: 'Hola {nombre} 👋 Soy KaIA, tu asistente virtual de KrönenVet.',
  ask_cuit: `👋 ¡Hola! Soy KaIA, tu asistente virtual de KrönenVet.

Estoy acá para ayudarte con consultas sobre productos, stock y tu cuenta corriente.
Pero antes de seguir, necesito verificar que seas parte de nuestra comunidad profesional. 🩺

📌 Por favor, escribime tu **CUIT sin guiones ni espacios** para validar tu identidad.`,
  bad_cuit:
    '❌ No encontré ese CUIT en nuestra base. ¿Podrías revisarlo y volver a escribirlo **sin guiones ni espacios**?',
  ok_cuit: '¡Listo {nombre}! CUIT verificado ✅ Tu sesión vale {ttl} días.',

  /* ====== Búsqueda / recomendación ====== */
  pedir_consulta: 'Contame qué necesitás (nombre comercial, marca o para qué lo buscás).',
  no_match:
    'No encontré productos con esa descripción. Probá con el nombre comercial, la marca o el **compuesto activo**.',
  refinar_tip:
    'Si querés, agregá **especie** (perro/gato), **presentación** (comprimidos/pipeta/inyección), **marca** o **compuesto activo** para afinar.',
  refinar_follow:
    'Podés seguir afinando: sumá marca, presentación, especie o compuesto activo. Si preferís, escribí "menú".',

  // 🆕 Mensajes de listado “completo” o truncado por límite de WhatsApp
  mostrando_todos: 'Encontré {total} producto(s). Te muestro todos:',
  muchos_resultados: 'Encontré {total} productos. WhatsApp permite listar hasta {max} por mensaje. Te muestro {shown}. Podés refinar por *marca* (ej. “marca X”), *presentación* (pipeta/comprimido) o *peso*.',

  reco_pedir_especie: '¿Para qué especie lo buscás?',

  // ====== Desambiguación ======
  desambig_species_header: 'Elegí especie',
  desambig_species_body: '¿Para qué especie lo estás buscando?',
  desambig_peso_header: 'Elegí franja de peso',
  desambig_peso_body_gato: '¿Cuánto pesa el gato? Elegí una franja:',
  desambig_peso_body_perro: '¿Cuánto pesa el perro? Elegí una franja:',
  desambig_peso_body_neutral: '¿Cuánto pesa? Elegí una franja:',
  desambig_form_header: 'Elegí presentación',
  desambig_form_body: '¿Preferís pipeta, comprimido o inyectable?',
  desambig_pack_header: 'Elegí pack',
  desambig_pack_body: '¿Qué cantidad preferís?',
  desambig_brand_header: 'Elegí marca',
  desambig_brand_body: '¿Tenés preferencia de marca?',
  desambig_active_header: 'Elegí compuesto activo',
  desambig_active_body: '¿Qué compuesto preferís?',

  // ====== Listado / ficha ======
  productos_list_title: 'Sugerencias',
  productos_list_header: 'KaIA – Productos',
  productos_list_body: 'Elegí un producto para ver la ficha completa:',
  productos_select_header: 'Sugerencias según tu consulta',
  producto_open_error: 'No pude abrir ese producto.',
  producto_ficha_header: '🧾 Ficha del producto',

  // CTA post-respuesta
  cta_como_seguimos: '¿Cómo seguimos?',

  /* ====== Menú principal ====== */
  menu_main_body: '¿Qué te gustaría hacer?',
  menu_main_title: 'KaIA – {marca}',
  menu_main_btn: 'Elegí',
  menu_item_buscar_title: '🔍 Buscar productos',
  menu_item_buscar_desc: 'Nombre, marca o necesidad',
  menu_item_promos_title: '🎁 Promociones',
  menu_item_promos_desc: 'Ofertas vigentes',
  menu_item_editar_title: '✍️ Mis datos',
  menu_item_editar_desc: 'Cambiar nombre o email',
  menu_item_logout_title: '🚪 Cerrar sesión',
  menu_item_logout_desc: 'Luego volverás a verificar tu CUIT',

  // Volver a menú por inactividad
  menu_back_idle: 'Volvemos al inicio para ayudarte mejor. 👇',

  /* ====== Promociones ====== */
  promos_list_title: 'Promociones',
  promos_list_header: 'KaIA – Promos',
  promos_list_body: 'Promos vigentes:',
  promos_empty: 'Disculpá, en este momento no tenemos ninguna promoción activa.',
  promo_open_error: 'No pude abrir esa promoción.',

  /* ====== Edición de datos ====== */
  editar_intro: 'Podés actualizar tus datos. ¿Qué querés cambiar?',
  editar_pedir_nombre:
    'Decime tu nombre tal como querés que figure (por ejemplo: “Clínica San Martín”).',
  editar_confirmar_nombre:
    'Vas a cambiar tu nombre a:\n“{valor}”\n\n¿Confirmás el cambio?',
  editar_ok_nombre: '¡Hecho, {nombre}! Actualicé tu nombre. ✍️',
  editar_pedir_email: 'Decime tu email (ej: ejemplo@dominio.com).',
  editar_confirmar_email:
    'Vas a cambiar tu email a:\n“{valor}”\n\n¿Confirmás el cambio?',
  editar_ok_email: 'Perfecto {nombre}, guardé tu email {email}. 📧',
  editar_email_invalido: 'Ese email no parece válido. Probá de nuevo (ej: ejemplo@dominio.com).',

  /* ====== Logout ====== */
  logout_confirm:
    '¿Querés cerrar sesión ahora? Vas a tener que volver a verificar tu CUIT.\n\n¿Confirmás cerrar sesión?',
  logout_ok:
    'Cerré tu sesión, {nombre}. ¡Gracias por usar KaIA! Cuando quieras seguir, decime tu CUIT para verificarte de nuevo. 👋',

  /* ====== Confirmación genérica ====== */
  confirmado: 'Listo, ¡hecho! ✅',
  cancelado: 'Cancelé la acción. No hice cambios. ↩️',

  /* ====== Ejecutivo ====== */
  ejecutivo_contacto_enviado:
    'Te compartí el contacto de tu ejecutivo {ejecutivo}. También podés escribirle directo: wa.me/{telefono}',
  ejecutivo_sin_asignar:
    'Todavía no tenés un ejecutivo asignado. **Nos vamos a comunicar a la brevedad.**',
  escala_ejecutivo:
    'Te comparto el contacto de tu ejecutivo de cuentas **{ejecutivo}** para que continúen por ahí. 👇',

  // 🆕 Derivaciones post-ficha
  handoff_ejecutivo:
    'Si querés cerrarlo ya, escribile a tu ejecutivo **{ejecutivo}**: wa.me/{telefono}',
  handoff_admin:
    'Por ahora no tenés un ejecutivo asignado. Te paso el contacto de **Administración** (wa.me/{telefono}) para que te asignen uno y sigamos tu pedido.',

  /* ====== Feedback post-inactividad ====== */
  fb_ping: '¿Te fue útil esta ayuda?',
  fb_ok_resp: '¡Genial! Gracias por contarnos. 🙌',
  fb_meh_ask: 'Te leo 👇 Contame en un mensaje qué mejorarías.',
  fb_txt_empty: '¿Podés escribir tu comentario? 👇',
  fb_txt_ok: '¡Gracias! Registré tu comentario. 💬',

  /* ====== Ayuda / cierre ====== */
  ayuda: 'Soy KaIA, asistente de {marca}. Puedo recomendar productos, conectarte con tu ejecutivo y actualizar tus datos.',
  despedida: '¡Gracias por escribirnos, {nombre}! Que tengas un gran día. 🙌',
  error_generico: 'Tuvimos un inconveniente. Probá de nuevo en unos segundos.',

  /* ====== Botones / labels comunes ====== */
  btn_elegi: 'Elegí',
  btn_confirmar: '✅ Confirmar',
  btn_cancelar: '↩️ Cancelar',
  btn_volver: '↩️ Volver',
  btn_humano: 'Hablar con asesor',
  btn_menu: 'Volver al menú',
  btn_perro: '🐶 Perro',
  btn_gato: '🐱 Gato'
};

function tpl(str, vars = {}) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? '').toString());
}
export function t(key, vars) {
  const val = TEXTS[key];
  if (val == null) return '';
  return tpl(val, { marca: TEXTS.brand.nombre, ...vars });
}
export default TEXTS;

```

---

### src/controllers/admin/ejecutivosController.js (64 líneas)

```js
// src/controllers/admin/ejecutivosController.js
import { sequelize, EjecutivoCuenta, Usuario } from '../../models/index.js';
import multer from 'multer';

export const uploadExcel = multer().single('archivo'); // reservado por si lo usás luego

/* ───────── Listado ───────── */
export const list = async (_req, res) => {
  const ejecutivos = (await EjecutivoCuenta.findAll({
    include: [{ model: Usuario, attributes: [] }],
    attributes: {
      include: [[sequelize.fn('COUNT', sequelize.col('Usuarios.id')), 'clientes']]
    },
    group: ['EjecutivoCuenta.id'],
    order: [['nombre', 'ASC']]
  })).map(e => e.toJSON());

  res.render('admin/ejecutivos/list', {
    title: 'Ejecutivos',
    ejecutivos
  });
};

/* ───────── Form ───────── */
export const formNew = (_req, res) =>
  res.render('admin/ejecutivos/form', { title: 'Nuevo ejecutivo', ejecutivo: {} });

export const formEdit = async (req, res) => {
  const ejecutivo = await EjecutivoCuenta.findByPk(req.params.id);
  if (!ejecutivo) return res.redirect('/admin/ejecutivos');

  res.render('admin/ejecutivos/form', {
    title   : `Editar ${ejecutivo.nombre}`,
    ejecutivo,
    isEdit  : true
  });
};

/* ───────── CRUD ───────── */
export const create = async (req, res) => {
  const { nombre, phone, email } = req.body;
  await EjecutivoCuenta.create({ nombre, phone, email });
  req.flash('success', `Ejecutivo ${nombre} creado`);
  res.redirect('/admin/ejecutivos');
};

export const update = async (req, res) => {
  const { nombre, phone, email } = req.body;
  await EjecutivoCuenta.update({ nombre, phone, email }, { where: { id: req.params.id } });
  req.flash('success', `Ejecutivo ${nombre} actualizado`);
  res.redirect('/admin/ejecutivos');
};

export const remove = async (req, res) => {
  const ej = await EjecutivoCuenta.findByPk(req.params.id);
  if (!ej) {
    req.flash('error', 'El ejecutivo no existe');
    return res.redirect('/admin/ejecutivos');
  }
  await ej.destroy();
  req.flash('success', `Ejecutivo ${ej.nombre} eliminado`);
  res.redirect('/admin/ejecutivos');
};

```

---

### src/controllers/admin/productosController.js (434 líneas)

```js
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

```

---

### src/controllers/admin/promosController.js (215 líneas)

```js
// src/controllers/admin/promosController.js
import { Promocion, Producto, sequelize } from '../../models/index.js';
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
export const formNew = async (_req, res) => {
  // Solo productos activos (visibles y no de baja)
  const productosActivos = (await Producto.findAll({
    where: { visible: true, debaja: false },
    attributes: ['id','nombre','marca','presentacion'],
    order: [['nombre','ASC']]
  })).map(p => p.get({ plain: true }));

  res.render('admin/promos/form', {
    title: 'Nueva promoción',
    promo: { vigencia_desde_iso: '', vigencia_hasta_iso: '', productos: [] },
    productos: productosActivos
  });
};

export const formEdit = async (req, res) => {
  const promoInst = await Promocion.findByPk(req.params.id, {
    include: { model: Producto, attributes: ['id'] }
  });
  if (!promoInst) return res.redirect('/admin/promos');

  const p = promoInst.get({ plain: true });
  p.vigencia_desde_iso = p.vigencia_desde ? p.vigencia_desde.toISOString().slice(0,10) : '';
  p.vigencia_hasta_iso = p.vigencia_hasta ? p.vigencia_hasta.toISOString().slice(0,10) : '';
  // Arreglo de ids para el helper (includes)
  p.productos = (p.Productos || []).map(pr => pr.id);

  const productosActivos = (await Producto.findAll({
    where: { visible: true, debaja: false },
    attributes: ['id','nombre','marca','presentacion'],
    order: [['nombre','ASC']]
  })).map(pr => pr.get({ plain: true }));

  res.render('admin/promos/form', {
    title : `Editar ${p.nombre}`,
    promo : p,
    productos: productosActivos,
    isEdit: true
  });
};

function pickPromoPayload(body) {
  const {
    nombre, tipo, detalle, regalo, presentacion, especie, laboratorio,
    productos_txt, stock_disponible, vigencia_desde, vigencia_hasta, vigente
  } = body;
  return {
    nombre: (nombre ?? '').toString().trim(),
    tipo, detalle, regalo, presentacion, especie, laboratorio,
    productos_txt: productos_txt ?? null,
    stock_disponible: Number(stock_disponible ?? 0) || 0,
    vigencia_desde: vigencia_desde ? new Date(vigencia_desde) : null,
    vigencia_hasta: vigencia_hasta ? new Date(vigencia_hasta) : null,
    vigente: strToBool(vigente ?? true)
  };
}

export const create = async (req, res) => {
  try {
    const { productosIds } = req.body;
    const nueva = await Promocion.create(pickPromoPayload(req.body));
    if (Array.isArray(productosIds) && productosIds.length) {
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
    const { productosIds } = req.body;
    await Promocion.update(pickPromoPayload(req.body), { where: { id: req.params.id } });
    const promo = await Promocion.findByPk(req.params.id);
    if (Array.isArray(productosIds)) await promo.setProductos(productosIds);
    req.flash('success', `Promoción “${req.body.nombre}” actualizada con éxito`);
    res.redirect('/admin/promos');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al actualizar promoción');
    res.redirect(`/admin/promos/${req.params.id}/edit`);
  }
};

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

/* ─────────────── Purge total (mes siguiente) ─────────────── */
export const purgeAll = async (req, res) => {
  try {
    if (req.body?.confirm !== 'ELIMINAR-PROMOS') {
      req.flash('error', 'Debés escribir ELIMINAR-PROMOS para confirmar.');
      return res.redirect('/admin/promos');
    }
    await sequelize.transaction(async (t) => {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });
      await sequelize.query('TRUNCATE TABLE productos_promociones', { transaction: t });
      await sequelize.query('TRUNCATE TABLE promociones', { transaction: t });
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
    });
    req.flash('success', 'Se eliminaron todas las promociones.');
  } catch (err) {
    console.error('purgeAll promos error:', err);
    req.flash('error', 'No se pudo vaciar la tabla de promociones.');
  }
  res.redirect('/admin/promos');
};

/* ─────────────── Importar Excel (solo info) ─────────────── */
export const importExcel = async (req, res) => {
  try {
    if (!req.file) { req.flash('error', 'Adjuntá un archivo .xlsx'); return res.redirect('/admin/promos'); }

    const wb    = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows  = XLSX.utils.sheet_to_json(sheet, { defval: null });

    if (!rows.length) { req.flash('error', 'La hoja está vacía'); return res.redirect('/admin/promos'); }

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

    const normKey = (k) => k ? k.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim() : '';

    const promos = rows
      .map((r) => {
        const obj = {};
        for (const [colRaw, val] of Object.entries(r)) {
          const col  = normKey(colRaw);
          const attr = map[col];
          if (!attr) continue;
          let v = val;
          if (attr === 'stock_disponible')           v = parseInt(String(v).replace(',', '.'), 10) || 0;
          else if (attr === 'vigente')               v = strToBool(v) ?? true;
          else if (attr === 'vigencia_desde' || attr === 'vigencia_hasta') v = v ? new Date(v) : null;
          obj[attr] = v;
        }
        return obj;
      })
      .filter(p => p.nombre && p.nombre.toString().trim() !== '');

    if (!promos.length) { req.flash('error', 'No se encontró ninguna fila válida'); return res.redirect('/admin/promos'); }

    await Promocion.bulkCreate(promos, {
      updateOnDuplicate: ['tipo','detalle','regalo','presentacion','especie','laboratorio','productos_txt','stock_disponible','vigencia_desde','vigencia_hasta','vigente'],
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

```

---

### src/controllers/admin/usuariosController.js (166 líneas)

```js
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

```

---

### src/controllers/catalogoController.js (244 líneas)

```js
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

```

---

### src/controllers/compraController.js (48 líneas)

```js
import { Compra, Producto, Promocion } from '../models/index.js';

export const registrarCompra = async (req, res) => {
  const { productoId, qty, promo_aplicada = null } = req.body;
  const { user } = req;

  try {
    const producto = await Producto.findByPk(productoId);
    if (!producto) return res.status(404).json({ msg: 'Producto no encontrado' });

    const precio_unit = producto.precio;
    const subtotal = precio_unit * qty;

    const nueva = await Compra.create({
      usuarioId: user.id,
      productoId,
      qty,
      precio_unit,
      subtotal,
      promo_aplicada
    });

    res.status(201).json({ msg: 'Compra registrada', data: nueva });
  } catch (err) {
    console.error('Error al registrar compra:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};

export const listarMisCompras = async (req, res) => {
  const { user } = req;
  try {
    const compras = await Compra.findAll({
      where: { usuarioId: user.id },
      include: [
        { model: Producto },
        { model: Promocion, required: false }
      ],
      order: [['fecha', 'DESC']]
    });

    res.json(compras);
  } catch (err) {
    console.error('Error al listar compras:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};

```

---

### src/controllers/cuentaController.js (21 líneas)

```js
// src/controllers/cuentaController.js
import { CuentaCorriente } from '../models/index.js'; 

export const getSaldo = async (req, res) => {
  const { user } = req;
  try {
    const cuenta = await CuentaCorriente.findOne({
      where: { usuarioId: user.id }
    });
    if (!cuenta) {
      return res.status(404).json({ msg: 'Cuenta no encontrada' });
    }
    res.json({
      saldo: cuenta.saldo,
      credito: cuenta.credito
    });
  } catch (err) {
    console.error('Error al obtener saldo:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};
```

---

### src/controllers/feedbackController.js (58 líneas)

```js
// src/controllers/feedbackController.js
import { Op } from 'sequelize';
import { Feedback } from '../models/index.js';

export async function registrarFeedback(req, res) {
  try {
    const { flow_id, satisfecho, comentario, meta } = req.body || {};
    const cuit = req.cuit || null;          // si tu middleware lo setea
    const phone = req.body?.phone || null;  // opcional

    await Feedback.create({
      phone, cuit, flow_id: flow_id || 'wh_feedback',
      satisfecho: satisfecho || null,
      comentario: (comentario || '').toString().slice(0, 3000),
      meta: meta || null
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('registrarFeedback error:', e);
    res.status(500).json({ ok: false });
  }
}

export async function listarFeedback(req, res) {
  try {
    const q = (req.query.q || '').trim();
    const where = q ? {
      [Op.or]: [
        { cuit: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
        { comentario: { [Op.like]: `%${q}%` } }
      ]
    } : undefined;

    const rows = await Feedback.findAll({
      where,
      order: [['creado_en', 'DESC']],   // 👈 usa tu columna real
      limit: 500
    });

    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error('listarFeedback error:', e);
    res.status(500).json({ ok: false });
  }
}

/** Listado Admin (vista) */
export async function listAdmin(_req, res) {
  const rows = await Feedback.findAll({
    order: [['creado_en', 'DESC']],     // 👈 usa tu columna real
    limit: 500
  });
  const items = rows.map(r => r.get({ plain: true }));
  res.render('admin/feedback/list', { title: 'Feedback', items });
}

```

---

### src/controllers/recomendacionController.js (29 líneas)

```js
// src/controllers/recomendacionController.js
// ----------------------------------------------------
import { recomendarDesdeBBDD } from '../services/recommendationService.js';
import { responderConGPTStrict } from '../services/gptService.js';

/**
 * Recibe el texto del vete → busca en BBDD → arma lista de válidos/similares → llama a GPT (guardrails)
 * Válido para REST (/api/recomendar) y para pruebas directas.
 */
export async function recomendarProducto(req, res) {
  try {
    const mensajeVet = req.body?.mensaje || req.query?.mensaje;
    if (!mensajeVet) return res.status(400).json({ ok: false, msg: 'Falta mensaje' });

    // 1) Buscar candidatos y similares SOLO desde BBDD (multi-producto)
    const { validos = [], top, similares = [] } = await recomendarDesdeBBDD(mensajeVet);

    // 2) Pasar a GPT 1..3 productos válidos (si hay) + similares
    const productosValidos = validos.length ? validos.slice(0, 3) : (top ? [top] : []);

    // 3) Responder con GPT (formato y reglas estrictas)
    const respuesta = await responderConGPTStrict(mensajeVet, { productosValidos, similares });

    return res.json({ ok: true, respuesta });
  } catch (err) {
    console.error('❌ Error recomendación:', err);
    return res.status(500).json({ ok: false, msg: 'Error interno' });
  }
}
```

---

### src/controllers/webhookController.js (151 líneas)

```js
// src/controllers/webhookController.js
import 'dotenv/config';

import { sendWhatsAppText, sendWhatsAppButtons, sendWhatsAppContacts } from '../services/whatsappService.js';
import { t } from '../config/texts.js';

import { VERIFY_TOKEN, ADMIN_PHONE_DIGITS } from '../config/app.js';
import { extractIncomingMessages } from '../services/wabaParser.js';

import {
  getOrCreateSession, ensureExpiry, isExpired, bumpExpiry,
  shouldPromptFeedback, markFeedbackPrompted,
  shouldResetToMenu, resetToMenu, bumpLastInteraction, getState, setState
} from '../services/waSessionService.js';

import { detectarIntent, isLikelyGreeting, sanitizeText } from '../services/intentService.js';
import { getVetByCuit, firstName } from '../services/userService.js';

import * as FlowAuth from '../flows/flow-auth.js';
import * as FlowMenu from '../flows/flow-menu.js';
import * as FlowSearch from '../flows/flow-search.js';
import * as FlowEdit from '../flows/flow-edit.js';
import * as FlowPromos from '../flows/flow-promos.js';
import * as FlowFeedback from '../flows/flow-feedback.js';
import { showMainMenu } from '../services/wabaUiService.js';

/* ========== VERIFY (hub.challenge) ========== */
export function handleWhatsAppVerify(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).type('text/plain').send(String(challenge));
  }
  return res.sendStatus(403);
}

/* ========== MAIN WEBHOOK ========== */
export async function handleWhatsAppMessage(req, res) {
  try {
    // WhatsApp exige 200 rápido
    res.sendStatus(200);

    const messages = extractIncomingMessages(req.body);
    if (!messages.length) return;

    for (const { from, text } of messages) {
      const normText = sanitizeText(text || '');
      let session = await getOrCreateSession(from);
      await ensureExpiry(session);
      await bumpLastInteraction(from);

      // Feedback ping (solo una vez)
      if (shouldPromptFeedback(session)) {
        await sendWhatsAppButtons(from, t('fb_ping'), [
          { id: 'fb_ok',  title: '👍 Sí' },
          { id: 'fb_meh', title: '👎 No' },
          { id: 'fb_txt', title: '💬 Dejar comentario' }
        ]);
        await markFeedbackPrompted(from);
      }

      // 1) Posible respuesta de desambiguación (“disambig:*”) → FlowSearch primero
      if (await FlowSearch.tryHandleDisambig(from, normText)) continue;

      // 2) Gating CUIT / expiración → FlowAuth
      if (await FlowAuth.handleAuthGate({ from, normText })) continue;

      // 3) Inactividad → volvemos a menú
      session = await getOrCreateSession(from);
      if (shouldResetToMenu(session)) {
        await resetToMenu(from);
        const vet = await getVetByCuit(session.cuit);
        await sendWhatsAppText(from, t('menu_back_idle'));
        await showMainMenu(from, firstName(vet?.nombre) || '');
        continue;
      }

      // 4) Ya logueado: renovar TTL
      await bumpExpiry(from);
      const vet = await getVetByCuit(session.cuit);
      const nombre = firstName(vet?.nombre) || '';
      const state = await getState(from);
      const intent = detectarIntent(normText);

      // 5) Feedback flow (cubre fb_ok, fb_meh, fb_txt y el texto libre)
      if (await FlowFeedback.handle({ from, intent, normText })) continue;

      // 6) Promos (lista y abrir “promo:<id>”)
      if (await FlowPromos.handle({ from, intent, normText })) continue;

      // 7) Edición de datos (entrada por “editar”, “editar_nombre”, “editar_email” o estados de captura)
      if (await FlowEdit.handle({ from, intent, normText, vet, nombre })) continue;

      // 8) Humano directo
      if (intent === 'humano') {
        if (vet?.EjecutivoCuenta) {
          const ej = vet.EjecutivoCuenta;
          await sendWhatsAppContacts(from, [{
            formatted_name: ej.nombre,
            first_name: ej.nombre?.split(' ')[0],
            last_name: ej.nombre?.split(' ').slice(1).join(' ') || undefined,
            org: 'KrönenVet',
            phones: ej.phone ? [{ phone: ej.phone, type: 'WORK' }] : [],
            emails: ej.email ? [{ email: ej.email, type: 'WORK' }] : []
          }]);
          await sendWhatsAppText(from, t('ejecutivo_contacto_enviado', { ejecutivo: ej.nombre, telefono: ej.phone || '' }));
        } else {
          await sendWhatsAppContacts(from, [{
            formatted_name: 'Administración KronenVet',
            first_name: 'Administración',
            last_name: 'KronenVet',
            org: 'KrönenVet',
            phones: [{ phone: ADMIN_PHONE_DIGITS, type: 'WORK' }]
          }]);
          await sendWhatsAppText(from, t('handoff_admin', { telefono: ADMIN_PHONE_DIGITS }));
        }
        continue;
      }

      // 9) Menú / saludos / ayuda → mostrar menú
      if (['menu','saludo','ayuda','gracias'].includes(intent) || isLikelyGreeting(normText)) {
        await FlowSearch.resetRecoUI(from);
        await showMainMenu(from, nombre);
        continue;
      }

      // 10) Buscar (entra al estado “awaiting_consulta”)
      if (intent === 'buscar') {
        await setState(from, 'awaiting_consulta');
        await sendWhatsAppText(from, t('pedir_consulta'));
        continue;
      }

      // 11) Despedida
      if (intent === 'despedida') {
        await sendWhatsAppText(from, t('despedida', { nombre }));
        continue;
      }

      // 12) Default: flujo de búsqueda y desambiguación (incluye “prod:<id>”)
      if (await FlowSearch.handle({ from, state, normText, vet, nombre })) continue;

      // 13) Último fallback
      await sendWhatsAppText(from, t('error_generico'));
    }
  } catch (err) {
    console.error('❌ Error en webhook WhatsApp:', err);
  }
}

```

---

### src/dev/print-app-to-clipboard.js (163 líneas)

```js
// src/dev/print-app-to-clipboard.js
// ----------------------------------------------------
// Junta TODO (sin límite) de services, controllers, jobs, config, flows, etc.,
// lo formatea en Markdown y lo copia al portapapeles.
// Uso: node src/dev/print-app-to-clipboard.js
//
// Requiere: Node 18+
// Linux: necesita tener instalado xclip o xsel para copiar al clipboard.

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(process.cwd(), 'src');

// 👇 Carpetas ampliadas
const FOLDERS = [
  'services',
  'controllers',
  'jobs',
  'config',
  'helpers',
  'middlewares',
  'flows',
  'schedulers',
  'models',
  'dev',        // para scripts internos como este
];

const EXCLUDES = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.cache',
  'coverage',
  'tmp',
  'logs',
  '.DS_Store',
];

const TEXT_EXTS = new Set([
  'js','mjs','cjs','ts','tsx','jsx',
  'json','yml','yaml','env',
  'html','css','scss','md','txt',
  'sql','csv'
]);

function looksExcluded(p) {
  const s = p.replace(/\\/g, '/');
  return EXCLUDES.some(sub => s.includes(sub));
}
function isTextFile(p) {
  const ext = path.extname(p).slice(1).toLowerCase();
  return TEXT_EXTS.has(ext);
}
async function pathExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}
async function walk(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch { return out; }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (looksExcluded(abs)) continue;
    if (e.isDirectory()) out.push(...await walk(abs));
    else if (e.isFile() && isTextFile(abs)) out.push(abs);
  }
  return out.sort();
}
function rel(p) { return path.relative(process.cwd(), p).replace(/\\/g, '/'); }
function lang(p) {
  const ext = path.extname(p).toLowerCase();
  const map = {
    '.js':'js','.mjs':'js','.cjs':'js','.ts':'ts','.tsx':'tsx','.jsx':'tsx',
    '.json':'json','.yml':'yaml','.yaml':'yaml','.html':'html',
    '.css':'css','.scss':'scss','.md':'md','.sql':'sql','.csv':'csv'
  };
  return map[ext] || '';
}

async function collectAll() {
  const dirs = [];
  for (const f of FOLDERS) {
    const p = path.join(ROOT, f);
    if (await pathExists(p)) dirs.push(p);
  }

  if (!dirs.length)
    throw new Error(`No encontré carpetas válidas en ${rel(ROOT)} (buscaba: ${FOLDERS.join(', ')})`);

  let files = [];
  for (const d of dirs) files.push(...await walk(d));
  files = Array.from(new Set(files)).sort();

  let totalLines = 0;
  const chunks = [];
  chunks.push(`# Dump técnico de módulos App\n`);
  chunks.push(`> Generado desde \`${rel(ROOT)}\` — ${new Date().toLocaleString('es-AR')}\n`);

  for (const f of files) {
    let raw = '';
    try { raw = await fs.readFile(f, 'utf-8'); } catch { continue; }
    const lines = raw.split('\n').length;
    totalLines += lines;
    chunks.push(`\n---\n\n### ${rel(f)} (${lines} líneas)\n`);
    chunks.push('```' + lang(f));
    chunks.push(raw);
    chunks.push('```');
  }

  const md = chunks.join('\n');
  return { md, filesCount: files.length, totalLines };
}

function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    const plat = process.platform;
    let proc;
    if (plat === 'darwin') proc = spawn('pbcopy');
    else if (plat === 'win32') proc = spawn('clip');
    else {
      // Linux
      try { proc = spawn('xclip', ['-selection','clipboard']); }
      catch {
        try { proc = spawn('xsel', ['--clipboard','--input']); }
        catch { return reject(new Error('Falta pbcopy/clip/xclip/xsel.')); }
      }
    }
    proc.on('error', reject);
    proc.on('close', c => c === 0 ? resolve() : reject(new Error(`Clipboard exit code ${c}`)));
    proc.stdin.write(text);
    proc.stdin.end();
  });
}

async function main() {
  const { md, filesCount, totalLines } = await collectAll();
  const outDir = path.resolve(process.cwd(), 'tmp');
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, 'app_dump.md');
  await fs.writeFile(outFile, md, 'utf-8');

  try {
    await copyToClipboard(md);
    console.log(`✅ Copiado al portapapeles. Archivos: ${filesCount} | Líneas: ${totalLines}`);
    console.log(`📄 Backup: ${rel(outFile)}`);
  } catch (err) {
    console.warn('⚠️ No pude copiar al portapapeles:', err.message);
    console.log(`Guardado en: ${rel(outFile)}\n`);
    process.stdout.write(md);
  }
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });

```

---

### src/dev/print-db-to-clipboard.js (70 líneas)

```js
// src/dev/print-db-to-clipboard.js
// ----------------------------------------------------
// Junta TODO de models, migrations y seeders,
// lo formatea en Markdown y lo copia al portapapeles.
// Uso: node src/dev/print-db-to-clipboard.js
//
// Requiere: Node 18+
// Linux: necesita tener instalado xclip o xsel para copiar al clipboard.

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(process.cwd(), 'src');
const FOLDERS = ['models', 'migrations', 'seeders'];
const EXCLUDES = ['node_modules','dist','build','.git','.cache','coverage','tmp','logs','.DS_Store'];
const TEXT_EXTS = new Set(['js','mjs','cjs','ts','json','sql','csv','yml','yaml']);

function looksExcluded(p){ const s=p.replace(/\\/g,'/'); return EXCLUDES.some(sub=>s.includes(sub)); }
function isTextFile(p){ const ext=path.extname(p).slice(1).toLowerCase(); return TEXT_EXTS.has(ext); }
async function pathExists(p){ try{await fs.access(p);return true;}catch{return false;} }
async function walk(dir){ const out=[]; let entries=[]; try{entries=await fs.readdir(dir,{withFileTypes:true});}catch{return out;} for(const e of entries){ const abs=path.join(dir,e.name); if(looksExcluded(abs))continue; if(e.isDirectory())out.push(...await walk(abs)); else if(e.isFile()&&isTextFile(abs))out.push(abs);} return out.sort(); }
function rel(p){ return path.relative(process.cwd(),p).replace(/\\/g,'/'); }
function lang(p){ const ext=path.extname(p).toLowerCase(); const map={'.js':'js','.mjs':'js','.cjs':'js','.ts':'ts','.json':'json','.sql':'sql','.csv':'csv','.yml':'yaml','.yaml':'yaml'}; return map[ext]||''; }

async function collectAll(){
  const dirs=[]; for(const f of FOLDERS){ const p=path.join(ROOT,f); if(await pathExists(p))dirs.push(p);}
  if(!dirs.length)throw new Error(`No encontré carpetas en ${rel(ROOT)}: [${FOLDERS.join(', ')}]`);
  let files=[]; for(const d of dirs)files.push(...await walk(d));
  files=Array.from(new Set(files)).sort();

  let totalLines=0; const chunks=[];
  chunks.push(`# Dump técnico de Base de Datos\n`);
  chunks.push(`> Generado desde \`${rel(ROOT)}\` — ${new Date().toLocaleString('es-AR')}\n`);
  for(const f of files){
    let raw=''; try{raw=await fs.readFile(f,'utf-8');}catch{continue;}
    const lines=raw.split('\n').length; totalLines+=lines;
    chunks.push(`\n---\n\n### ${rel(f)} (${lines} líneas)\n`);
    chunks.push('```'+lang(f)); chunks.push(raw); chunks.push('```');
  }
  const md=chunks.join('\n');
  return {md,filesCount:files.length,totalLines};
}

function spawnSyncExists(cmd){ try{const which=process.platform==='win32'?'where':'which';spawn(which,[cmd],{stdio:'ignore'});return true;}catch{return false;} }
function copyToClipboard(text){ return new Promise((res,rej)=>{ const plat=process.platform; let proc,ok=false; if(plat==='darwin'){proc=spawn('pbcopy');ok=true;}else if(plat==='win32'){proc=spawn('clip');ok=true;}else{ if(spawnSyncExists('xclip')){proc=spawn('xclip',['-selection','clipboard']);ok=true;}else if(spawnSyncExists('xsel')){proc=spawn('xsel',['--clipboard','--input']);ok=true;} } if(!ok)return rej(new Error('No hay utilidades de clipboard disponibles.')); proc.on('error',rej); proc.on('close',c=>c===0?res():rej(new Error(`Clipboard exit code ${c}`))); proc.stdin.write(text); proc.stdin.end(); }); }

async function main(){
  const {md,filesCount,totalLines}=await collectAll();
  const outDir=path.resolve(process.cwd(),'tmp');
  await fs.mkdir(outDir,{recursive:true});
  const outFile=path.join(outDir,'db_dump.md');
  await fs.writeFile(outFile,md,'utf-8');
  try{
    await copyToClipboard(md);
    console.log(`✅ Copiado al portapapeles. Archivos: ${filesCount} | Líneas: ${totalLines}`);
    console.log(`📄 Backup: ${rel(outFile)}`);
  }catch(err){
    console.warn('⚠️ No pude copiar al portapapeles:',err.message);
    console.log(`Guardado en: ${rel(outFile)}\n`);
    process.stdout.write(md);
  }
}

main().catch(err=>{console.error('Error:',err.message);process.exit(1);});

```

---

### src/flows/flow-auth.js (39 líneas)

```js
// src/flows/flow-auth.js
import { sendWhatsAppText } from '../services/whatsappService.js';
import { t } from '../config/texts.js';
import { isValidCuitNumber, getVetByCuit, firstName } from '../services/userService.js';
import {
  getOrCreateSession, upsertVerified, isExpired, setState
} from '../services/waSessionService.js';

export async function handleAuthGate({ from, normText }) {
  const session = await getOrCreateSession(from);
  const loggedIn = !!(session.cuit && !isExpired(session));

  if (loggedIn) return false; // no hace falta gating

  const digits = (normText || '').replace(/\D/g, '');
  if (/^\d{11}$/.test(digits)) {
    if (!isValidCuitNumber(digits)) {
      await sendWhatsAppText(from, t('bad_cuit'));
      return true;
    }
    const vet = await getVetByCuit(digits);
    if (!vet) {
      await sendWhatsAppText(from, t('bad_cuit'));
      return true;
    }
    await upsertVerified(from, digits);
    const nombre = firstName(vet?.nombre) || '';
    const ttl = Number(process.env.CUIT_VERIFY_TTL_DAYS || process.env.WHATSAPP_SESSION_TTL_DAYS || 60);
    await sendWhatsAppText(from, t('ok_cuit', { nombre, ttl }));
    await setState(from, 'awaiting_consulta');
    await sendWhatsAppText(from, t('pedir_consulta'));
    return true;
  }

  // Pide CUIT
  await sendWhatsAppText(from, t('ask_cuit'));
  return true;
}

```

---

### src/flows/flow-edit.js (98 líneas)

```js
// src/flows/flow-edit.js
import { sendWhatsAppText } from '../services/whatsappService.js';
import { showConfirmList } from '../services/wabaUiService.js';
import { t } from '../config/texts.js';
import { isValidEmail, updateVetEmail, updateVetName } from '../services/userService.js';
import { detectarIntent } from '../services/intentService.js';
import { setState, getState, setPending, getPending, clearPending } from '../services/waSessionService.js';

export async function handle({ from, intent, normText, vet, nombre }) {
  const state = await getState(from);
  const pending = await getPending(from);

  // Entrada por menú “editar”
  if (intent === 'editar') {
    await sendWhatsAppText(from, t('editar_intro'));
    await sendWhatsAppText(from, '• *Nombre*: escribí "editar nombre"\n• *Email*: escribí "editar email"');
    return true;
  }

  // Pedidos explícitos
  if (intent === 'editar_nombre') {
    await setState(from, 'awaiting_nombre_value');
    await sendWhatsAppText(from, t('editar_pedir_nombre'));
    return true;
  }
  if (intent === 'editar_email') {
    await setState(from, 'awaiting_email_value');
    await sendWhatsAppText(from, t('editar_pedir_email'));
    return true;
  }

  // Captura de valores
  if (state === 'awaiting_nombre_value') {
    const nuevo = String(normText || '').slice(0, 120);
    if (!nuevo) { await sendWhatsAppText(from, t('editar_pedir_nombre')); return true; }
    await setPending(from, { action: 'edit_nombre', value: nuevo, prev: { state } });
    await setState(from, 'confirm');
    await showConfirmList(from, t('editar_confirmar_nombre', { valor: nuevo }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
    return true;
  }

  if (state === 'awaiting_email_value') {
    const email = String(normText || '');
    if (!isValidEmail(email)) { await sendWhatsAppText(from, t('editar_email_invalido')); return true; }
    await setPending(from, { action: 'edit_email', value: email, prev: { state } });
    await setState(from, 'confirm');
    await showConfirmList(from, t('editar_confirmar_email', { valor: email }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
    return true;
  }

  // Confirmaciones
  if (state === 'confirm') {
    const confirmIntent = detectarIntent(normText);
    const isNo  = confirmIntent === 'confirm_no' || normText === 'confirm.no';
    const isYes = confirmIntent === 'confirm_si' || normText === 'confirm.si';

    if (!pending) return false;

    if (isNo) {
      await setState(from, pending.prev?.state || 'awaiting_consulta');
      await clearPending(from);
      await sendWhatsAppText(from, t('cancelado'));
      return true;
    }

    if (isYes) {
      if (pending.action === 'edit_nombre') {
        await updateVetName(vet.id, pending.value);
        await clearPending(from);
        await setState(from, 'awaiting_consulta');
        await sendWhatsAppText(from, t('editar_ok_nombre', { nombre: pending.value.split(' ')[0] || nombre }));
        await sendWhatsAppText(from, t('refinar_follow'));
        return true;
      }
      if (pending.action === 'edit_email') {
        await updateVetEmail(vet.id, pending.value);
        await clearPending(from);
        await setState(from, 'awaiting_consulta');
        await sendWhatsAppText(from, t('editar_ok_email', { nombre, email: pending.value }));
        await sendWhatsAppText(from, t('refinar_follow'));
        return true;
      }
    }

    // Re-mostrar confirmación acorde a la acción pendiente
    if (pending.action === 'edit_nombre') {
      await showConfirmList(from, t('editar_confirmar_nombre', { valor: pending.value }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
      return true;
    }
    if (pending.action === 'edit_email') {
      await showConfirmList(from, t('editar_confirmar_email', { valor: pending.value }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
      return true;
    }
  }

  return false;
}

```

---

### src/flows/flow-feedback.js (32 líneas)

```js
// src/flows/flow-feedback.js
import { sendWhatsAppText } from '../services/whatsappService.js';
import { t } from '../config/texts.js';
import { WhatsAppSession } from '../models/index.js';

export async function handle({ from, intent, normText }) {
  if (intent === 'feedback_ok') {
    await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
    await sendWhatsAppText(from, t('fb_ok_resp'));
    return true;
  }
  if (intent === 'feedback_meh' || intent === 'feedback_txt') {
    await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
    await sendWhatsAppText(from, t('fb_meh_ask'));
    // el controller deja el estado en awaiting_feedback_text? lo hacemos acá
    await WhatsAppSession.update({ state: 'awaiting_feedback_text' }, { where: { phone: from } });
    return true;
  }

  // Si está esperando texto libre
  const row = await WhatsAppSession.findOne({ where: { phone: from } });
  if (row?.state === 'awaiting_feedback_text') {
    const comentario = (normText || '').slice(0, 3000);
    if (!comentario) { await sendWhatsAppText(from, t('fb_txt_empty')); return true; }
    await WhatsAppSession.update({ state: 'awaiting_consulta', feedbackLastResponseAt: new Date() }, { where: { phone: from } });
    await sendWhatsAppText(from, t('fb_txt_ok'));
    await sendWhatsAppText(from, t('refinar_follow'));
    return true;
  }

  return false;
}
```

---

### src/flows/flow-menu.js (17 líneas)

```js
// src/flows/flow-menu.js
import { showMainMenu } from '../services/wabaUiService.js';
import { sendWhatsAppText } from '../services/whatsappService.js';
import { t } from '../config/texts.js';
import { setState } from '../services/waSessionService.js';

export async function handle({ from, intent, nombre }) {
  if (!['menu','saludo','ayuda','gracias'].includes(intent)) return false;
  await showMainMenu(from, nombre || '');
  return true;
}

export async function goBuscar({ from }) {
  await setState(from, 'awaiting_consulta');
  await sendWhatsAppText(from, t('pedir_consulta'));
}

```

---

### src/flows/flow-promos.js (45 líneas)

```js
// src/flows/flow-promos.js
import { Promocion } from '../models/index.js';
import { sendWhatsAppList, sendWhatsAppText } from '../services/whatsappService.js';
import { t } from '../config/texts.js';

export async function handle({ from, intent, normText }) {
  if (intent === 'promos') {
    const promos = await Promocion.findAll({
      where: { vigente: true },
      order: [['vigencia_hasta','ASC'], ['nombre','ASC']],
      limit: 10
    });
    if (!promos.length) {
      await sendWhatsAppText(from, t('promos_empty'));
      return true;
    }
    await sendWhatsAppList(from, t('promos_list_body'), [{
      title: t('promos_list_title'),
      rows: promos.map(p => ({
        id: `promo:${p.id}`,
        title: (p.nombre || '').slice(0,24),
        description: [p.tipo, p.presentacion].filter(Boolean).join(' • ').slice(0,60)
      }))
    }], t('promos_list_header'), t('btn_elegi'));
    return true;
  }

  if ((normText || '').startsWith('promo:')) {
    const pid = Number(String(normText).split(':')[1]);
    const p = await Promocion.findByPk(pid);
    if (!p) { await sendWhatsAppText(from, t('promo_open_error')); return true; }
    const body = [
      `🎁 ${p.nombre}`,
      p.tipo ? `Tipo: ${p.tipo}` : null,
      p.detalle ? p.detalle : null,
      p.regalo ? `Regalo: ${p.regalo}` : null,
      `Vigencia: ${p.vigencia_desde ? new Date(p.vigencia_desde).toLocaleDateString() : '—'} a ${p.vigencia_hasta ? new Date(p.vigencia_hasta).toLocaleDateString() : '—'}`
    ].filter(Boolean).join('\n');
    await sendWhatsAppText(from, body);
    return true;
  }

  return false;
}

```

---

### src/flows/flow-search.js (137 líneas)

```js
// src/flows/flow-search.js
import { t } from '../config/texts.js';
import { sendWhatsAppText, sendWhatsAppContacts } from '../services/whatsappService.js';
import { ADMIN_PHONE_DIGITS } from '../config/app.js';

import {
  extraerTerminosBusqueda
} from '../services/gptService.js';

import {
  openProductDetail,
  handleDisambigAnswer,
  runDisambiguationOrRecommend
} from '../services/disambiguationService.js';

import {
  getReco, setReco, overwriteReco, setState, getState, resetRecoContext
} from '../services/waSessionService.js';

import { detectarIntent } from '../services/intentService.js';
import { getVetByCuit } from '../services/userService.js';

export async function resetRecoUI(from) {
  try { await resetRecoContext(from); } catch {}
}

function isFreshSearch(prevReco, consulta = '') {
  const q = (consulta || '').toLowerCase();
  const hasVerb = /(busco|estoy\s*buscando|quiero|necesito|catalogo|catálogo|otra cosa|nuevo|nueva busqueda|nueva búsqueda)/i.test(q);
  const prevMust = (prevReco?.tokens?.must || []);
  const killsMust = prevMust.length > 0 && !prevMust.some(m => q.includes(String(m).toLowerCase()));
  const cameFromMenu = !prevReco?.lastQuery;
  return hasVerb || killsMust || cameFromMenu;
}

// “prod:<id>” y desambiguación
export async function tryHandleDisambig(from, normText) {
  if ((normText || '').startsWith('disambig:')) {
    await handleDisambigAnswer(from, normText);
    return true;
  }
  return false;
}

async function handleConsulta(from, nombre, consulta) {
  const prev = await getReco(from);
  const gptNew = await extraerTerminosBusqueda(consulta);

  if (isFreshSearch(prev, consulta)) {
    await overwriteReco(from, {
      failCount: 0,
      tokens: {
        must:   Array.isArray(gptNew?.must)   ? gptNew.must   : [],
        should: Array.isArray(gptNew?.should) ? gptNew.should : [],
        negate: Array.isArray(gptNew?.negate) ? gptNew.negate : []
      },
      lastQuery: consulta,
      lastSimilares: [],
      lastShownIds: [],
      signals: { species: null, form: null, brands: [], actives: [], indications: [], weight_hint: null, packs: [], negatives: [] },
      asked: [],
      hops: 0,
      lastInteractionAt: null
    });
  } else {
    const mergedTokens = {
      must:   Array.from(new Set([...(prev?.tokens?.must || []), ...(gptNew?.must || [])])),
      should: Array.from(new Set([...(prev?.tokens?.should || []), ...(gptNew?.should || [])])),
      negate: Array.from(new Set([...(prev?.tokens?.negate || []) , ...(gptNew?.negate || [])]))
    };
    await setReco(from, { tokens: mergedTokens, lastQuery: consulta });
  }

  await setState(from, 'awaiting_consulta');
  await runDisambiguationOrRecommend({ from, nombre, consulta });
}

export async function handle({ from, state, normText, vet, nombre }) {
  // Abrir ficha por “prod:<id>”
  if ((normText || '').startsWith('prod:')) {
    const pid = Number(String(normText).split(':')[1]);
    const ok = await openProductDetail(from, pid);
    if (ok) {
      const ej = vet?.EjecutivoCuenta;
      if (ej && (ej.phone || ej.email)) {
        await sendWhatsAppContacts(from, [{
          formatted_name: ej.nombre,
          first_name: ej.nombre?.split(' ')[0],
          last_name: ej.nombre?.split(' ').slice(1).join(' ') || undefined,
          org: 'KrönenVet',
          phones: ej.phone ? [{ phone: ej.phone, type: 'WORK' }] : [],
          emails: ej.email ? [{ email: ej.email, type: 'WORK' }] : []
        }]);
        await sendWhatsAppText(from, t('handoff_ejecutivo', { ejecutivo: ej.nombre, telefono: ej.phone || '' }));
      } else {
        await sendWhatsAppContacts(from, [{
          formatted_name: 'Administración KronenVet',
          first_name: 'Administración',
          last_name: 'KronenVet',
          org: 'KrönenVet',
          phones: [{ phone: ADMIN_PHONE_DIGITS, type: 'WORK' }]
        }]);
        await sendWhatsAppText(from, t('handoff_admin', { telefono: ADMIN_PHONE_DIGITS }));
      }
    } else {
      await sendWhatsAppText(from, t('producto_open_error'));
    }
    return true;
  }

  // Estado de búsqueda
  if (state === 'awaiting_consulta') {
    const intent = detectarIntent(normText);
    if (['menu','saludo','ayuda','gracias'].includes(intent)) {
      await resetRecoContext(from);
      return false; // que lo agarre el flow-menu en el controller
    }
    if (!normText) {
      await sendWhatsAppText(from, t('pedir_consulta'));
      return true;
    }
    await handleConsulta(from, nombre, normText);
    return true;
  }

  // Sin estado explícito: si escribe algo, lo tomamos como consulta
  if (normText && !normText.startsWith('promo:')) {
    const s = await getState(from);
    if (s !== 'awaiting_feedback_text') {
      await handleConsulta(from, nombre, normText);
      return true;
    }
  }

  return false;
}

```

---

### src/helpers/handlebars.js (62 líneas)

```js
// src/helpers/handlebars.js
export default {
  /* ─── Comparaciones ─── */
  eq: (a, b) => String(a) === String(b),
  ne: (a, b) => String(a) !== String(b),
  lt: (a, b) => Number(a) <  Number(b),
  gt: (a, b) => Number(a) >  Number(b),
  and: (a, b) => !!(a && b),
  or : (a, b) => !!(a || b),

  /* ─── Aritmética / utilitarios ─── */
  add: (a, b) => Number(a) + Number(b),
  subtract: (a, b) => Number(a) - Number(b),
  min: (a, b) => Math.min(Number(a), Number(b)),
  max: (a, b) => Math.max(Number(a), Number(b)),

  /* Incrementos simples para paginación */
  inc: (v) => Number(v) + 1,
  dec: (v) => Number(v) - 1,

  /* Construye un array literal para #each (p.ej. (array 10 25 50 100 200)) */
  array: (...args) => {
    // Handlebars pasa el hash/metadata en el último arg
    const real = args.slice(0, -1);
    return real;
  },

  /* Rango 1..N para #each */
  range: (start, end) => {
    const s = Number(start), e = Number(end);
    if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return [];
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  },

  /* Ventana centrada de páginas (si más adelante la querés usar) */
  pageWindow: (page, totalPages, width) => {
    const p = Number(page) || 1;
    const T = Number(totalPages) || 1;
    const W = Math.max(Number(width) || 7, 3);
    if (T <= W) return Array.from({ length: T }, (_, i) => i + 1);

    const half = Math.floor(W / 2);
    let start = p - half;
    let end   = p + half;

    if (start < 1) { end += (1 - start); start = 1; }
    if (end > T)   { start -= (end - T); end = T; }
    if (start < 1) start = 1;

    const out = [];
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  },
  
  includes: (arr, val) => {
    if (!arr) return false;
    if (!Array.isArray(arr)) return false;
    const needle = String(val);
    return arr.some(x => String(x?.id ?? x) === needle);
  }
};

```

---

### src/jobs/feedbackScheduler.js (55 líneas)

```js
// src/schedulers/feedbackScheduler.js
import { Op, col, where } from 'sequelize';
import { WhatsAppSession } from '../models/index.js';
import { sendWhatsAppButtons } from '../services/whatsappService.js';

const MIN = 60 * 1000;
const INACTIVITY_MS = 15 * MIN;               // 15 minutos
const WINDOW_24H_MS = 24 * 60 * MIN;          // 24 hs
let running = false;

export function startFeedbackScheduler() {
  setInterval(async () => {
    if (running) return;
    running = true;

    try {
      const now = Date.now();
      const inactiveSince = new Date(now - INACTIVITY_MS);
      const windowSince   = new Date(now - WINDOW_24H_MS);

      const sessions = await WhatsAppSession.findAll({
        where: {
          state: 'verified',
          // Solo si NUNCA se lo mandamos → evita duplicados
          feedbackLastPromptAt: { [Op.is]: null },

          // updated_at entre (now-24h .. now-15m)
          [Op.and]: [
            where(col('updated_at'), { [Op.lt]: inactiveSince }),
            where(col('updated_at'), { [Op.gt]: windowSince }),
          ],
        },
        limit: 200,
      });

      for (const s of sessions) {
        await sendWhatsAppButtons(s.phone, '¿Cómo venís con KaIA?', [
          { id: 'fb_ok',  title: '👍 Todo bien' },
          { id: 'fb_meh', title: '🛠 Mejorable' },
          { id: 'fb_txt', title: '📝 Comentario' },
        ]);

        await WhatsAppSession.update(
          { feedbackLastPromptAt: new Date() },
          { where: { id: s.id } },
        );
      }
    } catch (e) {
      console.error('⚠️ feedbackScheduler error:', e.message);
    } finally {
      running = false;
    }
  }, MIN);
}

```

---

### src/middlewares/authDesdeCookie.js (18 líneas)

```js
// src/middlewares/authDesdeCookie.js
import jwt from 'jsonwebtoken';

export default function authDesdeCookie(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    res.locals.usuario = payload; // <- lo hacemos visible en vistas
  } catch (err) {
    res.clearCookie('token');
  }

  next();
}

```

---

### src/middlewares/soloAdmin.js (14 líneas)

```js
export default function soloAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    // Si es una petición del navegador (HTML)
    if (req.headers.accept?.includes('text/html')) {
      req.flash?.('error', 'Debés iniciar sesión como administrador');
      return res.redirect('/auth/login');
    }
    // Si es una API
    return res.status(403).json({ msg: 'Acceso restringido a administradores' });
  }

  next();
}

```

---

### src/middlewares/validarCuit.js (47 líneas)

```js
// src/middlewares/validarCuit.js
import { Usuario } from '../models/index.js';

/**
 * Chequea el CUIT en este orden:
 *  - req.session.cuit (si ya lo pedimos antes)
 *  - Header 'x-cuit'
 *  - Body 'cuit'
 *
 * Si valida, persiste en sesión para próximas llamadas.
 */
export default async function validarCuit(req, res, next) {
  try {
    let cuit =
      req.session?.cuit ||
      req.headers['x-cuit'] ||
      req.body?.cuit;

    if (!cuit) {
      return res.status(401).json({
        msg: 'Necesito tu CUIT (11 dígitos) para continuar con la recomendación.'
      });
    }

    cuit = String(cuit).replace(/\D/g, '').slice(0, 11);

    const vet = await Usuario.findOne({
      where: { cuit, role: 'vet', /* opcional: activo_kronen: true */ }
    });

    if (!vet) {
      return res.status(403).json({
        msg: 'CUIT no habilitado. Por favor verificá tus datos con tu ejecutivo.'
      });
    }

    // Guardamos sesión
    req.session.cuit = cuit;
    req.user = vet;
    req.userPlain = vet.get({ plain: true });
    next();
  } catch (err) {
    console.error('validarCuit error:', err);
    res.status(500).json({ msg: 'Error validando CUIT' });
  }
}

```

---

### src/models/Compra.js (18 líneas)

```js
// src/models/Compra.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Compra = sequelize.define('Compra', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  qty:         { type: DataTypes.INTEGER, allowNull: false },
  precio_unit: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  subtotal:    { type: DataTypes.DECIMAL(10,2), allowNull: false }
}, {
  tableName: 'compras',
  timestamps: true,
  createdAt: 'fecha',
  updatedAt: false,
  indexes: [{ fields: ['usuarioId', 'productoId'] }]
});


```

---

### src/models/CuentaCorriente.js (16 líneas)

```js
// src/models/CuentaCorriente.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const CuentaCorriente = sequelize.define('CuentaCorriente', {
  id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  saldo:   { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
  credito: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 }
}, {
  tableName: 'cuentas_corrientes',
  timestamps: true,
  createdAt: false,
  updatedAt: 'actualizado_en'
});


```

---

### src/models/EjecutivoCuenta.js (12 líneas)

```js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const EjecutivoCuenta = sequelize.define('EjecutivoCuenta', {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:   { type: DataTypes.STRING, allowNull: false },
  phone:    { type: DataTypes.STRING, unique: true, allowNull: true, field: 'telefono' },
  email:    { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'ejecutivos_cuenta',
  timestamps: false
});
```

---

### src/models/Feedback.js (21 líneas)

```js
// src/models/Feedback.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Feedback = sequelize.define('Feedback', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuarioId:   { type: DataTypes.INTEGER, allowNull: true },           // ya está en la migración
  phone:       { type: DataTypes.STRING(32), allowNull: true },        // para mapear conversaciones WA
  cuit:        { type: DataTypes.STRING(11), allowNull: true },
  flow_id:     { type: DataTypes.STRING, allowNull: true },            // ej: 'feedback_inactive'
  satisfecho:  { type: DataTypes.STRING, allowNull: true },            // 'ok' | 'meh' | 'txt'
  comentario:  { type: DataTypes.TEXT, allowNull: true },
  origen:      { type: DataTypes.STRING, allowNull: true, defaultValue: 'whatsapp' } // canal
}, {
  tableName: 'feedback',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false,
  indexes: [{ fields: ['phone'] }, { fields: ['cuit'] }, { fields: ['flow_id'] }]
});

```

---

### src/models/PrecioLog.js (17 líneas)

```js
// src/models/PrecioLog.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const PrecioLog = sequelize.define('PrecioLog', {
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  precio_anterior: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  nuevo_precio:    { type: DataTypes.DECIMAL(10,2), allowNull: false },
  motivo:          { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'precios_log',
  timestamps: true,
  createdAt: 'cambiado_en',
  updatedAt: false
});


```

---

### src/models/Producto.js (30 líneas)

```js
// src/models/Producto.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Producto = sequelize.define('Producto', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_articulo:   { type: DataTypes.STRING, unique: true, allowNull: true }, // código KronenVet
  nombre:        { type: DataTypes.STRING, allowNull: false },
  costo:         { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  precio:        { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  presentacion:  { type: DataTypes.STRING, allowNull: true },
  proveedor:     { type: DataTypes.STRING, allowNull: true },
  marca:         { type: DataTypes.STRING, allowNull: true },
  rubro:         { type: DataTypes.STRING, allowNull: true },
  familia:       { type: DataTypes.STRING, allowNull: true },
  debaja:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  cantidad:      { type: DataTypes.INTEGER, allowNull: true },
  stockMin:      { type: DataTypes.INTEGER, allowNull: true },
  stockMax:      { type: DataTypes.INTEGER, allowNull: true },
  codBarras:     { type: DataTypes.STRING, allowNull: true },
  observaciones: { type: DataTypes.TEXT, allowNull: true },
  visible:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'productos',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false,
  indexes: [{ fields: ['nombre', 'presentacion', 'marca'] }]
});

```

---

### src/models/ProductoPromocion.js (12 líneas)

```js
// src/models/ProductoPromocion.js  (tabla puente M:N)
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const ProductoPromocion = sequelize.define('ProductoPromocion', {
  productoId:  { type: DataTypes.INTEGER, primaryKey: true },
  promocionId: { type: DataTypes.INTEGER, primaryKey: true }
}, {
  tableName: 'productos_promociones',
  timestamps: false
});

```

---

### src/models/Promocion.js (24 líneas)

```js
// src/models/Promocion.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Promocion = sequelize.define('Promocion', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:           { type: DataTypes.STRING, allowNull: false },
  tipo:             { type: DataTypes.STRING, allowNull: true },
  detalle:          { type: DataTypes.TEXT, allowNull: true },
  regalo:           { type: DataTypes.TEXT, allowNull: true },
  presentacion:     { type: DataTypes.STRING, allowNull: true },
  especie:          { type: DataTypes.STRING, allowNull: true },
  laboratorio:      { type: DataTypes.STRING, allowNull: true },
  productos_txt:    { type: DataTypes.TEXT, allowNull: true }, 
  stock_disponible: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  vigencia_desde:   { type: DataTypes.DATE, allowNull: true },
  vigencia_hasta:   { type: DataTypes.DATE, allowNull: true },
  vigente:          { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'promociones',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false
});
```

---

### src/models/Usuario.js (19 líneas)

```js
// src/models/Usuario.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Usuario = sequelize.define('Usuario', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:    { type: DataTypes.STRING, allowNull: true },
  phone:     { type: DataTypes.STRING, unique: true, allowNull: true }, // WhatsApp
  cuit:      { type: DataTypes.STRING, unique: true, allowNull: true },   // autenticación
  email:     { type: DataTypes.STRING, unique: true, allowNull: true },
  password:  { type: DataTypes.STRING, allowNull: true },
  role:      { type: DataTypes.STRING, allowNull: false, defaultValue: 'vet' },
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false
});

```

---

### src/models/WhatsAppSession.js (30 líneas)

```js
// src/models/WhatsAppSession.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const WhatsAppSession = sequelize.define('WhatsAppSession', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  phone:       { type: DataTypes.STRING(32), allowNull: false, unique: true },
  cuit:        { type: DataTypes.STRING(11), allowNull: true },
  verifiedAt:  { type: DataTypes.DATE, allowNull: true, field: 'verified_at' },
  expiresAt:   { type: DataTypes.DATE, allowNull: true, field: 'expires_at' },
  state:       { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'idle' },
  pending:     { type: DataTypes.JSON, allowNull: true },

  feedbackLastPromptAt:   { type: DataTypes.DATE, allowNull: true, field: 'feedback_last_prompt_at' },
  feedbackLastResponseAt: { type: DataTypes.DATE, allowNull: true, field: 'feedback_last_response_at' }
}, {
  tableName: 'whatsapp_sessions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['phone'], unique: true },
    { fields: ['expires_at'] },
    { fields: ['feedback_last_prompt_at'] },
    { fields: ['feedback_last_response_at'] }
  ]
});

export default WhatsAppSession;
```

---

### src/models/index.js (75 líneas)

```js
// src/models/index.js
import sequelize from '../../config/database.js';

/* ─── Modelos ─────────────────────────────────── */
import { Usuario }          from './Usuario.js';
import { CuentaCorriente }  from './CuentaCorriente.js';
import { Producto }         from './Producto.js';
import { Promocion }        from './Promocion.js';
import { ProductoPromocion } from './ProductoPromocion.js';
import { Compra }           from './Compra.js';
import { Feedback }         from './Feedback.js';
import { PrecioLog }        from './PrecioLog.js';
import { EjecutivoCuenta } from './EjecutivoCuenta.js';
import WhatsAppSession from './WhatsAppSession.js';

/* ─── Asociaciones ────────────────────────────── */
/** 1 : 1  (Usuario ↔ CuentaCorriente) */
Usuario.hasOne(CuentaCorriente,   { foreignKey: 'usuarioId' });
CuentaCorriente.belongsTo(Usuario,{ foreignKey: 'usuarioId' });

/** 1 : N  (Usuario ↔ Compra) */
Usuario.hasMany(Compra,           { foreignKey: 'usuarioId' });
Compra.belongsTo(Usuario,         { foreignKey: 'usuarioId' });

/** 1 : N  (Producto ↔ Compra) */
Producto.hasMany(Compra,          { foreignKey: 'productoId' });
Compra.belongsTo(Producto,        { foreignKey: 'productoId' });
/** 1 : N  (EjecutivoCuenta ↔ Usuario) */
EjecutivoCuenta.hasMany(Usuario,    { foreignKey: 'ejecutivoId' });
Usuario.belongsTo(EjecutivoCuenta,  { foreignKey: 'ejecutivoId' });

/** 1 : N  (Promocion ↔ Compra) – promo aplicada en la compra */
Promocion.hasMany(Compra,         { foreignKey: 'promo_aplicada' });
Compra.belongsTo(Promocion,       { foreignKey: 'promo_aplicada' });

/** 1 : N  (Usuario ↔ Feedback) */
Usuario.hasMany(Feedback,         { foreignKey: 'usuarioId' });
Feedback.belongsTo(Usuario,       { foreignKey: 'usuarioId' });

/** 1 : N  (Producto ↔ PrecioLog) */
Producto.hasMany(PrecioLog,       { foreignKey: 'productoId' });
PrecioLog.belongsTo(Producto,     { foreignKey: 'productoId' });

/** 1 : N  (Usuario admin ↔ PrecioLog) */
Usuario.hasMany(PrecioLog,        { foreignKey: 'cambiado_por' });
PrecioLog.belongsTo(Usuario,      { foreignKey: 'cambiado_por' });


/** M : N  (Producto ↔ Promocion)  */
Producto.belongsToMany(Promocion, {
  through: ProductoPromocion,
  foreignKey: 'productoId',
  otherKey:   'promocionId'
});
Promocion.belongsToMany(Producto, {
  through: ProductoPromocion,
  foreignKey: 'promocionId',
  otherKey:   'productoId'
});

/* ─── Exportar todos los modelos ──────────────── */
export {
  sequelize,
  Usuario,
  CuentaCorriente,
  Producto,
  Promocion,
  ProductoPromocion,
  Compra,
  Feedback,
  PrecioLog, 
  EjecutivoCuenta,
  WhatsAppSession
};

```

---

### src/services/disambiguationService.js (611 líneas)

```js
// src/services/disambiguationService.js
import 'dotenv/config';
import { recomendarDesdeBBDD } from './recommendationService.js';
import { responderConGPTStrict, extraerTerminosBusqueda } from './gptService.js';
import { t } from '../config/texts.js';
import {
  getReco, setReco, incRecoFail, resetRecoFail,
  setState, getState, setPending, getPending,
  clearPendingKey // 🆕 limpiar solo 'disambig'
} from './waSessionService.js';
import {
  sendWhatsAppText,
  sendWhatsAppList,
  sendWhatsAppButtons
} from './whatsappService.js';
import { Promocion, Producto } from '../models/index.js';

import OpenAI from 'openai';
import { getPromptDisambigExtract } from './promptTemplate.js';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18';
let openai = null;
if (process.env.OPENAI_API_KEY) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ===== Config =====
const FIRST_LIST_THRESHOLD = Number(process.env.RECO_FIRST_LIST_THRESHOLD || 6); // si <6: listar directo
const MAX_HOPS             = Number(process.env.RECO_MAX_HOPS || 2);            // desambiguaciones “normales” permitidas

// ⚠️ Límite duro para filas de WhatsApp (evitar 131009)
const SAFE_LIST_MAX        = Number(process.env.RECO_SAFE_LIST_MAX || 10);

// ====== Utils de normalización / parse ======
const RX = {
  kg: /\b(\d+(?:[.,]\d+)?)\s*(?:kg|kilo)s?\b/i,
  range: /(\d+(?:[.,]\d+)?)\s*(?:a|-|–|hasta)\s*(\d+(?:[.,]\d+)?)\s*kg/i,
  hasta: /≤?\s*hasta\s*(\d+(?:[.,]\d+)?)\s*kg/i,
  desde: /(desde|>=)\s*(\d+(?:[.,]\d+)?)\s*kg/i,
  pack: /\b(pa?ck|x)\s*(\d{1,2})\b/i,
  forma_pipeta: /pipet|spot[- ]?on|t[oó]pico/i,
  forma_comp: /comprimid|tableta|tabs/i,
  forma_iny: /inyect/i,
  especie_gato: /\b(gato|felin[oa]s?)\b/i,
  especie_perro: /\b(perr[oa]s?|canin[oa]s?)\b/i,
};

const NORM = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

function normalizeNumber(n) {
  const x = String(n).replace(',', '.').trim();
  return x.replace(/^0+(\d)/, '$1');
}
function normalizeWeightLabel(text = '') {
  const t = String(text || '').toLowerCase().replace(',', '.').trim();
  let m = t.match(RX.range); if (m) return `${normalizeNumber(m[1])}–${normalizeNumber(m[2])} kg`;
  m = t.match(RX.hasta);     if (m) return `≤${normalizeNumber(m[1])} kg`;
  m = t.match(RX.desde);     if (m) return `≥${normalizeNumber(m[2])} kg`;
  m = t.match(RX.kg);        if (m) return `${normalizeNumber(m[1])} kg`;
  return null;
}
function extractPackLabel(text = '') {
  const m = String(text || '').toLowerCase().match(RX.pack);
  return m ? `x${m[2]}` : null;
}
function looksLikePipeta(query = '', tokens = {}) {
  const q = NORM(query);
  if (RX.forma_pipeta.test(q)) return true;
  const s = new Set([...(tokens.must||[]), ...(tokens.should||[])].map(NORM));
  for (const w of s) if (/pipet|spot|topico/.test(w)) return true;
  return false;
}
function hardSpeciesInQuery(query = '') {
  const q = NORM(query);
  if (RX.especie_gato.test(q))  return 'gato';
  if (RX.especie_perro.test(q)) return 'perro';
  return null;
}

// ====== Señales ricas (GPT) ======
async function extraerSenalesRicas(query) {
  if (!openai) {
    return {
      species: null, form: null, brands: [], actives: [], indications: [],
      weight_hint: null, packs: [], negatives: []
    };
  }
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: getPromptDisambigExtract() },
        { role: 'user',   content: query }
      ],
      temperature: 0
    });
    let raw = completion.choices?.[0]?.message?.content || '{}';
    raw = raw.trim().replace(/^\s*```json\s*|\s*```\s*$/g, '');
    const parsed = JSON.parse(raw);
    const weight = normalizeWeightLabel(parsed?.weight_hint || '');
    return {
      species: parsed?.species || null,
      form: parsed?.form || null,
      brands: Array.isArray(parsed?.brands) ? parsed.brands : [],
      actives: Array.isArray(parsed?.actives) ? parsed.actives : [],
      indications: Array.isArray(parsed?.indications) ? parsed.indications : [],
      weight_hint: weight,
      packs: Array.isArray(parsed?.packs) ? parsed.packs : [],
      negatives: Array.isArray(parsed?.negatives) ? parsed.negatives : [],
    };
  } catch (e) {
    console.warn('⚠️ extraerSenalesRicas fallback:', e?.message);
    return {
      species: null, form: null, brands: [], actives: [], indications: [],
      weight_hint: null, packs: [], negatives: []
    };
  }
}

// ====== Agrupación de variantes y plan de desambiguación ======
function baseKey(p) {
  let t = `${NORM(p.marca)} ${NORM(p.nombre)} ${NORM(p.presentacion)}`;
  t = t.replace(RX.range, ' ')
       .replace(RX.hasta, ' ')
       .replace(RX.desde, ' ')
       .replace(RX.kg, ' ')
       .replace(/\b\d+(?:[.,]\d+)?\s*(ml|cc)\b/gi, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

function analyzeVariantDimensions(productos = []) {
  const groups = new Map();
  for (const p of productos) {
    const key = baseKey(p);
    const peso = normalizeWeightLabel(`${p.nombre} ${p.presentacion}`) || null;
    const pack = extractPackLabel(`${p.nombre} ${p.presentacion}`) || null;
    const marca = p.marca || null;
    const forma = (() => {
      const txt = NORM(`${p.nombre} ${p.presentacion} ${p.rubro} ${p.familia}`);
      if (RX.forma_pipeta.test(txt)) return 'pipeta';
      if (RX.forma_comp.test(txt))   return 'comprimido';
      if (RX.forma_iny.test(txt))    return 'inyectable';
      return null;
    })();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ id: p.id, peso, pack, marca, forma, p });
  }

  const sets = { peso: new Set(), pack: new Set(), marca: new Set(), forma: new Set() };
  for (const variants of groups.values()) {
    variants.forEach(v => {
      if (v.peso)  sets.peso.add(v.peso);
      if (v.pack)  sets.pack.add(v.pack);
      if (v.marca) sets.marca.add(v.marca);
      if (v.forma) sets.forma.add(v.forma);
    });
  }

  let needs = { peso: false, pack: false, marca: false, forma: false };
  Object.keys(needs).forEach(k => { if (sets[k].size >= 2) needs[k] = true; });

  return { groups, needs, sets };
}

// Elegir qué preguntar primero, evitando repetir lo ya preguntado o ya definido
function pickFirstQuestion({ signals, tokens, productos, consulta, asked = [] }) {
  const explicitSpecies = hardSpeciesInQuery(consulta);
  const especie = signals.species || explicitSpecies || null;
  const forma   = signals.form || null;
  const isPipeta = looksLikePipeta(consulta, tokens) || forma === 'pipeta';

  const { needs, sets } = analyzeVariantDimensions(productos);

  const already = new Set(asked || []);

  // ¿Qué especies aparecen en los candidatos?
  const txt = NORM(productos.map(p => `${p.nombre} ${p.presentacion} ${p.familia} ${p.rubro} ${p.observaciones||''}`).join(' | '));
  const hayGato  = RX.especie_gato.test(txt);
  const hayPerro = RX.especie_perro.test(txt);

  // 1) Si hay gato y perro en candidatos y no tenemos especie → preguntar especie primero
  if (!especie && !already.has('species')) {
    if (hayGato && hayPerro) {
      return { type: 'species', title: t('desambig_species_header'), body: t('desambig_species_body') };
    }
  }

  // 2) Pipetas: si hay variantes por peso y no tenemos peso → preguntar peso
  //    Para el copy, si no definió especie, usamos la que “predomina” en candidatos.
  const especieBody = especie || (hayGato && !hayPerro ? 'gato' : hayPerro && !hayGato ? 'perro' : null);

  if (isPipeta && needs.peso && !signals.weight_hint && !already.has('weight')) {
    return {
      type: 'weight',
      title: t('desambig_peso_header'),
      body: (especieBody === 'gato') ? t('desambig_peso_body_gato') : t('desambig_peso_body_perro')
    };
  }

  if (!forma && needs.forma && !already.has('form')) {
    return { type: 'form', title: t('desambig_form_header'), body: t('desambig_form_body') };
  }

  if (needs.pack && (!signals.packs || !signals.packs.length) && !already.has('pack')) {
    return { type: 'pack', title: t('desambig_pack_header'), body: t('desambig_pack_body') };
  }

  if (needs.marca && (!signals.brands || !signals.brands.length) && !already.has('brand')) {
    return { type: 'brand', title: t('desambig_brand_header'), body: t('desambig_brand_body') };
  }

  // Fallback por diversidad
  const diversity = [
    { key: 'peso',  size: sets.peso.size,  type: 'weight', title: t('desambig_peso_header'),  body: (especieBody === 'gato') ? t('desambig_peso_body_gato') : t('desambig_peso_body_perro') },
    { key: 'marca', size: sets.marca.size, type: 'brand',  title: t('desambig_brand_header'), body: t('desambig_brand_body') },
    { key: 'forma', size: sets.forma.size, type: 'form',   title: t('desambig_form_header'),  body: t('desambig_form_body') },
    { key: 'pack',  size: sets.pack.size,  type: 'pack',   title: t('desambig_pack_header'),  body: t('desambig_pack_body') },
  ]
  .filter(d => !already.has(d.type))
  .sort((a,b) => b.size - a.size);

  const best = diversity.find(d => d.size >= 2);
  if (best) return { type: best.type, title: best.title, body: best.body };

  return null;
}

function pick(v, keys = []) {
  for (const k of keys) {
    if (v[k] != null && String(v[k]).toString().trim() !== '') return String(v[k]);
  }
  return null;
}
function money(val) {
  const n = Number(val);
  return Number.isFinite(n) ? `$${n.toFixed(0)}` : '(consultar)';
}
function formatProductoDetalle(p) {
  const j = typeof p.toJSON === 'function' ? p.toJSON() : p;

  const nombre = pick(j, ['nombre']) || '—';
  const marca  = pick(j, ['marca']) || '—';
  const presentacion = pick(j, ['presentacion']) || '';
  const rubro   = pick(j, ['rubro']);
  const familia = pick(j, ['familia']);
  const especie = pick(j, ['especie']);
  const forma   = pick(j, ['forma', 'presentacion_forma']);
  const contenido = pick(j, ['contenido_neto', 'volumen', 'peso']);
  const unidad = pick(j, ['unidad', 'unidad_medida']);
  const sku    = pick(j, ['sku', 'codigo_sku']);
  const codigo = pick(j, ['codigo', 'codigo_interno']);
  const ean    = pick(j, ['codigo_barras', 'ean']);
  const stock  = pick(j, ['cantidad', 'stock']);
  const precio = pick(j, ['precio']);

  const obs    = pick(j, ['observaciones', 'descripcion', 'notas']);

  const promo = (j.Promocions?.[0]) ? `Sí: ${j.Promocions[0].nombre}` : 'No';

  const lines = [
    `📦 *${nombre}*`,
    presentacion ? `Presentación: ${presentacion}` : null,
    `Marca: ${marca}`,
    rubro ? `Rubro: ${rubro}` : null,
    familia ? `Familia: ${familia}` : null,
    especie ? `Especie: ${especie}` : null,
    forma ? `Forma: ${forma}` : null,
    contenido ? `Contenido: ${contenido}${unidad ? ' ' + unidad : ''}` : null,
    sku ? `SKU: ${sku}` : null,
    codigo ? `Código: ${codigo}` : null,
    ean ? `EAN: ${ean}` : null,
    (precio != null) ? `Precio estimado: ${money(precio)}` : `Precio estimado: (consultar)`,
    stock ? `Stock: ${stock}` : null,
    `¿Promoción?: ${promo}`,
    obs ? `\n📝 *Observaciones*\n${obs}` : null
  ].filter(Boolean);

  return lines.join('\n');
}

export async function openProductDetail(from, productId) {
  const pid = Number(productId);
  if (!Number.isFinite(pid)) {
    await sendWhatsAppText(from, t('producto_open_error'));
    return false;
  }
  const p = await Producto.findByPk(pid, {
    include: [{ model: Promocion, attributes: ['nombre'], required: false }]
  });
  if (!p) {
    await sendWhatsAppText(from, t('producto_open_error'));
    return false;
  }
  const detail = formatProductoDetalle(p);
  await sendWhatsAppText(from, t('producto_ficha_header'));
  await sendWhatsAppText(from, detail);

  try {
    const g = {
      id: p.id,
      nombre: p.nombre,
      marca: p.marca || '',
      presentacion: p.presentacion || '',
      precio: p.precio ? Number(p.precio) : null,
      rubro: p.rubro || '',
      familia: p.familia || '',
      promo: p.Promocions?.[0]
        ? { activa: true, nombre: p.Promocions[0].nombre }
        : { activa: false, nombre: '' },
    };
    const texto = await responderConGPTStrict(p.nombre, { productosValidos: [g], similares: [] });
    if (texto && texto.trim()) {
      await sendWhatsAppText(from, texto.trim());
    }
  } catch (_) {}

  return true;
}

// ===== Lista de productos (capada a 10 filas) =====
export async function sendProductsList(from, productos, header = null) {
  if (!productos?.length) return;
  const prods = productos.slice(0, SAFE_LIST_MAX); // ← capar a 10
  const rows = prods.map(p => ({
    id: `prod:${p.id}`,
    title: String(p.nombre || 'Producto').slice(0, 24),
    description: [p.marca, p.presentacion, p.promo?.activa ? 'Promo' : ''].filter(Boolean).join(' • ').slice(0, 60)
  }));
  console.log(`[RECO][LIST] to=${from} rows=${rows.length}`);
  await sendWhatsAppList(
    from,
    t('productos_list_body'),
    [{ title: t('productos_list_title'), rows }],
    header || t('productos_select_header'),
    t('btn_elegi')
  );
}

/* ====== Filtro: no meter especie “fantasma” si el usuario no la dijo ====== */
function scrubSpuriousSpeciesTokens(mergedTokens, consulta, signals) {
  const explicit = hardSpeciesInQuery(consulta);
  const locked = signals?.species || null;
  if (explicit || locked) return mergedTokens;

  const blacklist = new Set(['gato','gatos','felino','felinos','perro','perros','canino','caninos']);
  const should = (mergedTokens.should || []).filter(x => !blacklist.has(NORM(x)));
  return { ...mergedTokens, should };
}

// ====== API principal (muestra lista primero) ======
export async function runDisambiguationOrRecommend({ from, nombre, consulta }) {
  // Estado previo
  const prev = await getReco(from);

  // 1) Tokens desde texto + merge con prev
  const tokensNew = await extraerTerminosBusqueda(consulta);
  let mergedTokens = {
    must:   Array.from(new Set([...(prev?.tokens?.must || []), ...(tokensNew?.must || [])])),
    should: Array.from(new Set([...(prev?.tokens?.should || []), ...(tokensNew?.should || [])])),
    negate: Array.from(new Set([...(prev?.tokens?.negate || []), ...(tokensNew?.negate || [])]))
  };

  // 2) Señales ricas (GPT) + merge con señales persistidas
  const signalsNew = await extraerSenalesRicas(consulta);
  const signals = {
    species: prev.signals?.species ?? signalsNew.species ?? null,
    form: prev.signals?.form ?? signalsNew.form ?? null,
    brands: Array.from(new Set([...(prev.signals?.brands||[]), ...(signalsNew.brands||[])])),
    actives: Array.from(new Set([...(prev.signals?.actives||[]), ...(signalsNew.actives||[])])),
    indications: Array.from(new Set([...(prev.signals?.indications||[]), ...(signalsNew.indications||[])])),
    weight_hint: prev.signals?.weight_hint ?? signalsNew.weight_hint ?? null,
    packs: Array.from(new Set([...(prev.signals?.packs||[]), ...(signalsNew.packs||[])])),
    negatives: Array.from(new Set([...(prev.signals?.negatives||[]), ...(signalsNew.negatives||[])])),
  };

  // 3) No asumir especie si no fue explícita ni está lockeada
  mergedTokens = scrubSpuriousSpeciesTokens(mergedTokens, consulta, signals);

  // Guardamos contexto actualizado (tokens + signals)
  await setReco(from, { tokens: mergedTokens, lastQuery: consulta, signals });

  // 4) Buscar candidatos
  const { validos = [], similares = [] } = await recomendarDesdeBBDD(consulta, { gpt: mergedTokens, signals });
  const candidatos = [...validos, ...similares];

  console.log(`[RECO][ITER] query="${consulta}" -> validos=${validos.length} similares=${similares.length} total=${candidatos.length}`);

  if (!validos.length) {
    const after = await incRecoFail(from);
    if ((after?.failCount || 0) >= Number(process.env.SEARCH_MAX_FAILS || 5)) {
      await sendWhatsAppText(from, t('no_match'));
      await sendWhatsAppButtons(from, t('reco_pedir_especie'), [
        { id: 'perro', title: t('btn_perro') },
        { id: 'gato',  title: t('btn_gato') },
        { id: 'volver', title: t('btn_volver') }
      ]);
      return true;
    }
    await sendWhatsAppText(from, t('no_match'));
    await sendWhatsAppText(from, t('refinar_tip'));
    return true;
  }

  // Reset fails y guardar ids mostrados
  await resetRecoFail(from);
  await setReco(from, {
    lastShownIds: validos.map(v => v.id),
    lastSimilares: similares.map(s => s.id)
  });

  const hops = prev.hops || 0;
  const asked = prev.asked || [];

  // Si queda 1 solo candidato → devolvemos FICHA + GPT directamente
  if (candidatos.length === 1) {
    await openProductDetail(from, candidatos[0].id);
    await setState(from, 'awaiting_consulta');
    return true;
  }

  // REGLA 1: si hay pocos candidatos, listar TODO (cap a 10 por WABA)
  if (candidatos.length <= FIRST_LIST_THRESHOLD) {
    await sendWhatsAppText(from, t('mostrando_todos', { total: Math.min(candidatos.length, SAFE_LIST_MAX) }));
    await sendProductsList(from, candidatos, t('productos_select_header'));
    await setState(from, 'awaiting_consulta');
    return true;
  }

  // Si hay muchos, vemos si aún conviene desambiguar
  let question = pickFirstQuestion({
    signals,
    tokens: mergedTokens,
    productos: candidatos,
    consulta,
    asked
  });

  // REGLA 2: si ya alcanzamos el máximo de desambiguaciones “normales”
  if (hops >= MAX_HOPS) {
    // Si entran en un único mensaje seguro → listamos (cap a SAFE_LIST_MAX)
    if (candidatos.length <= SAFE_LIST_MAX) {
      await sendWhatsAppText(from, t('mostrando_todos', { total: candidatos.length }));
      await sendProductsList(from, candidatos, t('productos_select_header'));
      await setState(from, 'awaiting_consulta');
      return true;
    }

    // Intentamos UNA pregunta extra “inteligente” para bajar el universo.
    if (question) {
      const { groups } = analyzeVariantDimensions(candidatos);
      const opts = new Set();
      for (const variants of groups.values()) {
        for (const v of variants) {
          if (question.type === 'weight' && v.peso) opts.add(v.peso);
          if (question.type === 'pack'  && v.pack) opts.add(v.pack);
          if (question.type === 'brand' && v.marca) opts.add(v.marca);
          if (question.type === 'form'  && v.forma) opts.add(v.forma);
        }
      }
      if (question.type === 'species') { opts.add('gato'); opts.add('perro'); }

      const rows = Array.from(opts).map(val => ({
        id: `disambig:${question.type}:${String(val)}`,
        title: String(val).slice(0, 24),
        description: undefined
      }));

      console.log(`[RECO][Q-OVERFLOW] type=${question.type} rows=${rows.length}`);

      await setState(from, 'awaiting_disambig');
      await setPending(from, {
        disambig: {
          question: question.type,
          signals,
          tokens: mergedTokens,
          consulta,
          opciones: rows.map(r => r.id)
        }
      });
      // marcamos que ya preguntamos este tipo (no cuenta como hop “normal”)
      await setReco(from, { asked: Array.from(new Set([...(asked||[]), question.type])) });

      await sendWhatsAppList(
        from,
        question.body,
        [{ title: question.title, rows }],
        question.title,
        t('btn_elegi')
      );
      return true;
    }

    // Si no hay pregunta útil, mostramos hasta el máximo y avisamos cómo refinar
    await sendWhatsAppText(from, t('muchos_resultados', { total: candidatos.length, max: SAFE_LIST_MAX, shown: SAFE_LIST_MAX }));
    await sendProductsList(from, candidatos.slice(0, SAFE_LIST_MAX), t('productos_select_header'));
    await setState(from, 'awaiting_consulta');
    return true;
  }

  // Aún podemos desambiguar normalmente
  if (question) {
    const { groups } = analyzeVariantDimensions(candidatos);
    const opts = new Set();
    for (const variants of groups.values()) {
      for (const v of variants) {
        if (question.type === 'weight' && v.peso) opts.add(v.peso);
        if (question.type === 'pack'  && v.pack) opts.add(v.pack);
        if (question.type === 'brand' && v.marca) opts.add(v.marca);
        if (question.type === 'form'  && v.forma) opts.add(v.forma);
      }
    }
    if (question.type === 'species') { opts.add('gato'); opts.add('perro'); }

    const rows = Array.from(opts).map(val => ({
      id: `disambig:${question.type}:${String(val)}`,
      title: String(val).slice(0, 24),
      description: undefined
    }));

    console.log(`[RECO][Q] type=${question.type} rows=${rows.length}`);

    await setState(from, 'awaiting_disambig');
    await setPending(from, {
      disambig: {
        question: question.type,
        signals,
        tokens: mergedTokens,
        consulta,
        opciones: rows.map(r => r.id)
      }
    });
    await setReco(from, { asked: Array.from(new Set([...(asked||[]), question.type])), hops: hops + 1 });

    await sendWhatsAppList(
      from,
      question.body,
      [{ title: question.title, rows }],
      question.title,
      t('btn_elegi')
    );
    return true;
  }

  // Si no hace falta preguntar más, mostramos TODO (si entra) o hasta el máximo permitido
  if (candidatos.length <= SAFE_LIST_MAX) {
    await sendWhatsAppText(from, t('mostrando_todos', { total: candidatos.length }));
    await sendProductsList(from, candidatos, t('productos_select_header'));
  } else {
    await sendWhatsAppText(from, t('muchos_resultados', { total: candidatos.length, max: SAFE_LIST_MAX, shown: SAFE_LIST_MAX }));
    await sendProductsList(from, candidatos.slice(0, SAFE_LIST_MAX), t('productos_select_header'));
  }
  await setState(from, 'awaiting_consulta');
  return true;
}

// ====== Resolver una respuesta de desambiguación ======
export async function handleDisambigAnswer(from, answerIdOrText) {
  const id = String(answerIdOrText || '').trim();
  const p = await getPending(from);
  const d = p?.disambig;
  if (!d) return false;

  let type = null, value = null;
  if (/^disambig:/.test(id)) {
    const [, t, ...rest] = id.split(':');
    type = t;
    value = rest.join(':');
  } else {
    type = d.question;
    value = String(answerIdOrText).trim();
  }

  const newSignals = { ...(d.signals || {}) };
  if (type === 'species') newSignals.species = NORM(value);
  if (type === 'form')    newSignals.form    = NORM(value);
  if (type === 'weight')  newSignals.weight_hint = normalizeWeightLabel(value);
  if (type === 'brand')   newSignals.brands  = Array.from(new Set([...(newSignals.brands||[]), value]));
  if (type === 'pack')    newSignals.packs   = Array.from(new Set([...(newSignals.packs||[]), value]));
  if (type === 'active')  newSignals.actives = Array.from(new Set([...(newSignals.actives||[]), value]));

  // 🆕 Limpio SOLO 'disambig' (preservo reco, asked, hops, etc.)
  await clearPendingKey(from, 'disambig');
  await setState(from, 'awaiting_consulta');

  // Merge señales + tokens al reco y continuar
  const prev = await getReco(from);
  const extraShould = [];
  if (newSignals.species) extraShould.push(newSignals.species);
  if (newSignals.form)    extraShould.push(newSignals.form);
  (newSignals.brands || []).forEach(b => extraShould.push(b));
  (newSignals.packs  || []).forEach(px => extraShould.push(px));
  if (newSignals.weight_hint) extraShould.push(newSignals.weight_hint);
  const extraMust = (newSignals.actives || []).map(NORM);

  const mergedTokens = {
    must:   Array.from(new Set([...(prev?.tokens?.must || []), ...extraMust])),
    should: Array.from(new Set([...(prev?.tokens?.should || []), ...extraShould])),
    negate: Array.from(new Set([...(prev?.tokens?.negate || [])]))
  };

  // Blindaje: marcamos "asked" también al responder
  const newAsked = Array.from(new Set([...(prev?.asked || []), type]));

  await setReco(from, {
    tokens: mergedTokens,
    signals: newSignals,
    asked: newAsked
  });

  console.log(`[RECO][ANS] type=${type} value="${value}"`);

  return runDisambiguationOrRecommend({ from, nombre: '', consulta: d.consulta });
}

```

---

### src/services/gptService.js (107 líneas)

```js
// src/services/gptService.js
import OpenAI from 'openai';
import 'dotenv/config';
import { getPromptSystemStrict, getPromptQueryExtract } from './promptTemplate.js';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18';

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn('⚠️ OPENAI_API_KEY no configurado: GPT se simula.');
}

export async function responderConGPTStrict(mensajeVet, { productosValidos = [], similares = [] } = {}) {
  const system = getPromptSystemStrict({ productosValidos, similares });

  if (!openai) {
    if (!productosValidos.length) {
      return 'No encontré ese producto en el catálogo de KrönenVet. ¿Podés darme nombre comercial o marca?';
    }
    const bloques = productosValidos.slice(0, 3).map(p => {
      const precio = p.precio ? ` $${Number(p.precio).toFixed(0)}` : '(consultar)';
      const promo  = p.promo?.activa ? `Sí: ${p.promo.nombre}` : 'No';
      return [
        `- Producto sugerido: ${p.nombre}`,
        `- Marca / Presentación: ${p.marca || '—'}${p.presentacion ? ` / ${p.presentacion}` : ''}`,
        `- ¿Tiene promoción?: ${promo}`,
        `- Precio estimado (si aplica): ${precio}`,
        `- ⚠️ Advertencia: Esta sugerencia no reemplaza una indicación clínica.`
      ].join('\n');
    });
    return bloques.join('\n\n');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: mensajeVet }
      ],
      temperature: 0.3
    });
    return completion.choices?.[0]?.message?.content || 'Sin respuesta del modelo.';
  } catch (error) {
    console.error('❌ Error OpenAI:', error);
    if (!productosValidos.length) {
      return 'No encontré ese producto en el catálogo de KrönenVet. ¿Podés darme nombre comercial o marca?';
    }
    const bloques = productosValidos.slice(0, 3).map(p => {
      const precio = p.precio ? ` $${Number(p.precio).toFixed(0)}` : '(consultar)';
      const promo  = p.promo?.activa ? `Sí: ${p.promo.nombre}` : 'No';
      return [
        `- Producto sugerido: ${p.nombre}`,
        `- Marca / Presentación: ${p.marca || '—'}${p.presentacion ? ` / ${p.presentacion}` : ''}`,
        `- ¿Tiene promoción?: ${promo}`,
        `- Precio estimado (si aplica): ${precio}`,
        `- ⚠️ Advertencia: Esta sugerencia no reemplaza una indicación clínica.`
      ].join('\n');
    });
    return bloques.join('\n\n');
  }
}

/** ---------- EXTRACTOR ---------- */
const STOP = new Set([
  'de','para','por','con','sin','y','o','la','el','los','las','un','una','unos','unas','que','del','al','en','a','se',
  'hola','holaa','holis','buenas','buenos','hey','hi','menu','menú','buscar','volver','opciones','inicio','gracias','chau','adios','adiós','hasta','luego','cancelar'
]);

const norm = (s) => (s || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').trim();

function naiveExtract(query) {
  const toks = norm(query).split(/\s+/).filter(Boolean).filter(w => !STOP.has(w));
  const should = Array.from(new Set(toks)).slice(0, 12);
  return { must: [], should, negate: [] };
}

export async function extraerTerminosBusqueda(query) {
  if (!query || typeof query !== 'string') return { must: [], should: [], negate: [] };

  if (!openai) return naiveExtract(query);

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: getPromptQueryExtract() },
        { role: 'user',   content: query }
      ],
      temperature: 0
    });

    let raw = completion.choices?.[0]?.message?.content || '{}';
    raw = raw.trim().replace(/^\s*```json\s*|\s*```\s*$/g, '');
    const parsed = JSON.parse(raw);
    const must   = Array.isArray(parsed.must)   ? parsed.must.map(norm)   : [];
    const should = Array.isArray(parsed.should) ? parsed.should.map(norm).filter(w => !STOP.has(w)) : [];
    const negate = Array.isArray(parsed.negate) ? parsed.negate.map(norm).filter(w => !STOP.has(w)) : [];
    return { must, should, negate };
  } catch (e) {
    console.error('⚠️ extraerTerminosBusqueda fallback:', e?.message);
    return naiveExtract(query);
  }
}

```

---

### src/services/intentService.js (99 líneas)

```js
// src/services/intentService.js
// ----------------------------------------------------
/**
 * Devuelve una de:
 * 'vacio' | 'saludo' | 'menu' | 'ayuda' | 'humano' | 'buscar' |
 * 'editar' | 'editar_nombre' | 'editar_email' |
 * 'confirm_si' | 'confirm_no' | 'volver' | 'logout' |
 * 'gracias' | 'despedida' | 'promos' | 'recomendacion' |
 * 'feedback_ok' | 'feedback_meh' | 'feedback_txt'
 */

// 👇 Normalizador robusto: saca tildes, caracteres invisibles (ZW*, LRM, etc.), colapsa espacios
export function sanitizeText(input = '') {
  return String(input)
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/g, '') // ZW* y format chars
    .replace(/\s+/g, ' ')
    .trim();
}

// 👇 Heurística de saludo “suelto” (hola/holis/buenas/hey/hi) ya normalizado
export function isLikelyGreeting(s = '') {
  const x = sanitizeText(s).toLowerCase();
  return (
    /^(ho+la+s?|holi+s?)$/.test(x) ||
    /^(buen[oa]s?(?: dias| tardes| noches)?)$/.test(x) ||
    /^(hey|hi)$/.test(x)
  );
}

const RX = {
  saludo: /^(hola+|holi+|buen[oa]s?(?:\s+dias|\s+tardes|\s+noches)?|hey|hi)$/i,
  menu: /^(menu|opciones|inicio)$/i,
  ayuda: /(ayuda|como\s+funciona|que\s+puedo\s+hacer)/i,
  gracias: /^(gracias+|grac+|mil\s+gracias|gracias!*)$/i,
  despedida: /(chau|adios|hasta\s+luego|nos\s+vemos)/i,
  humano: /(hablar|contactar|comunicar)(?:me)?\s+(con\s+)?(humano|asesor|ejecutiv[oa]|vendedor)/i,
  editar: /(editar|actualizar|cambiar)\s+(mis\s+)?(datos|perfil)/i,
  editar_nombre: /(cambi(ar|o)\s+)?(mi\s+)?nombre|actualizar\s+nombre/i,
  editar_email: /(cambi(ar|o)\s+)?(mi\s+)?email|correo|mail/i,
  logout: /(cerrar\s+sesion|cerrar\s+sesión|logout|salir|deslogue(ar|arse)|cerrar)$/i,
  confirm_si: /^(si|sí|s|ok|dale|confirmo|acepto|afirmativo)$/i,
  confirm_no: /^(no|n|cancelar|negativo)$/i,
  volver: /(volver|atras|atrás|anterior|retroceder)$/i,
  promos: /\b(promo(?:s)?|oferta(?:s)?)\b/i,
  buscar: /^(buscar|consulta|producto|recomendar)$/i
};

const BUTTON_IDS = new Map([
  ['buscar', 'buscar'],
  ['humano', 'humano'],
  ['editar', 'editar'],
  ['editar_nombre', 'editar_nombre'],
  ['editar_email', 'editar_email'],
  ['logout', 'logout'],
  ['cancelar', 'confirm_no'],
  ['confirm_yes', 'confirm_si'],
  ['confirm_no', 'confirm_no'],
  ['back', 'volver'],
  ['volver', 'volver'],
  // 🚫 quitamos 'ver_mas'
  ['perro', 'species_perro'],
  ['gato',  'species_gato'],
  ['fb_ok',  'feedback_ok'],
  ['fb_meh', 'feedback_meh'],
  ['fb_txt', 'feedback_txt'],

  // Items de lista "main.*" mapeados
  ['main.buscar', 'buscar'],
  ['main.promos', 'promos'],
  ['main.editar', 'editar'],
  ['main.logout', 'logout'],
]);

export function detectarIntent(texto = '') {
  const t = sanitizeText(texto);
  if (!t) return 'vacio';

  if (BUTTON_IDS.has(t)) return BUTTON_IDS.get(t);

  if (RX.saludo.test(t)) return 'saludo';
  if (RX.menu.test(t)) return 'menu';
  if (RX.ayuda.test(t)) return 'ayuda';
  if (RX.humano.test(t)) return 'humano';
  if (RX.editar_nombre.test(t)) return 'editar_nombre';
  if (RX.editar_email.test(t)) return 'editar_email';
  if (RX.editar.test(t)) return 'editar';
  if (RX.logout.test(t)) return 'logout';
  if (RX.volver.test(t)) return 'volver';
  if (RX.confirm_si.test(t)) return 'confirm_si';
  if (RX.confirm_no.test(t)) return 'confirm_no';
  if (RX.promos.test(t)) return 'promos';
  if (RX.buscar.test(t)) return 'buscar';
  if (RX.gracias.test(t)) return 'gracias';
  if (RX.despedida.test(t)) return 'despedida';

  return 'recomendacion';
}
```

---

### src/services/promptTemplate.js (117 líneas)

```js
// src/services/promptTemplate.js

export function getPromptSystemStrict({
  productosValidos = [],
  similares = [],
  ejemploIn = 'Pipetas para gatos',
  ejemploOut = `
- Producto sugerido: Pipeta X Gatos 2-5kg
- Marca / Presentación: MarcaZ / 1.5 ml
- ¿Tiene promoción?: No
- Precio estimado (si aplica): $1234
- ⚠️ Advertencia: Esta sugerencia no reemplaza una indicación clínica.
`.trim()
} = {}) {
  const productosJson = JSON.stringify(productosValidos, null, 2);
  const similaresJson = JSON.stringify(similares, null, 2);

  return `
Sos KaIA, asistente de WhatsApp para veterinarios de KronenVet.
Tono: cercano, profesional, español rioplatense. Respuestas breves y claras.

REGLAS ESTRICTAS (CUMPLIR SIEMPRE):
1) Sólo podés sugerir productos dentro de <productos_validos>. Si está vacío, NO inventes: devolvé el fallback.
   - Si hay 1..3 productos válidos, devolvé **un bloque por cada uno** con el formato del ejemplo, separados por una línea en blanco.
2) Formato EXACTO por cada producto:
- Producto sugerido: <nombre o "—">
- Marca / Presentación: <"Marca / Presentación" o "—">
- ¿Tiene promoción?: <"Sí: <detalle>" o "No">
- Precio estimado (si aplica): <"$<entero>" o "(consultar)">
- ⚠️ Advertencia: Esta sugerencia no reemplaza una indicación clínica.
3) Si no hay productos válidos, devolvé:
"No encontré ese producto en el catálogo de KronenVet. ¿Podés darme nombre comercial o marca?"
   Luego, si existen similares en <similares>, listalos en viñetas (•), máx. 3.
4) No diagnostiques ni prescribas. No inventes marcas, presentaciones ni precios.

EJEMPLO
<ejemplo>
Usuario: "${ejemploIn}"
KaIA:
${ejemploOut}
</ejemplo>

<productos_validos>
${productosJson}
</productos_validos>

<similares>
${similaresJson}
</similares>
`.trim();
}

/* --------- Extractor de señales para SQL --------- */
export function getPromptQueryExtract() {
  return `
Sos un extractor de señales para búsqueda de catálogo veterinario.
Dada una consulta del usuario, devolvés **sólo** un JSON con campos: must[], should[], negate[].
- "must": principios activos o marcas exactas mencionadas; si no hay, dejalo vacío.
- "should": especie (perro/gato/etc), forma (comprimidos/pipeta/inyección), rubro, indicación (antiparasitario, anticonvulsivo), alias/sinónimos útiles.
- "negate": términos a excluir si el usuario dijo "sin", "no", "excepto" (+ la palabra).

Reglas:
- minúsculas, sin tildes.
- 1..3 palabras por token.
- máximo 20 tokens en total (sumando must/should/negate).
- NO expliques nada, sólo JSON válido.

Ejemplos breves:
Usuario: "fenobarbital para perro chico anticonvulsivo"
{"must":["fenobarbital"],"should":["perro","anticonvulsivo","peso bajo","comprimidos"],"negate":[]}

Usuario: "condroprotector para gatos, sin msm"
{"must":[],"should":["gato","condroprotector","glucosamina","condroitina"],"negate":["msm"]}

Usuario: "pipeta pulgas 10kg bro..."
{"must":[],"should":["pipeta","pulgas","perro","10 kg","topico"],"negate":[]}
`.trim();
}

/* --------- Extractor de desambiguación rica --------- */
export function getPromptDisambigExtract() {
  return `
Sos un extractor de desambiguación para catálogo veterinario.
Devolvés **sólo** un objeto JSON con estas claves:
{
  "species": "perro" | "gato" | "equino" | "ave" | null,
  "form": "pipeta" | "comprimido" | "inyectable" | "spray" | "shampoo" | null,
  "brands": string[],
  "actives": string[],
  "indications": string[],
  "weight_hint": "2–5 kg" | "≤10 kg" | "≥20 kg" | "5 kg" | null,
  "packs": string[],
  "negatives": string[]
}

Reglas:
- Salida EXCLUSIVAMENTE JSON válido (un objeto).
- Minúsculas y sin tildes, excepto marcas si aparecen (podés respetar el casing original).
- "species": usar uno de los literales listados si corresponde; si no, null.
- "form": mapear a "pipeta", "comprimido", "inyectable", "spray" o "shampoo" cuando aplique; si no, null.
- "weight_hint": usar SOLO los formatos: "a–b kg", "≤n kg", "≥n kg" o "n kg". Si no hay dato, null.
- "packs": normalizar a "xN" si dice "pack", "xN" o "paquete de N".
- "negatives": si el usuario dice "sin X", "no X" o "excepto X", incluir "sin X" o el concepto correspondiente.
- "actives" e "indications": extraer de la consulta si están (ej: fipronil, imidacloprid, anticonvulsivo, pulgas, garrapatas, otitis, condroprotector).

Ejemplos:
Usuario: "pipeta para gato 2 a 5 kg, frontline o advantage contra pulgas"
{"species":"gato","form":"pipeta","brands":["frontline","advantage"],"actives":[],"indications":["pulgas"],"weight_hint":"2–5 kg","packs":[],"negatives":[]}

Usuario: "comprimidos para perro grande x6 sin corticoide"
{"species":"perro","form":"comprimido","brands":[],"actives":[],"indications":[],"weight_hint":null,"packs":["x6"],"negatives":["sin corticoide"]}

Usuario: "inyeccion ivermectina perro hasta 10kg"
{"species":"perro","form":"inyectable","brands":[],"actives":["ivermectina"],"indications":[],"weight_hint":"≤ 10 kg","packs":[],"negatives":[]}
`.trim();
}

```

---

### src/services/recommendationService.js (225 líneas)

```js
// src/services/recommendationService.js
import { Op } from 'sequelize';
import { Producto, Promocion } from '../models/index.js';

const DEBUG = process.env.DEBUG_RECO === '1';

const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

const SYN = {
  pipetas: ['pipeta', 'pipetas', 'spot on', 'spot-on', 'antiparasitario', 'antiparasitarios'],
  gatos: ['gato', 'gatos', 'felino', 'felinos'],
  perros: ['perro', 'perros', 'canino', 'caninos'],
  condroprotectores: [
    'condroprotector', 'condroprotectores',
    'glucosamina', 'sulfato de condroitina', 'condroitina',
    'hialuronato', 'ácido hialurónico', 'hialuronico', 'msm',
    'perna canaliculus', 'cartilago', 'cartílago'
  ],
};

const LIKE_FIELDS = ['nombre', 'presentacion', 'marca', 'rubro', 'familia', 'observaciones'];

function expandTerms(raw) {
  const toks = norm(raw).split(/\s+/).filter(Boolean);
  const out = new Set(toks);
  for (const t of toks) {
    for (const [k, arr] of Object.entries(SYN)) {
      if (k === t || arr.includes(t)) arr.forEach((x) => out.add(x));
    }
  }
  return Array.from(out);
}

export function toGPTProduct(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    marca: p.marca || '',
    presentacion: p.presentacion || '',
    precio: p.precio ? Number(p.precio) : null,
    rubro: p.rubro || '',
    familia: p.familia || '',
    promo: p.Promocions?.[0]
      ? { activa: true, nombre: p.Promocions[0].nombre }
      : { activa: false, nombre: '' },
  };
}

function logDiversity(tag, arr = []) {
  const weights = new Set();
  const packs = new Set();
  const brands = new Set();
  const forms = new Set();
  for (const p of arr) {
    const txt = norm(`${p.nombre} ${p.presentacion} ${p.rubro} ${p.familia} ${p.observaciones||''}`);
    const w = (txt.match(/\b(\d+(?:[.,]\d+)?)\s*(?:a|-|–|hasta)\s*(\d+(?:[.,]\d+)?)\s*kg\b/i) ||
               txt.match(/hasta\s*(\d+(?:[.,]\d+)?)\s*kg\b/i) ||
               txt.match(/\b(\d+(?:[.,]\d+)?)\s*kg\b/i)) ? 'peso' : null;
    if (w) weights.add('peso');

    const mPack = txt.match(/\bx\s*(\d{1,2})\b/i);
    if (mPack) packs.add(`x${mPack[1]}`);

    if (/\bpipet|spot[- ]?on|t[oó]pico\b/i.test(txt)) forms.add('pipeta');
    else if (/\bcomprimid|tableta|tabs\b/i.test(txt)) forms.add('comprimido');
    else if (/\binyect\b/i.test(txt)) forms.add('inyectable');

    if (p.marca) brands.add(norm(p.marca));
  }
  console.log(`[RECO][STATS] ${tag} :: candidatos=${arr.length} | marcas=${brands.size} | formas=${forms.size} | packs=${packs.size} | pesos=${weights.size}`);
}

/**
 * Recomienda desde BBDD con apoyo opcional de tokens GPT y señales ricas.
 * @param {string} termRaw
 * @param {{ gpt?: { must?: string[], should?: string[], negate?: string[] }, signals?: object }} opts
 */
export async function recomendarDesdeBBDD(termRaw = '', opts = {}) {
  const term = (termRaw || '').trim();
  const gpt = opts?.gpt || {};
  const sig = opts?.signals || {};

  const must = Array.from(new Set([
    ...(gpt.must || []).map(norm),
    ...(Array.isArray(sig.actives) ? sig.actives.map(norm) : [])
  ])).filter(Boolean);

  const should = Array.from(new Set([
    ...(gpt.should || []).map(norm),
    ...(sig.species ? [norm(sig.species)] : []),
    ...(sig.form ? [norm(sig.form)] : []),
    ...(Array.isArray(sig.brands) ? sig.brands.map(norm) : []),
    ...(Array.isArray(sig.indications) ? sig.indications.map(norm) : []),
    ...(Array.isArray(sig.packs) ? sig.packs.map(norm) : []),
    ...(sig.weight_hint ? [norm(sig.weight_hint)] : []),
  ])).filter(Boolean);

  const negate = Array.from(new Set([
    ...(gpt.negate || []).map(norm),
    ...(Array.isArray(sig.negatives) ? sig.negatives.map(norm) : [])
  ])).filter(Boolean);

  if (DEBUG) {
    console.log(`[RECO][INPUT] term="${term}" must=${must.length} should=${should.length} negate=${negate.length}`);
  }
  if (!term && !must.length && !should.length) {
    return { validos: [], top: null, similares: [] };
  }
  if (/^main\./i.test(term)) {
    if (DEBUG) console.log(`[RECO][SKIP] term="${term}" reason=main_cmd`);
    return { validos: [], top: null, similares: [] };
  }

  const expanded = expandTerms(term);

  // LIKE dinámico
  const shouldTokens = Array.from(new Set([...expanded, ...should])).filter(Boolean);
  const likeOr = [];
  for (const f of LIKE_FIELDS) {
    for (const t of shouldTokens) likeOr.push({ [f]: { [Op.like]: `%${t}%` } });
  }

  const mustClauses = must.map((t) => ({
    [Op.or]: LIKE_FIELDS.map((f) => ({ [f]: { [Op.like]: `%${t}%` } }))
  }));

  const negateClauses = negate.map((t) => ({
    [Op.and]: LIKE_FIELDS.map((f) => ({ [f]: { [Op.notLike]: `%${t}%` } }))
  }));

  const andClauses = [];
  if (mustClauses.length) andClauses.push(...mustClauses);
  if (negateClauses.length) andClauses.push(...negateClauses);

  const where = {
    visible: true,
    debaja: false,
    ...(likeOr.length ? { [Op.or]: likeOr } : {}),
    ...(andClauses.length ? { [Op.and]: andClauses } : {}),
  };

  if (DEBUG) {
    console.log(`[RECO][SQL] likeOr=${likeOr.length} andClauses=${andClauses.length} (must=${mustClauses.length}, negate=${negateClauses.length})`);
  }

  const candidatos = await Producto.findAll({
    where,
    include: [{ model: Promocion, attributes: ['nombre'], required: false }],
    limit: 120,
  });

  if (DEBUG) console.log(`[RECO][CAND] count=${candidatos.length}`);
  logDiversity('pre-score', candidatos);

  if (!candidatos.length) {
    return { validos: [], top: null, similares: [] };
  }

  // POST-FILTRO + SCORE con pesos para señales ricas (y penalización por especie opuesta)
  const tokensForHit = Array.from(new Set([...shouldTokens, ...must])).filter(Boolean);

  const scored = candidatos
    .map((p) => {
      const H = norm([
        p.nombre, p.presentacion, p.marca, p.rubro, p.familia, p.observaciones
      ].filter(Boolean).join(' | '));

      let s = 0;
      let hits = 0;

      // MUST fuerte (activos, etc.)
      for (const t of must) {
        if (t && H.includes(t)) { s += 6; hits++; }
      }
      // SHOULD (consulta + signals generales)
      for (const t of tokensForHit) {
        if (t && H.includes(t)) { s += 2; hits++; }
        if (t && norm(p.nombre).startsWith(t)) s += 1;
      }
      // Negativos
      for (const n of negate) {
        if (n && H.includes(n)) s -= 5;
      }

      // Bonos por señales ricas bien mapeadas
      if (sig.species && H.includes(norm(sig.species))) s += 3;
      if (sig.form && H.includes(norm(sig.form))) s += 3;
      (sig.brands || []).forEach(b => { if (b && H.includes(norm(b))) s += 2; });
      (sig.indications || []).forEach(i => { if (i && H.includes(norm(i))) s += 1; });
      (sig.packs || []).forEach(px => { if (px && H.includes(norm(px))) s += 2; });
      if (sig.weight_hint && H.includes(norm(sig.weight_hint))) s += 3;

      // 💥 Penalización especie contrapuesta (evita “GATOS” cuando piden “PERROS”, y viceversa)
      const hasPerro = /\bperr[oa]s?\b/.test(H);
      const hasGato  = /\bgat[oa]s?\b|felin[oa]s?/.test(H);
      if (sig.species === 'perro' && hasGato && !hasPerro) s -= 8;
      if (sig.species === 'gato'  && hasPerro && !hasGato) s -= 8;

      // Disponibilidad leve
      s += (Number(p.cantidad) || 0) / 1000;

      return { p, s, hits, H };
    })
    .filter(x => must.length ? must.some(t => t && x.H.includes(t)) : x.hits > 0)
    .sort((a, b) => b.s - a.s);

  if (!scored.length) {
    return { validos: [], top: null, similares: [] };
  }

  const ordered = scored.map(x => x.p);
  logDiversity('post-score', ordered);

  // Top N para conversación (preferimos 3-4, tope 6)
  const TOP_N = 6;
  const validos = ordered.slice(0, TOP_N).map(toGPTProduct);
  const top = validos[0] || null;
  const similares = ordered.slice(TOP_N, TOP_N + 6).map(toGPTProduct);

  if (DEBUG) console.log(`[RECO][OUT] validos=${validos.length} similares=${similares.length} top="${top?.nombre || '—'}"`);

  return { validos, top, similares };
}

```

---

### src/services/userService.js (42 líneas)

```js
// src/services/userService.js
import { Usuario, EjecutivoCuenta } from '../models/index.js';

export async function getVetByCuit(cuit) {
  if (!cuit) return null;
  return Usuario.findOne({
    where: { cuit: String(cuit) },
    include: [{ model: EjecutivoCuenta }],
  });
}

export function firstName(full = '') {
  const name = String(full || '').trim();
  if (!name) return '';
  return name.split(/\s+/)[0];
}

export function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function updateVetName(userId, nombre) {
  await Usuario.update({ nombre: String(nombre).trim() || null }, { where: { id: userId } });
}

export async function updateVetEmail(userId, email) {
  await Usuario.update({ email: String(email).trim() || null }, { where: { id: userId } });
}

/** Valida CUIT por checksum AFIP */
export function isValidCuitNumber(cuit = '') {
  const d = String(cuit).replace(/\D/g, '');
  if (!/^\d{11}$/.test(d)) return false;
  const mult = [5,4,3,2,7,6,5,4,3,2];
  const arr = d.split('').map(Number);
  const dv = arr[10];
  const sum = mult.reduce((acc, m, i) => acc + m * arr[i], 0);
  const mod = 11 - (sum % 11);
  const check = mod === 11 ? 0 : (mod === 10 ? 9 : mod);
  return check === dv;
}

```

---

### src/services/waSessionService.js (259 líneas)

```js
// src/services/waSessionService.js
import { WhatsAppSession } from '../models/index.js';

/* ================== CONFIG ================== */
const TTL_DAYS = Number(
  process.env.CUIT_VERIFY_TTL_DAYS ||
  process.env.WHATSAPP_SESSION_TTL_DAYS ||
  60
);
// ⏱️ Inactividad para volver al menú (12h por defecto)
const MENU_IDLE_MS = Number(process.env.MENU_IDLE_MS || (12 * 60 * 60 * 1000));
// ⏱️ Inactividad para ping de feedback (15m por defecto)
const FEEDBACK_IDLE_MS = Number(process.env.FEEDBACK_IDLE_MS || (15 * 60 * 1000));

/* ================== RECO DEFAULTS ================== */
export const DEF_SIGNALS = {
  species: null,
  form: null,
  brands: [],
  actives: [],
  indications: [],
  weight_hint: null,
  packs: [],
  negatives: []
};

export const DEF_RECO = {
  failCount: 0,
  tokens: { must: [], should: [], negate: [] },
  lastQuery: '',
  lastSimilares: [],
  lastShownIds: [],
  signals: { ...DEF_SIGNALS },
  asked: [],
  hops: 0,
  lastInteractionAt: null
};

/* ================== SESSION HELPERS ================== */
export async function getOrCreateSession(phone) {
  let s = await WhatsAppSession.findOne({ where: { phone } });
  if (!s) s = await WhatsAppSession.create({ phone, state: 'awaiting_cuit' });
  return s;
}

export function isExpired(session) {
  return !!(session?.expiresAt && new Date(session.expiresAt) < new Date());
}

export async function upsertVerified(phone, cuit) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TTL_DAYS);

  const [row] = await WhatsAppSession.upsert({
    phone,
    cuit: String(cuit),
    verifiedAt: new Date(),
    expiresAt,
    state: 'verified',
    pending: null,
    feedbackLastPromptAt: null,
    feedbackLastResponseAt: null
  }, { returning: true });

  return row;
}

export async function ensureExpiry(session) {
  if (session?.state === 'verified' && !session.expiresAt) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TTL_DAYS);
    await WhatsAppSession.update({ expiresAt }, { where: { id: session.id } });
    session.expiresAt = expiresAt;
  }
}

export async function bumpExpiry(phone) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TTL_DAYS);
  await WhatsAppSession.update({ expiresAt }, { where: { phone } });
}

export async function setState(phone, state) {
  await WhatsAppSession.update({ state }, { where: { phone } });
}

export async function getState(phone) {
  const s = await WhatsAppSession.findOne({ where: { phone } });
  return s?.state || 'awaiting_cuit';
}

export async function isLogged(phone) {
  const s = await WhatsAppSession.findOne({ where: { phone } });
  return !!(s && s.cuit && !isExpired(s));
}

/* ================== PENDING ================== */
export async function setPending(phone, pending) {
  const s = await WhatsAppSession.findOne({ where: { phone } });
  const cur = s?.pending || {};
  const next = mergePendingObjects(cur, pending);
  await WhatsAppSession.update({ pending: next }, { where: { phone } });
}

export async function getPending(phone) {
  const s = await WhatsAppSession.findOne({ where: { phone } });
  return s?.pending || null;
}

export async function clearPending(phone) {
  await WhatsAppSession.update({ pending: null }, { where: { phone } });
}

/** Limpia SOLO una clave de pending (ej. 'disambig'), preservando pending.reco */
export async function clearPendingKey(phone, key) {
  const s = await WhatsAppSession.findOne({ where: { phone } });
  const cur = s?.pending || null;
  if (!cur || !(key in cur)) return;
  const next = { ...cur };
  delete next[key];
  await WhatsAppSession.update({ pending: next }, { where: { phone } });
}

export async function logout(phone) {
  await WhatsAppSession.update(
    { state: 'awaiting_cuit', cuit: null, verifiedAt: null, expiresAt: null, pending: null },
    { where: { phone } }
  );
}

/** Marca el último mensaje real del usuario (para inactividad/feedback) */
export async function bumpLastInteraction(phone) {
  const s = await WhatsAppSession.findOne({ where: { phone } });
  const cur = s?.pending || {};
  const reco = { ...(cur.reco || {}), lastInteractionAt: new Date().toISOString() };
  await WhatsAppSession.update({ pending: { ...cur, reco } }, { where: { phone } });
}

function getLastInteractionFromSession(session) {
  return session?.pending?.reco?.lastInteractionAt || null;
}

/* ================== IDLENESS / FEEDBACK ================== */
export function shouldResetToMenu(session) {
  const lastIso = getLastInteractionFromSession(session);
  const base = lastIso ? new Date(lastIso) : new Date(session?.updatedAt || session?.createdAt || Date.now());
  return (Date.now() - base.getTime()) > MENU_IDLE_MS;
}

export function shouldPromptFeedback(session) {
  if (session?.feedbackLastPromptAt) return false;
  const lastIso = getLastInteractionFromSession(session);
  const base = lastIso ? new Date(lastIso) : new Date(session?.updatedAt || session?.createdAt || Date.now());
  return (Date.now() - base.getTime()) > FEEDBACK_IDLE_MS;
}

export async function markFeedbackPrompted(phone) {
  await WhatsAppSession.update({ feedbackLastPromptAt: new Date() }, { where: { phone } });
}

/* ================== RECO CONTEXTO ================== */
export async function getReco(phone) {
  const p = await getPending(phone);
  const def = { ...DEF_RECO };
  return (p && p.reco) ? deepMergeReco(def, p.reco) : def;
}

/** 🔥 HARD-REPLACE del reco (no merge). Úsalo para resets o búsquedas nuevas. */
export async function overwriteReco(phone, nextReco = DEF_RECO) {
  const s = await WhatsAppSession.findOne({ where: { phone } });
  const cur = s?.pending || {};
  const next = { ...cur, reco: { ...nextReco } };
  await WhatsAppSession.update({ pending: next }, { where: { phone } });
  return nextReco;
}

/** Merge (union) para refinamientos */
export async function setReco(phone, patch) {
  const cur = await getReco(fromSafe(phone));
  const next = deepMergeReco(cur, patch);
  const s = await WhatsAppSession.findOne({ where: { phone } });
  const curPending = s?.pending || {};
  await WhatsAppSession.update({ pending: { ...curPending, reco: next } }, { where: { phone } });
  return next;
}

export async function incRecoFail(phone) {
  const cur = await getReco(phone);
  return setReco(phone, { failCount: (cur.failCount || 0) + 1 });
}

export async function resetRecoFail(phone) {
  const cur = await getReco(phone);
  if (!cur.failCount) return cur;
  return setReco(phone, { failCount: 0 });
}

/** Vuelve al menú y limpia pending sin cerrar sesión */
export async function resetToMenu(phone) {
  await WhatsAppSession.update(
    { state: 'awaiting_consulta', pending: null },
    { where: { phone } }
  );
}

/** Helper público para borrar contexto de recomendación */
export async function resetRecoContext(phone) {
  await overwriteReco(phone, { ...DEF_RECO });
}

/* ================== UTILS ================== */
function fromSafe(v) { return String(v); }

function mergePendingObjects(a, b) {
  const out = { ...(a || {}), ...(b || {}) };
  if (a?.reco || b?.reco) {
    out.reco = deepMergeReco(a?.reco || {}, b?.reco || {});
  }
  return out;
}

function dedup(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function mergeSignals(a = {}, b = {}) {
  const A = { ...DEF_SIGNALS, ...(a || {}) };
  const B = { ...DEF_SIGNALS, ...(b || {}) };
  return {
    species: B.species ?? A.species ?? null,
    form:    B.form    ?? A.form    ?? null,
    brands:  dedup([...(A.brands||[]), ...(B.brands||[])]),
    actives: dedup([...(A.actives||[]), ...(B.actives||[])]),
    indications: dedup([...(A.indications||[]), ...(B.indications||[])]),
    weight_hint: B.weight_hint ?? A.weight_hint ?? null,
    packs:   dedup([...(A.packs||[]), ...(B.packs||[])]),
    negatives: dedup([...(A.negatives||[]), ...(B.negatives||[])])
  };
}

function mergeTokenSets(a = {}, b = {}) {
  const mergeArr = (x = [], y = []) => Array.from(new Set([...(x||[]), ...(y||[])])).filter(Boolean);
  return {
    must:   mergeArr(a.must,   b.must),
    should: mergeArr(a.should, b.should),
    negate: mergeArr(a.negate, b.negate)
  };
}

function deepMergeReco(a = {}, b = {}) {
  return {
    ...a,
    ...b,
    tokens: mergeTokenSets(a.tokens || {}, b.tokens || {}),
    signals: mergeSignals(a.signals || {}, b.signals || {}),
    asked: dedup([...(a.asked||[]), ...(b.asked||[])]),
    hops: Math.max(a.hops || 0, b.hops || 0)
  };
}
```

---

### src/services/wabaParser.js (25 líneas)

```js
// src/services/wabaParser.js
export function extractIncomingMessages(body) {
  const out = [];
  try {
    const entries = body?.entry || [];
    for (const e of entries) {
      const changes = e?.changes || [];
      for (const ch of changes) {
        const value = ch?.value || {};
        const msgs = value?.messages || [];
        for (const m of msgs) {
          const from = m.from;
          if (m.type === 'text') out.push({ from, text: (m.text?.body || '').trim() });
          if (m.type === 'interactive') {
            const it = m.interactive || {};
            if (it.type === 'list_reply' && it.list_reply?.id)   out.push({ from, text: String(it.list_reply.id).trim() });
            if (it.type === 'button_reply' && it.button_reply?.id) out.push({ from, text: String(it.button_reply.id).trim() });
          }
        }
      }
    }
  } catch {}
  return out;
}

```

---

### src/services/wabaUiService.js (30 líneas)

```js
// src/services/wabaUiService.js
import { sendWhatsAppList } from './whatsappService.js';
import { t } from '../config/texts.js';

export async function showMainMenu(from, nombre = '') {
  const body = t('menu_main_body');
  const sections = [{
    title: t('menu_main_title'),
    rows: [
      { id: 'main.buscar',  title: t('menu_item_buscar_title'), description: t('menu_item_buscar_desc') },
      { id: 'main.promos',  title: t('menu_item_promos_title'), description: t('menu_item_promos_desc') },
      { id: 'main.editar',  title: t('menu_item_editar_title'), description: t('menu_item_editar_desc') },
      { id: 'main.logout',  title: t('menu_item_logout_title'), description: t('menu_item_logout_desc') }
    ]
  }];
  const header = nombre ? t('saludo_header', { nombre }) : t('menu_main_title');
  await sendWhatsAppList(from, body, sections, header, t('btn_elegi'));
}

export async function showConfirmList(from, body, yesId = 'confirm.si', noId = 'confirm.no', header = 'Confirmar') {
  const sections = [{
    title: 'Confirmación',
    rows: [
      { id: yesId, title: t('btn_confirmar') },
      { id: noId , title: t('btn_cancelar') }
    ]
  }];
  await sendWhatsAppList(from, body, sections, header, t('btn_elegi'));
}

```

---

### src/services/whatsappService.js (158 líneas)

```js
// src/services/whatsappService.js
import 'dotenv/config';

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v19.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

function trimLen(str, max) {
  if (!str) return '';
  const s = String(str);
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

async function waFetch(payload, label = 'send') {
  if (!PHONE_NUMBER_ID || !TOKEN) {
    console.warn('⚠️ Falta configurar WHATSAPP_NUMBER_ID o WHATSAPP_TOKEN');
    console.debug(`[WA][DRYRUN][${label}]`, JSON.stringify(payload, null, 2));
    return null;
  }

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let data = {};
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    console.error(`[WA][ERR][${label}]`, { status: res.status, data });
    throw new Error(data?.error?.message || `WA API error ${res.status}`);
  }

  return data;
}

/**
 * Texto simple
 * @param {string} to - Número E.164 (ej: "5492211234567")
 * @param {string} text
 */
export async function sendWhatsAppText(to, text) {
  const body = trimLen(text || '', 4096);
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body }
  };
  console.log(`[TX][text] to=${to} :: ${body.slice(0, 160)}`);
  return waFetch(payload, 'text');
}

/**
 * Lista interactiva (List message)
 * @param {string} to
 * @param {string} bodyText - cuerpo del mensaje
 * @param {Array<{title:string, rows:Array<{id:string,title:string,description?:string}>}>} sections
 * @param {string} headerText - cabecera visible del listado
 * @param {string} buttonText - texto del botón (ej: "Elegí")
 */
export async function sendWhatsAppList(to, bodyText, sections = [], headerText = '', buttonText = 'Elegí') {
  // saneo longitudes máximas recomendadas por la API
  const safeSections = (sections || []).map(sec => ({
    title: trimLen(sec?.title || '', 24),
    rows: (sec?.rows || []).map(r => ({
      id: String(r.id),
      title: trimLen(r.title || 'Opción', 24),
      description: r.description ? trimLen(r.description, 72) : undefined
    }))
  }));

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: headerText ? { type: 'text', text: trimLen(headerText, 60) } : undefined,
      body: { text: trimLen(bodyText || '', 1024) },
      action: {
        button: trimLen(buttonText || 'Elegí', 20),
        sections: safeSections
      }
    }
  };

  console.log(`[TX][list] to=${to} :: header="${headerText || ''}" :: rows=${safeSections.reduce((n,s)=>n+(s.rows?.length||0),0)}`);
  return waFetch(payload, 'list');
}

/**
 * Botones interactivos (3 max)
 * @param {string} to
 * @param {string} bodyText
 * @param {Array<{id:string,title:string}>} buttons
 */
export async function sendWhatsAppButtons(to, bodyText, buttons = []) {
  const safeButtons = (buttons || []).slice(0, 3).map(b => ({
    type: 'reply',
    reply: {
      id: String(b.id),
      title: trimLen(b.title || 'Elegir', 20)
    }
  }));

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: trimLen(bodyText || '', 1024) },
      action: { buttons: safeButtons }
    }
  };

  console.log(`[TX][buttons] to=${to} :: ${safeButtons.map(b => b.reply.title).join(' | ')}`);
  return waFetch(payload, 'buttons');
}

/**
 * Enviar contactos (card de contacto)
 * @param {string} to
 * @param {Array<{formatted_name:string, first_name:string, last_name?:string, org?:string, phones?:Array<{phone:string,type?:string}>, emails?:Array<{email:string,type?:string}>}>} contacts
 */
export async function sendWhatsAppContacts(to, contacts = []) {
  const safeContacts = (contacts || []).map(c => ({
    name: {
      formatted_name: trimLen(c.formatted_name || `${c.first_name || ''} ${c.last_name || ''}`.trim(), 128),
      first_name: trimLen(c.first_name || '', 60),
      last_name: c.last_name ? trimLen(c.last_name, 60) : undefined
    },
    org: c.org ? { company: trimLen(c.org, 60) } : undefined,
    phones: (c.phones || []).map(p => ({ phone: String(p.phone), type: p.type || 'CELL' })),
    emails: (c.emails || []).map(e => ({ email: String(e.email), type: e.type || 'WORK' }))
  }));

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'contacts',
    contacts: safeContacts
  };

  console.log(`[TX][contacts] to=${to} :: contacts=${safeContacts.length}`);
  return waFetch(payload, 'contacts');
}

```