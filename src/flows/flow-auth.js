// src/flows/flow-auth.js
import { sendWhatsAppText } from '../services/whatsappService.js';
import { t } from '../config/texts.js';
import { isValidCuitNumber, getVetByCuit, firstName } from '../services/userService.js';
import {
  getOrCreateSession, upsertVerified, isExpired, setState
} from '../services/waSessionService.js';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function handleAuthGate({ from, normText }) {
  const session = await getOrCreateSession(from);
  const loggedIn = !!(session.cuit && !isExpired(session));
  if (loggedIn) return false; // no hace falta gating

  const digits = (normText || '').replace(/\D/g, '');
  if (/^\d{11}$/.test(digits)) {
    if (!isValidCuitNumber(digits)) {
      await sendWhatsAppText(from, t('bad_cuit'));
      return true;
    }
    const vet = await getVetByCuit(digits);
    if (!vet) {
      await sendWhatsAppText(from, t('bad_cuit'));
      return true;
    }

    // 🕒 Feedback natural antes de confirmar
    await sendWhatsAppText(from, '🔐 Verificando tu CUIT…');
    await delay(900);

    await upsertVerified(from, digits);
    const nombre = firstName(vet?.nombre) || '';
    const ttl = Number(process.env.CUIT_VERIFY_TTL_DAYS || process.env.WHATSAPP_SESSION_TTL_DAYS || 60);

    await sendWhatsAppText(from, t('ok_cuit', { nombre, ttl }));
    await delay(350);

    await setState(from, 'awaiting_consulta');
    await sendWhatsAppText(from, t('pedir_consulta'));
    return true;
  }

  // Pide CUIT
  await sendWhatsAppText(from, t('ask_cuit'));
  return true;
}
