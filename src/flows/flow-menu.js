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
