// src/config/texts.js
const TEXTS = {
  brand: { nombre: 'KrönenVet' },

  saludo_header: 'Hola {nombre} 👋',

  ask_cuit: `👋 ¡Hola! Soy KaIA, tu asistente virtual de KrönenVet.

Estoy acá para ayudarte con consultas sobre productos, stock y tu cuenta corriente.
Pero antes de seguir, necesito verificar que seas parte de nuestra comunidad profesional. 🩺

📌 Por favor, escribime tu **CUIT sin guiones ni espacios** para validar tu identidad.`,

  bad_cuit:
    '❌ No encontré ese CUIT en nuestra base. ¿Podrías revisarlo y volver a escribirlo **sin guiones ni espacios**?',
  ok_cuit: '¡Listo {nombre}! CUIT verificado ✅ Tu sesión vale {ttl} días.',

  pedir_consulta: 'Contame qué necesitás (nombre comercial, marca o para qué lo buscás).',

  // ahora sugerimos compuesto activo
  no_match:
    'No encontré productos con esa descripción. Probá con el nombre comercial, la marca o el **compuesto activo**.',

  // NUEVO: tips de refinado (para no tirar menú cada vez)
  refinar_tip:
    'Si querés, agregá **especie** (perro/gato), **presentación** (comprimidos/pipeta/inyección), **marca** o **compuesto activo** para afinar.',
  refinar_follow:
    'Podés seguir afinando: sumá marca, presentación, especie o compuesto activo. Si preferís, escribí "menú".',

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

  logout_confirm:
    '¿Querés cerrar sesión ahora? Vas a tener que volver a verificar tu CUIT.\n\n¿Confirmás cerrar sesión?',
  logout_ok:
    'Cerré tu sesión, {nombre}. ¡Gracias por usar KaIA! Cuando quieras seguir, decime tu CUIT para verificarte de nuevo. 👋',

  confirmado: 'Listo, ¡hecho! ✅',
  cancelado: 'Cancelé la acción. No hice cambios. ↩️',

  ejecutivo_contacto_enviado:
    'Te compartí el contacto de tu ejecutivo {ejecutivo}. También podés escribirle directo: wa.me/{telefono}',
  ejecutivo_sin_asignar:
    'Todavía no tenés un ejecutivo asignado. Avisanos y te contactamos a la brevedad.',

  ayuda: 'Soy KaIA, asistente de {marca}. Puedo recomendar productos, conectarte con tu ejecutivo y actualizar tus datos.',
  despedida: '¡Gracias por escribirnos, {nombre}! Que tengas un gran día. 🙌',
  error_generico: 'Tuvimos un inconveniente. Probá de nuevo en unos segundos.'
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
