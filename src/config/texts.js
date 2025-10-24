const TEXTS = {
  brand: { nombre: 'KronenVet' },

  // Saludos y menú
  saludo: '¡Hola {nombre}! 👋',
  menu_main:
    '¿En qué te ayudo hoy?\n' +
    '• 🔍 Buscar producto (nombre, marca o necesidad)\n' +
    '• 🧑‍💼 Hablar con tu ejecutivo\n' +
    '• 🚪 Cerrar sesión',

  // CUIT / verificación
  ask_cuit: 'Para continuar, decime tu CUIT (11 dígitos, sin guiones).',
  bad_cuit: 'No encuentro ese CUIT en la base de clientes. ¿Podés revisarlo o contactarte con tu ejecutivo?',
  ok_cuit: '¡Listo {nombre}! CUIT verificado ✅ Tu sesión vale {ttl} días.',

  // Recomendación
  pedir_consulta: 'Contame qué necesitás (nombre comercial, marca o para qué lo buscás).',
  no_match:
    'No encontré productos con esa descripción. Probá con el nombre comercial o la marca.\n' +
    'Si preferís, puedo ponerte en contacto con tu ejecutivo.',

  // Edición + confirmaciones
  editar_intro: 'Podés actualizar tus datos. ¿Qué querés cambiar?',
  editar_pedir_nombre: 'Decime tu nombre tal como querés que figure (por ejemplo: “Clínica San Martín”).',
  editar_confirmar_nombre: 'Vas a cambiar tu nombre a:\n“{valor}”\n\n¿Confirmás el cambio?',
  editar_ok_nombre: '¡Hecho, {nombre}! Actualicé tu nombre. ✍️',

  editar_pedir_email: 'Decime tu email (ej: ejemplo@dominio.com).',
  editar_confirmar_email: 'Vas a cambiar tu email a:\n“{valor}”\n\n¿Confirmás el cambio?',
  editar_ok_email: 'Perfecto {nombre}, guardé tu email {email}. 📧',
  editar_email_invalido: 'Ese email no parece válido. Probá de nuevo (ej: ejemplo@dominio.com).',

  // Logout
  logout_confirm: '¿Querés cerrar sesión ahora? Vas a tener que volver a verificar tu CUIT.\n\n¿Confirmás cerrar sesión?',
  logout_ok: 'Cerré tu sesión. Cuando quieras seguir, decime tu CUIT para verificarte de nuevo.',

  // Confirm genérico
  confirmado: 'Listo, ¡hecho! ✅',
  cancelado: 'Cancelé la acción. No hice cambios. ↩️',

  // Ejecutivo / contactos
  ejecutivo_contacto_enviado:
    'Te compartí el contacto de tu ejecutivo {ejecutivo}. También podés escribirle directo: wa.me/{telefono}',
  ejecutivo_sin_asignar: 'Todavía no tenés un ejecutivo asignado. Avisanos y te contactamos a la brevedad.',

  // Ayuda / otros
  ayuda: 'Soy KaIA, asistente de {marca}. Puedo recomendar productos, conectarte con tu ejecutivo y actualizar tus datos.',
  despedida: '¡Gracias por escribirnos, {nombre}! 🙌',
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
