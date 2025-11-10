// src/controllers/webhookController.js
import 'dotenv/config';

import { sendWhatsAppText, sendWhatsAppButtons, sendWhatsAppContacts } from '../services/whatsappService.js';
import { t } from '../config/texts.js';

import { VERIFY_TOKEN, ADMIN_PHONE_DIGITS } from '../config/app.js';
import { extractIncomingMessages } from '../services/wabaParser.js';

import {
  getOrCreateSession, ensureExpiry, isExpired, bumpExpiry,
  shouldPromptFeedback, markFeedbackPrompted,
  shouldResetToMenu, resetToMenu, bumpLastInteraction, getState, setState
} from '../services/waSessionService.js';

import { detectarIntent, isLikelyGreeting, sanitizeText } from '../services/intentService.js';
import { getVetByCuit, firstName } from '../services/userService.js';

import * as FlowAuth from '../flows/flow-auth.js';
import * as FlowMenu from '../flows/flow-menu.js';
import * as FlowSearch from '../flows/flow-search.js';
import * as FlowEdit from '../flows/flow-edit.js';
import * as FlowPromos from '../flows/flow-promos.js';
import * as FlowFeedback from '../flows/flow-feedback.js';
import { showMainMenu } from '../services/wabaUiService.js';

/* ========== VERIFY (hub.challenge) ========== */
export function handleWhatsAppVerify(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).type('text/plain').send(String(challenge));
  }
  return res.sendStatus(403);
}

/* ========== MAIN WEBHOOK ========== */
export async function handleWhatsAppMessage(req, res) {
  try {
    // WhatsApp exige 200 rápido
    res.sendStatus(200);

    const messages = extractIncomingMessages(req.body);
    if (!messages.length) return;

    for (const { from, text } of messages) {
      const normText = sanitizeText(text || '');
      let session = await getOrCreateSession(from);
      await ensureExpiry(session);
      await bumpLastInteraction(from);

      // Feedback ping (solo una vez)
      if (shouldPromptFeedback(session)) {
        await sendWhatsAppButtons(from, t('fb_ping'), [
          { id: 'fb_ok',  title: '👍 Sí' },
          { id: 'fb_meh', title: '👎 No' },
          { id: 'fb_txt', title: '💬 Dejar comentario' }
        ]);
        await markFeedbackPrompted(from);
      }

      // 1) Posible respuesta de desambiguación (“disambig:*”) → FlowSearch primero
      if (await FlowSearch.tryHandleDisambig(from, normText)) continue;

      // 2) Gating CUIT / expiración → FlowAuth
      if (await FlowAuth.handleAuthGate({ from, normText })) continue;

      // 3) Inactividad → volvemos a menú
      session = await getOrCreateSession(from);
      if (shouldResetToMenu(session)) {
        await resetToMenu(from);
        const vet = await getVetByCuit(session.cuit);
        await sendWhatsAppText(from, t('menu_back_idle'));
        await showMainMenu(from, firstName(vet?.nombre) || '');
        continue;
      }

      // 4) Ya logueado: renovar TTL
      await bumpExpiry(from);
      const vet = await getVetByCuit(session.cuit);
      const nombre = firstName(vet?.nombre) || '';
      const state = await getState(from);
      const intent = detectarIntent(normText);

      // 5) Feedback flow (cubre fb_ok, fb_meh, fb_txt y el texto libre)
      if (await FlowFeedback.handle({ from, intent, normText })) continue;

      // 6) Promos (lista y abrir “promo:<id>”)
      if (await FlowPromos.handle({ from, intent, normText })) continue;

      // 7) Edición de datos (entrada por “editar”, “editar_nombre”, “editar_email” o estados de captura)
      if (await FlowEdit.handle({ from, intent, normText, vet, nombre })) continue;

      // 8) Humano directo
      if (intent === 'humano') {
        if (vet?.EjecutivoCuenta) {
          const ej = vet.EjecutivoCuenta;
          await sendWhatsAppContacts(from, [{
            formatted_name: ej.nombre,
            first_name: ej.nombre?.split(' ')[0],
            last_name: ej.nombre?.split(' ').slice(1).join(' ') || undefined,
            org: 'KrönenVet',
            phones: ej.phone ? [{ phone: ej.phone, type: 'WORK' }] : [],
            emails: ej.email ? [{ email: ej.email, type: 'WORK' }] : []
          }]);
          await sendWhatsAppText(from, t('ejecutivo_contacto_enviado', { ejecutivo: ej.nombre, telefono: ej.phone || '' }));
        } else {
          await sendWhatsAppContacts(from, [{
            formatted_name: 'Administración KronenVet',
            first_name: 'Administración',
            last_name: 'KronenVet',
            org: 'KrönenVet',
            phones: [{ phone: ADMIN_PHONE_DIGITS, type: 'WORK' }]
          }]);
          await sendWhatsAppText(from, t('handoff_admin', { telefono: ADMIN_PHONE_DIGITS }));
        }
        continue;
      }

      // 9) Menú / saludos / ayuda → mostrar menú
      if (['menu','saludo','ayuda','gracias'].includes(intent) || isLikelyGreeting(normText)) {
        await FlowSearch.resetRecoUI(from);
        await showMainMenu(from, nombre);
        continue;
      }

      // 10) Buscar (entra al estado “awaiting_consulta”)
      if (intent === 'buscar') {
        await setState(from, 'awaiting_consulta');
        await sendWhatsAppText(from, t('pedir_consulta'));
        continue;
      }

      // 11) Despedida
      if (intent === 'despedida') {
        await sendWhatsAppText(from, t('despedida', { nombre }));
        continue;
      }

      // 12) Default: flujo de búsqueda y desambiguación (incluye “prod:<id>”)
      if (await FlowSearch.handle({ from, state, normText, vet, nombre })) continue;

      // 13) Último fallback
      await sendWhatsAppText(from, t('error_generico'));
    }
  } catch (err) {
    console.error('❌ Error en webhook WhatsApp:', err);
  }
}
