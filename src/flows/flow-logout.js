// src/flows/flow-logout.js
import { sendWhatsAppText, sendWhatsAppList } from '../services/whatsappService.js';
import { t } from '../config/texts.js';
import { detectarIntent } from '../services/intentService.js';
import {
  setState,
  getState,
  setPending,
  getPending,
  clearPending,
  logout as doLogout
} from '../services/waSessionService.js';

/** Pequeño helper para agregar pausas naturales */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function showConfirmLogout(from) {
  await sendWhatsAppList(
    from,
    '🔐 ' + t('logout_confirm'), // 🆕 icono de seguridad
    [{
      title: 'Cerrar sesión',
      rows: [
        { id: 'confirm.si', title: t('btn_confirmar') },
        { id: 'volver',     title: t('btn_volver') },
        { id: 'confirm.no', title: t('btn_cancelar') }
      ]
    }],
    'Confirmar',
    t('btn_elegi')
  );
}

export async function handle({ from, intent, normText, nombre }) {
  const state = await getState(from);
  const pending = await getPending(from);

  // Inicio del flujo de logout
  if (intent === 'logout') {
    await setPending(from, { action: 'logout', prev: { state } });
    await setState(from, 'confirm_logout');
    await showConfirmLogout(from);
    return true;
  }

  // Estado de confirmación
  if (state === 'confirm_logout' && pending?.action === 'logout') {
    const i = detectarIntent(normText);
    const isNo   = i === 'confirm_no' || normText === 'confirm.no';
    const isYes  = i === 'confirm_si' || normText === 'confirm.si';
    const isBack = i === 'volver'     || normText === 'volver';

    // Volver o Cancelar → no se cierra sesión
    if (isBack || isNo) {
      await setState(from, 'awaiting_consulta');
      await clearPending(from);
      await sendWhatsAppText(from, t('cancelado'));
      return true;
    }

    // Confirmar → cerrar sesión
    if (isYes) {
      await doLogout(from);
      await clearPending(from);

      // 🔐 Delay y feedback natural
      await sendWhatsAppText(from, '🔐 Cerrando tu sesión...');
      await delay(900); // pequeña pausa
      await sendWhatsAppText(from, t('logout_ok', { nombre }));
      return true;
    }

    // Entrada desconocida → re-mostrar confirmación
    await showConfirmLogout(from);
    return true;
  }

  return false;
}