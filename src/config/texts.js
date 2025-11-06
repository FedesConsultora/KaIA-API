// src/config/texts.js
const TEXTS = {
  brand: { nombre: 'KrönenVet' },

  /* ====== Saludos / gating ====== */
  saludo_header: 'Hola {nombre} 👋',
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

  // Desambiguación y flujo multistep
  reco_pedir_especie: '¿Para qué especie es?',
  reco_no_mas_similares:
    'No tengo más opciones similares por ahora. Probá afinando por especie, marca o presentación.',
  reco_similares_intro: 'Algunas alternativas similares:',

  // CTA de post-respuesta
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
    'Todavía no tenés un ejecutivo asignado. Avisanos y te contactamos a la brevedad.',
  escala_ejecutivo:
    'Te comparto el contacto de tu ejecutivo de cuentas **{ejecutivo}** para que continúen por ahí. 👇',

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
  btn_ver_mas: 'Ver más opciones',
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
