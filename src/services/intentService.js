// src/services/intentService.js
/**
 * Devuelve una de:
 * 'vacio' | 'saludo' | 'menu' | 'ayuda' | 'humano' |
 * 'editar' | 'editar_nombre' | 'editar_email' |
 * 'confirm_si' | 'confirm_no' | 'logout' |
 * 'gracias' | 'despedida' | 'recomendacion'
 */

const RX = {
  saludo: /^(hola+|holi+|buen[oa]s?(?:\s+d[ií]as|\s+tardes|\s+noches)?|hey|hi)$/i,
  menu: /^(menu|opciones|inicio)$/i,
  ayuda: /(ayuda|como\s+funciona|que\s+puedo\s+hacer)/i,
  gracias: /^(gracias+|grac+|mil\s+gracias|gracias!*)$/i,
  despedida: /(chau|adios|adiós|hasta\s+luego|nos\s+vemos)/i,
  humano: /(hablar|contactar|comunicar)(?:me)?\s+(con\s+)?(humano|asesor|ejecutiv[oa]|vendedor)/i,
  editar: /(editar|actualizar|cambiar)\s+(mis\s+)?(datos|perfil)/i,
  editar_nombre: /(cambi(ar|o)\s+)?(mi\s+)?nombre|actualizar\s+nombre/i,
  editar_email: /(cambi(ar|o)\s+)?(mi\s+)?email|correo|mail/i,
  logout: /(cerrar\s+sesión|cerrar\s+sesion|logout|salir|deslogue(ar|arse))/i,
  confirm_si: /^(si|sí|s|ok|dale|confirmo|acepto)$/i,
  confirm_no: /^(no|n|cancelar|volver)$/i
};

const BUTTON_IDS = new Map([
  ['buscar', 'recomendacion'],
  ['humano', 'humano'],
  ['editar', 'editar'],
  ['editar_nombre', 'editar_nombre'],
  ['editar_email', 'editar_email'],
  ['logout', 'logout'],
  ['cancelar', 'menu'],
  // confirmaciones:
  ['confirm_yes', 'confirm_si'],
  ['confirm_no', 'confirm_no']
]);

export function detectarIntent(texto = '') {
  const t = (texto || '').trim();
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
  if (RX.confirm_si.test(t)) return 'confirm_si';
  if (RX.confirm_no.test(t)) return 'confirm_no';
  if (RX.gracias.test(t)) return 'gracias';
  if (RX.despedida.test(t)) return 'despedida';

  return 'recomendacion';
}
