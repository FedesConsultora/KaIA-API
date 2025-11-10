// src/flows/flow-menu.js
import { showMainMenu } from '../services/wabaUiService.js';
import { sendWhatsAppText } from '../services/whatsappService.js';
import { t } from '../config/texts.js';
import { setState } from '../services/waSessionService.js';

/** Delay helper para naturalidad */
function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * 🏠 Muestra el menú principal (cuando el usuario dice “menú”, “hola”, “ayuda”, etc.)
 */
export async function handle({ from, intent, nombre }) {
  if (!['menu', 'saludo', 'ayuda', 'gracias'].includes(intent)) return false;

  // Transición suave
  await sendWhatsAppText(from, '✨ Mostrando opciones del menú principal…');
  await delay(500);
  await showMainMenu(from, nombre || '');
  return true;
}

/**
 * 🔍 Activa modo búsqueda desde el menú o botón “Buscar productos”
 */
export async function goBuscar({ from }) {
  await setState(from, 'awaiting_consulta');
  await sendWhatsAppText(from, '🔎 Preparando búsqueda…');
  await delay(450);
  await sendWhatsAppText(from, t('pedir_consulta'));
}
