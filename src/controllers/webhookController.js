// src/controllers/webhookController.js
import 'dotenv/config';

import {
  sendWhatsAppText,
  sendWhatsAppButtons,
  sendWhatsAppContacts
} from '../services/whatsappService.js';

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
import * as FlowLogout from '../flows/flow-logout.js';
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
      console.log(`[RX][text] from=${from} :: ${text || ''}`);

      let session = await getOrCreateSession(from);
      await ensureExpiry(session);
      await bumpLastInteraction(from);

      // 1️⃣ Feedback ping (solo una vez)
      if (shouldPromptFeedback(session)) {
        await sendWhatsAppButtons(from, t('fb_ping'), [
          { id: 'fb_ok',  title: '👍 Sí' },
          { id: 'fb_meh', title: '👎 No' },
          { id: 'fb_txt', title: '💬 Dejar comentario' }
        ]);
        await markFeedbackPrompted(from);
      }

      // 2️⃣ Respuesta de desambiguación (“disambig:*”) → FlowSearch
      if (await FlowSearch.tryHandleDisambig(from, normText)) continue;

      // 3️⃣ Gating CUIT / expiración → FlowAuth
      if (await FlowAuth.handleAuthGate({ from, normText })) continue;

      // 4️⃣ Inactividad → volver al menú
      session = await getOrCreateSession(from);
      if (shouldResetToMenu(session)) {
        await resetToMenu(from);
        const vet = await getVetByCuit(session.cuit);
        await sendWhatsAppText(from, t('menu_back_idle'));
        await showMainMenu(from, firstName(vet?.nombre) || '');
        continue;
      }

      // 5️⃣ Sesión válida → renovar TTL
      await bumpExpiry(from);
      const vet = await getVetByCuit(session.cuit);
      const nombre = firstName(vet?.nombre) || '';
      const state = await getState(from);
      const intent = detectarIntent(normText);

      // 6️⃣ Feedback (👍 👎 💬)
      if (await FlowFeedback.handle({ from, intent, normText })) continue;

      // 7️⃣ Promos (lista y detalle)
      if (await FlowPromos.handle({ from, intent, normText })) continue;

      // 8️⃣ Edición de datos
      if (await FlowEdit.handle({ from, intent, normText, vet, nombre })) continue;

      // 9️⃣ Logout (cerrar sesión)
      if (await FlowLogout.handle({ from, intent, normText, nombre })) {
        if (intent === 'logout' || normText === 'confirm.si') {
          await sendWhatsAppText(
            from,
            `👋 Gracias ${nombre}, cerré tu sesión. Cuando quieras volver, escribí tu CUIT para continuar.`
          );
        }
        continue;
      }

      // 🔟 Hablar con humano / ejecutivo
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

      // 11️⃣ Menú / saludo / ayuda → flujo de menú
      if (await FlowMenu.handle({ from, intent, nombre })) {
        await FlowSearch.resetRecoUI(from);
        continue;
      }

      // 12️⃣ Buscar productos
      if (intent === 'buscar') {
        await FlowMenu.goBuscar({ from });
        continue;
      }

      // 13️⃣ Despedida
      if (intent === 'despedida') {
        await sendWhatsAppText(from, t('despedida', { nombre }));
        continue;
      }

      // 14️⃣ Búsqueda / desambiguación (por defecto)
      if (await FlowSearch.handle({ from, state, normText, vet, nombre })) continue;

      // 15️⃣ Fallback genérico
      await sendWhatsAppText(from, t('error_generico'));
    }
  } catch (err) {
    console.error('❌ Error en webhook WhatsApp:', err);
  }
}
