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
    await sendWhatsAppText(from, t('editar_status_nombre', { actual: vet?.nombre || '—' }));
    await sendWhatsAppText(from, t('editar_pedir_nombre'));
    return true;
  }
  if (intent === 'editar_email') {
    await setState(from, 'awaiting_email_value');
    await sendWhatsAppText(from, t('editar_status_email', { actual: vet?.email || '—' }));
    await sendWhatsAppText(from, t('editar_pedir_email'));
    return true;
  }

  // Captura de valores
  if (state === 'awaiting_nombre_value') {
    // soportar “volver/cancelar”
    const i2 = detectarIntent(normText);
    if (i2 === 'confirm_no' || i2 === 'volver') {
      await clearPending(from);
      await setState(from, 'awaiting_consulta');
      await sendWhatsAppText(from, t('cancelado'));
      return true;
    }

    const nuevo = String(normText || '').slice(0, 120);
    if (!nuevo) { await sendWhatsAppText(from, t('editar_pedir_nombre')); return true; }
    await setPending(from, { action: 'edit_nombre', value: nuevo, prevValue: vet?.nombre || '—', prev: { state } });
    await setState(from, 'confirm');
    await showConfirmList(
      from,
      t('editar_confirmar_nombre_full', { actual: vet?.nombre || '—', valor: nuevo }),
      'confirm.si',
      'confirm.no',
      'Confirmar cambio'
    );
    return true;
  }

  if (state === 'awaiting_email_value') {
    // soportar “volver/cancelar”
    const i2 = detectarIntent(normText);
    if (i2 === 'confirm_no' || i2 === 'volver') {
      await clearPending(from);
      await setState(from, 'awaiting_consulta');
      await sendWhatsAppText(from, t('cancelado'));
      return true;
    }

    const email = String(normText || '');
    if (!isValidEmail(email)) { await sendWhatsAppText(from, t('editar_email_invalido')); return true; }
    await setPending(from, { action: 'edit_email', value: email, prevValue: vet?.email || '—', prev: { state } });
    await setState(from, 'confirm');
    await showConfirmList(
      from,
      t('editar_confirmar_email_full', { actual: vet?.email || '—', valor: email }),
      'confirm.si',
      'confirm.no',
      'Confirmar cambio'
    );
    return true;
  }

  // Confirmaciones
  if (state === 'confirm') {
    const confirmIntent = detectarIntent(normText);
    const isNo   = confirmIntent === 'confirm_no' || normText === 'confirm.no';
    const isYes  = confirmIntent === 'confirm_si' || normText === 'confirm.si';
    const isBack = confirmIntent === 'volver'     || normText === 'volver';

    if (!pending) return false;

    if (isBack) {
      // volver a reingresar el valor
      const backState = pending.action === 'edit_email' ? 'awaiting_email_value' : 'awaiting_nombre_value';
      await setState(from, backState);
      if (backState === 'awaiting_email_value') {
        await sendWhatsAppText(from, t('editar_status_email', { actual: pending.prevValue || '—' }));
        await sendWhatsAppText(from, t('editar_pedir_email'));
      } else {
        await sendWhatsAppText(from, t('editar_status_nombre', { actual: pending.prevValue || '—' }));
        await sendWhatsAppText(from, t('editar_pedir_nombre'));
      }
      return true;
    }

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
      await showConfirmList(
        from,
        t('editar_confirmar_nombre_full', { actual: pending.prevValue || '—', valor: pending.value }),
        'confirm.si',
        'confirm.no',
        'Confirmar cambio'
      );
      return true;
    }
    if (pending.action === 'edit_email') {
      await showConfirmList(
        from,
        t('editar_confirmar_email_full', { actual: pending.prevValue || '—', valor: pending.value }),
        'confirm.si',
        'confirm.no',
        'Confirmar cambio'
      );
      return true;
    }
  }

  return false;
}