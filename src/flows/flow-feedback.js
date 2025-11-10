// src/flows/flow-feedback.js
import { sendWhatsAppText } from '../services/whatsappService.js';
import { t } from '../config/texts.js';
import { WhatsAppSession } from '../models/index.js';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function handle({ from, intent, normText }) {
  if (intent === 'feedback_ok') {
    await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
    await sendWhatsAppText(from, '📝 Registrando tu respuesta…');
    await delay(700);
    await sendWhatsAppText(from, t('fb_ok_resp'));
    return true;
  }

  if (intent === 'feedback_meh' || intent === 'feedback_txt') {
    await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
    await sendWhatsAppText(from, '📝 Registrando tu respuesta…');
    await delay(600);
    await sendWhatsAppText(from, t('fb_meh_ask'));
    // dejamos el estado esperando texto libre acá
    await WhatsAppSession.update({ state: 'awaiting_feedback_text' }, { where: { phone: from } });
    return true;
  }

  // Si está esperando texto libre
  const row = await WhatsAppSession.findOne({ where: { phone: from } });
  if (row?.state === 'awaiting_feedback_text') {
    const comentario = (normText || '').slice(0, 3000);
    if (!comentario) { await sendWhatsAppText(from, t('fb_txt_empty')); return true; }

    await WhatsAppSession.update({ state: 'awaiting_consulta', feedbackLastResponseAt: new Date() }, { where: { phone: from } });
    await sendWhatsAppText(from, '🧠 Analizando tu feedback…');
    await delay(750);
    await sendWhatsAppText(from, t('fb_txt_ok'));
    await delay(300);
    await sendWhatsAppText(from, t('refinar_follow'));
    return true;
  }

  return false;
}
