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
