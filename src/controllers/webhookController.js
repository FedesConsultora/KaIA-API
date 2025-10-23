// src/controllers/webhookController.js
import 'dotenv/config';
import { sendWhatsAppText, sendWhatsAppButtons, sendWhatsAppContacts } from '../services/whatsappService.js';
import { recomendarDesdeBBDD } from '../services/recommendationService.js';
import { responderConGPTStrict } from '../services/gptService.js';
import {
  getOrCreateSession, isExpired, upsertVerified, setState, getState,
  ensureExpiry, setPending, getPending, clearPending, logout
} from '../services/waSessionService.js';
import { detectarIntent } from '../services/intentService.js';
import { getVetByCuit, firstName, isValidEmail, updateVetEmail, updateVetName } from '../services/userService.js';
import { t } from '../config/texts.js';

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'dev-token';

export function handleWhatsAppVerify(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) return res.status(200).type('text/plain').send(String(challenge));
  return res.sendStatus(403);
}

function extractIncomingMessages(body) {
  const out = [];
  try {
    const entries = body?.entry || [];
    for (const e of entries) {
      const changes = e?.changes || [];
      for (const ch of changes) {
        const value = ch?.value || {};
        const msgs = value?.messages || [];
        for (const m of msgs) {
          const from = m.from;
          if (m.type === 'text') out.push({ from, text: (m.text?.body || '').trim() });
          if (m.type === 'interactive') {
            const it = m.interactive || {};
            if (it.type === 'button_reply' && it.button_reply?.id) out.push({ from, text: String(it.button_reply.id).trim() });
            if (it.type === 'list_reply' && it.list_reply?.id) out.push({ from, text: String(it.list_reply.id).trim() });
          }
        }
      }
    }
  } catch {}
  return out;
}

function mainButtons() {
  return [
    { id: 'buscar', title: '🔍 Buscar producto' },
    { id: 'humano', title: '🧑‍💼 Hablar con ejecutivo' },
    { id: 'editar', title: '✏️ Editar mis datos' },
    { id: 'logout', title: '🚪 Cerrar sesión' }
  ];
}
function editButtons() {
  return [
    { id: 'editar_nombre', title: '📝 Cambiar nombre' },
    { id: 'editar_email', title: '📧 Cambiar email' },
    { id: 'cancelar', title: '↩️ Volver' }
  ];
}
function confirmButtons() {
  return [
    { id: 'confirm_yes', title: '✅ Sí, confirmar' },
    { id: 'confirm_no',  title: '↩️ No, cancelar' }
  ];
}

export async function handleWhatsAppMessage(req, res) {
  try {
    res.sendStatus(200);

    const messages = extractIncomingMessages(req.body);
    if (!messages.length) return;

    for (const { from, text } of messages) {
      const session = await getOrCreateSession(from);
      await ensureExpiry(session); // backfill si faltaba expiresAt

      // ====== Gating por CUIT
      if (session.state !== 'verified' || isExpired(session) || !session.cuit) {
        const digits = (text || '').replace(/\D/g, '');
        if (/^\d{11}$/.test(digits)) {
          await upsertVerified(from, digits);
          const vet = await getVetByCuit(digits);
          const nombre = firstName(vet?.nombre) || '';
          const ttl = Number(process.env.CUIT_VERIFY_TTL_DAYS || process.env.WHATSAPP_SESSION_TTL_DAYS || 60);
          await sendWhatsAppText(from, t('ok_cuit', { nombre, ttl }));
          await sendWhatsAppButtons(from, t('menu_main', { nombre }), mainButtons());
          continue;
        }
        await sendWhatsAppText(from, t('ask_cuit'));
        continue;
      }

      // ====== Perfil
      const vet = await getVetByCuit(session.cuit);
      const nombre = firstName(vet?.nombre) || '';

      // ====== Estados de confirmación
      const state = await getState(from);
      const pending = await getPending(from);

      // --- Captura de NUEVO NOMBRE (primero guardamos lo escrito y pedimos confirmación)
      if (state === 'awaiting_nombre_value') {
        const nuevo = String(text || '').trim().slice(0, 120);
        if (!nuevo) {
          await sendWhatsAppText(from, t('editar_pedir_nombre'));
          continue;
        }
        await setPending(from, { action: 'edit_nombre', value: nuevo });
        await setState(from, 'confirm');
        await sendWhatsAppButtons(from, t('editar_confirmar_nombre', { valor: nuevo }), confirmButtons());
        continue;
      }

      // --- Captura de NUEVO EMAIL (guardamos y pedimos confirmación)
      if (state === 'awaiting_email_value') {
        const email = String(text || '').trim();
        if (!isValidEmail(email)) {
          await sendWhatsAppText(from, t('editar_email_invalido'));
          continue;
        }
        await setPending(from, { action: 'edit_email', value: email });
        await setState(from, 'confirm');
        await sendWhatsAppButtons(from, t('editar_confirmar_email', { valor: email }), confirmButtons());
        continue;
      }

      // --- Estado de confirmación genérico
      if (state === 'confirm') {
        const intent = detectarIntent(text);
        if (intent === 'confirm_no') {
          await clearPending(from);
          await setState(from, 'verified');
          await sendWhatsAppText(from, t('cancelado'));
          await sendWhatsAppButtons(from, t('menu_main', { nombre }), mainButtons());
          continue;
        }
        if (intent === 'confirm_si') {
          if (!pending) {
            await setState(from, 'verified');
            await sendWhatsAppButtons(from, t('menu_main', { nombre }), mainButtons());
            continue;
          }
          const { action, value } = pending;

          if (action === 'edit_nombre') {
            await updateVetName(vet.id, value);
            await clearPending(from);
            await setState(from, 'verified');
            const nombreNuevo = firstName(value) || nombre;
            await sendWhatsAppText(from, t('editar_ok_nombre', { nombre: nombreNuevo }));
            await sendWhatsAppButtons(from, t('menu_main', { nombre: nombreNuevo }), mainButtons());
            continue;
          }
          if (action === 'edit_email') {
            await updateVetEmail(vet.id, value);
            await clearPending(from);
            await setState(from, 'verified');
            await sendWhatsAppText(from, t('editar_ok_email', { nombre, email: value }));
            await sendWhatsAppButtons(from, t('menu_main', { nombre }), mainButtons());
            continue;
          }
          if (action === 'logout') {
            await clearPending(from);
            await logout(from);
            await sendWhatsAppText(from, t('logout_ok'));
            await sendWhatsAppText(from, t('ask_cuit'));
            continue;
          }

          // Acción desconocida → cancelamos
          await clearPending(from);
          await setState(from, 'verified');
          await sendWhatsAppText(from, t('cancelado'));
          await sendWhatsAppButtons(from, t('menu_main', { nombre }), mainButtons());
          continue;
        }
        // Si manda cualquier otra cosa, le re-mostramos los botones de confirmación
        if (pending?.action === 'edit_nombre') {
          await sendWhatsAppButtons(from, t('editar_confirmar_nombre', { valor: pending.value }), confirmButtons());
        } else if (pending?.action === 'edit_email') {
          await sendWhatsAppButtons(from, t('editar_confirmar_email', { valor: pending.value }), confirmButtons());
        } else if (pending?.action === 'logout') {
          await sendWhatsAppButtons(from, t('logout_confirm'), confirmButtons());
        } else {
          await clearPending(from);
          await setState(from, 'verified');
          await sendWhatsAppButtons(from, t('menu_main', { nombre }), mainButtons());
        }
        continue;
      }

      // ====== Intent routing
      const intent = detectarIntent(text);

      if (['saludo', 'menu', 'ayuda', 'gracias'].includes(intent)) {
        if (intent === 'saludo') await sendWhatsAppText(from, t('saludo', { nombre }));
        await sendWhatsAppButtons(from, t('menu_main', { nombre }), mainButtons());
        continue;
      }

      if (intent === 'despedida') {
        await sendWhatsAppText(from, t('despedida', { nombre }));
        continue;
      }

      if (intent === 'editar') {
        await sendWhatsAppButtons(from, t('editar_intro'), editButtons());
        continue;
      }

      if (intent === 'editar_nombre') {
        await setState(from, 'awaiting_nombre_value');
        await sendWhatsAppText(from, t('editar_pedir_nombre'));
        continue;
      }

      if (intent === 'editar_email') {
        await setState(from, 'awaiting_email_value');
        await sendWhatsAppText(from, t('editar_pedir_email'));
        continue;
      }

      if (intent === 'logout') {
        await setPending(from, { action: 'logout' });
        await setState(from, 'confirm');
        await sendWhatsAppButtons(from, t('logout_confirm'), confirmButtons());
        continue;
      }

      if (intent === 'humano') {
        const ej = vet?.EjecutivoCuenta;
        if (ej) {
          await sendWhatsAppContacts(from, [{
            formatted_name: ej.nombre,
            phones: ej.phone ? [{ phone: ej.phone }] : [],
            emails: ej.email ? [{ email: ej.email }] : []
          }]);
          await sendWhatsAppText(from, t('ejecutivo_contacto_enviado', { ejecutivo: ej.nombre, telefono: ej.phone || '' }));
        } else {
          await sendWhatsAppText(from, t('ejecutivo_sin_asignar'));
        }
        continue;
      }

      // ====== Recomendación (IA con guardrails)
      const consulta = (text || '').trim();
      const { top, similares } = await recomendarDesdeBBDD(consulta);

      if (!top && !similares.length) {
        await sendWhatsAppButtons(from, t('no_match'), [
          { id: 'buscar', title: '🔁 Intentar otra búsqueda' },
          { id: 'humano', title: '🧑‍💼 Hablar con ejecutivo' }
        ]);
        continue;
      }

      let respuesta;
      try {
        respuesta = await responderConGPTStrict(consulta, { productosValidos: top ? [top] : [], similares });
      } catch {
        const lines = [];
        if (top) lines.push(`⭐ ${top.nombre}${top.presentacion ? ` (${top.presentacion})` : ''}${top.marca ? ` – ${top.marca}` : ''}`);
        for (const s of similares) lines.push(`• ${s.nombre}${s.presentacion ? ` (${s.presentacion})` : ''}${s.marca ? ` – ${s.marca}` : ''}`);
        respuesta = lines.join('\n') || t('error_generico');
      }

      await sendWhatsAppText(from, respuesta);
      // (opcional) renovar TTL en cada interacción:
      // await bumpExpiry(from);
    }
  } catch (err) {
    console.error('❌ Error en webhook WhatsApp:', err);
  }
}
