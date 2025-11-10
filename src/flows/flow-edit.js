// src/flows/flow-edit.js
import { sendWhatsAppText, sendWhatsAppButtons, sendWhatsAppList } from '../services/whatsappService.js';
import { t } from '../config/texts.js';
import { isValidEmail, updateVetEmail, updateVetName } from '../services/userService.js';
import { detectarIntent } from '../services/intentService.js';
import { setState, getState, setPending, getPending, clearPending } from '../services/waSessionService.js';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

/** UI helpers */
async function showEditMenu(from) {
  await sendWhatsAppList(
    from,
    t('editar_menu_body'),
    [{
      title: t('editar_menu_title'),
      rows: [
        { id: 'editar_nombre', title: 'Cambiar nombre', description: 'Actualizá cómo te llamamos' },
        { id: 'editar_email',  title: 'Cambiar email',  description: 'Actualizá tu correo' },
        { id: 'volver',        title: t('btn_volver') }
      ]
    }],
    t('editar_menu_title'),
    t('editar_menu_btn')
  );
}

async function showBackCancelButtons(from) {
  await sendWhatsAppButtons(from, 'También podés volver o cancelar:', [
    { id: 'volver',      title: t('btn_volver') },
    { id: 'confirm_no',  title: t('btn_cancelar') }
  ]);
}

async function showConfirm3(from, body) {
  // Confirmar / Volver / Cancelar — usando lista para 3 opciones
  await sendWhatsAppList(
    from,
    body,
    [{
      title: 'Confirmar cambio',
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

export async function handle({ from, intent, normText, vet, nombre }) {
  const state = await getState(from);
  const pending = await getPending(from);

  // Entrada por menú “editar” o selección directa
  if (intent === 'editar') {
    await sendWhatsAppText(from, t('editar_intro'));
    await showEditMenu(from);
    return true;
  }

  // Pedidos explícitos
  if (intent === 'editar_nombre') {
    await setState(from, 'awaiting_nombre_value');
    await sendWhatsAppText(from, t('editar_status_nombre', { actual: vet?.nombre || '—' }));
    await sendWhatsAppText(from, t('editar_pedir_nombre'));
    await showBackCancelButtons(from);
    return true;
  }
  if (intent === 'editar_email') {
    await setState(from, 'awaiting_email_value');
    await sendWhatsAppText(from, t('editar_status_email', { actual: vet?.email || '—' }));
    await sendWhatsAppText(from, t('editar_pedir_email'));
    await showBackCancelButtons(from);
    return true;
  }

  // Captura: NOMBRE
  if (state === 'awaiting_nombre_value') {
    const i2 = detectarIntent(normText);
    if (i2 === 'confirm_no' || i2 === 'volver') {
      await clearPending(from);
      await setState(from, 'awaiting_consulta');
      await sendWhatsAppText(from, t('cancelado'));
      return true;
    }

    const nuevo = String(normText || '').slice(0, 120).trim();
    if (!nuevo) {
      await sendWhatsAppText(from, t('editar_pedir_nombre'));
      await showBackCancelButtons(from);
      return true;
    }

    await setPending(from, { action: 'edit_nombre', value: nuevo, prevValue: vet?.nombre || '—', prev: { state } });
    await setState(from, 'confirm');
    await showConfirm3(from, t('editar_confirmar_nombre_full', { actual: vet?.nombre || '—', valor: nuevo }));
    return true;
  }

  // Captura: EMAIL
  if (state === 'awaiting_email_value') {
    const i2 = detectarIntent(normText);
    if (i2 === 'confirm_no' || i2 === 'volver') {
      await clearPending(from);
      await setState(from, 'awaiting_consulta');
      await sendWhatsAppText(from, t('cancelado'));
      return true;
    }

    const email = String(normText || '').trim();
    if (!isValidEmail(email)) {
      await sendWhatsAppText(from, t('editar_email_invalido'));
      await showBackCancelButtons(from);
      return true;
    }

    await setPending(from, { action: 'edit_email', value: email, prevValue: vet?.email || '—', prev: { state } });
    await setState(from, 'confirm');
    await showConfirm3(from, t('editar_confirmar_email_full', { actual: vet?.email || '—', valor: email }));
    return true;
  }

  // Confirmaciones (3 opciones)
  if (state === 'confirm') {
    const confirmIntent = detectarIntent(normText);
    const isNo   = confirmIntent === 'confirm_no' || normText === 'confirm.no';
    const isYes  = confirmIntent === 'confirm_si' || normText === 'confirm.si';
    const isBack = confirmIntent === 'volver'     || normText === 'volver';

    if (!pending) return false;

    if (isBack) {
      const backState = pending.action === 'edit_email' ? 'awaiting_email_value' : 'awaiting_nombre_value';
      await setState(from, backState);
      if (backState === 'awaiting_email_value') {
        await sendWhatsAppText(from, t('editar_status_email', { actual: pending.prevValue || '—' }));
        await sendWhatsAppText(from, t('editar_pedir_email'));
      } else {
        await sendWhatsAppText(from, t('editar_status_nombre', { actual: pending.prevValue || '—' }));
        await sendWhatsAppText(from, t('editar_pedir_nombre'));
      }
      await showBackCancelButtons(from);
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
        await sendWhatsAppText(from, '📝 Guardando cambios…');
        await delay(900);

        await updateVetName(vet.id, pending.value);
        await clearPending(from);
        await setState(from, 'awaiting_consulta');
        await sendWhatsAppText(from, t('editar_ok_nombre', { nombre: pending.value.split(' ')[0] || nombre }));
        await delay(300);
        await sendWhatsAppText(from, t('refinar_follow'));
        return true;
      }
      if (pending.action === 'edit_email') {
        await sendWhatsAppText(from, '📝 Guardando cambios…');
        await delay(900);

        await updateVetEmail(vet.id, pending.value);
        await clearPending(from);
        await setState(from, 'awaiting_consulta');
        await sendWhatsAppText(from, t('editar_ok_email', { nombre, email: pending.value }));
        await delay(300);
        await sendWhatsAppText(from, t('refinar_follow'));
        return true;
      }
    }

    // Si escribió otra cosa, re-mostramos la confirmación
    if (pending.action === 'edit_nombre') {
      await showConfirm3(from, t('editar_confirmar_nombre_full', { actual: pending.prevValue || '—', valor: pending.value }));
      return true;
    }
    if (pending.action === 'edit_email') {
      await showConfirm3(from, t('editar_confirmar_email_full', { actual: pending.prevValue || '—', valor: pending.value }));
      return true;
    }
  }

  // Si llega texto suelto y no estamos capturando/confirmando, no tomamos control
  return false;
}
