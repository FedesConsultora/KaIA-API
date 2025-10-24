// src/controllers/webhookController.js
import 'dotenv/config';
import {
  sendWhatsAppText,
  sendWhatsAppButtons,
  sendWhatsAppContacts,
  sendWhatsAppList
} from '../services/whatsappService.js';
import { recomendarDesdeBBDD } from '../services/recommendationService.js';
import { responderConGPTStrict } from '../services/gptService.js';
import {
  getOrCreateSession, isExpired, upsertVerified, setState, getState,
  ensureExpiry, setPending, getPending, clearPending, logout
} from '../services/waSessionService.js';
import { detectarIntent } from '../services/intentService.js';
import {
  getVetByCuit, firstName, isValidEmail, updateVetEmail, updateVetName
} from '../services/userService.js';
import { WhatsAppSession } from '../models/index.js';
import { t } from '../config/texts.js';

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'dev-token';

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

/* ========== EXTRACTOR ========== */
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
            if (it.type === 'button_reply' && it.button_reply?.id) {
              out.push({ from, text: String(it.button_reply.id).trim() });
            }
            if (it.type === 'list_reply' && it.list_reply?.id) {
              out.push({ from, text: String(it.list_reply.id).trim() });
            }
          }
        }
      }
    }
  } catch {}
  return out;
}

/* ========== MENÚS ========== */
// Máximo 3 botones (Cloud API).
function mainButtons() {
  return [
    { id: 'buscar',  title: '🔍 Buscar' },
    { id: 'humano',  title: '🧑‍💼 Ejecutivo' },
    { id: 'logout',  title: '🚪 Salir' }
  ];
}

// Menú extendido con LIST (sin romper el límite de 3 botones)
async function sendExtendedMenu(from, nombre) {
  const body = 'Además del menú rápido, tenés estas opciones:';
  const sections = [{
    title: 'Accesos rápidos',
    rows: [
      { id: 'editar',  title: '✏️ Mis datos',       description: 'Cambiar nombre o email' },
      { id: 'buscar',  title: '🔍 Buscar producto', description: 'Nombre, marca o necesidad' },
      { id: 'humano',  title: '🧑‍💼 Ejecutivo',      description: 'Te comparto su contacto' },
      { id: 'logout',  title: '🚪 Cerrar sesión',    description: 'Luego se vuelve a verificar CUIT' }
    ]
  }];
  await sendWhatsAppList(from, body, sections, `Hola ${nombre}`, 'Elegí');
}

function confirmButtons() {
  return [
    { id: 'confirm_yes', title: '✅ Confirmar' },
    { id: 'confirm_no',  title: '↩️ Cancelar' }
  ];
}

// Debounce de menú por usuario (evita “spam” de menú)
const lastMenuAt = new Map();
async function pushMenu(from, nombre, { extended = false } = {}) {
  const now = Date.now();
  const last = lastMenuAt.get(from) || 0;
  if (now - last < 60 * 1000) return; // 1 minuto
  lastMenuAt.set(from, now);

  await sendWhatsAppButtons(from, t('menu_main', { nombre }), mainButtons());
  if (extended) await sendExtendedMenu(from, nombre);
}

/* ===== Helper de recomendación ===== */
async function handleConsulta(from, nombre, consultaRaw) {
  const consulta = (consultaRaw || '').trim();
  if (!consulta) {
    await sendWhatsAppText(from, t('pedir_consulta'));
    return;
  }

  const { top, similares } = await recomendarDesdeBBDD(consulta);

  if (!top && !similares.length) {
    await sendWhatsAppButtons(from, t('no_match'), [
      { id: 'buscar', title: '🔁 Intentar' },
      { id: 'humano', title: '🧑‍💼 Ejecutivo' }
    ]);
    return;
  }

  let respuesta;
  try {
    respuesta = await responderConGPTStrict(consulta, {
      productosValidos: top ? [top] : [], similares
    });
  } catch {
    const lines = [];
    if (top) lines.push(
      `⭐ ${top.nombre}${top.presentacion ? ` (${top.presentacion})` : ''}${top.marca ? ` – ${top.marca}` : ''}`
    );
    for (const s of similares) {
      lines.push(`• ${s.nombre}${s.presentacion ? ` (${s.presentacion})` : ''}${s.marca ? ` – ${s.marca}` : ''}`);
    }
    respuesta = lines.join('\n') || t('error_generico');
  }

  await sendWhatsAppText(from, respuesta);
  await pushMenu(from, nombre); // vuelve a mostrar menú con debounce
}

/* ========== CONTROLLER PRINCIPAL ========== */
export async function handleWhatsAppMessage(req, res) {
  try {
    res.sendStatus(200);

    const messages = extractIncomingMessages(req.body);
    if (!messages.length) return;

    for (const { from, text } of messages) {
      const session = await getOrCreateSession(from);
      await ensureExpiry(session);

      console.log('[WH] from=%s state=%s text="%s"', from, session.state, (text || '').slice(0, 120));

      // ====== Gating por CUIT
      if (session.state !== 'verified' || isExpired(session) || !session.cuit) {
        const digits = (text || '').replace(/\D/g, '');
        if (/^\d{11}$/.test(digits)) {
          await upsertVerified(from, digits);
          const vet = await getVetByCuit(digits);
          const nombre = firstName(vet?.nombre) || '';
          const ttl = Number(process.env.CUIT_VERIFY_TTL_DAYS || process.env.WHATSAPP_SESSION_TTL_DAYS || 60);
          await sendWhatsAppText(from, t('ok_cuit', { nombre, ttl }));
          await pushMenu(from, nombre, { extended: true });
          continue;
        }
        await sendWhatsAppText(from, t('ask_cuit'));
        continue;
      }

      // ====== Perfil
      const vet = await getVetByCuit(session.cuit);
      const nombre = firstName(vet?.nombre) || '';

      // ====== Estados de captura/confirmación
      const state = await getState(from);
      const pending = await getPending(from);

      // --- Captura de NUEVO NOMBRE
      if (state === 'awaiting_nombre_value') {
        const nuevo = String(text || '').trim().slice(0, 120);
        if (!nuevo) { await sendWhatsAppText(from, t('editar_pedir_nombre')); continue; }
        await setPending(from, { action: 'edit_nombre', value: nuevo });
        await setState(from, 'confirm');
        await sendWhatsAppButtons(from, t('editar_confirmar_nombre', { valor: nuevo }), confirmButtons());
        continue;
      }

      // --- Captura de NUEVO EMAIL
      if (state === 'awaiting_email_value') {
        const email = String(text || '').trim();
        if (!isValidEmail(email)) { await sendWhatsAppText(from, t('editar_email_invalido')); continue; }
        await setPending(from, { action: 'edit_email', value: email });
        await setState(from, 'confirm');
        await sendWhatsAppButtons(from, t('editar_confirmar_email', { valor: email }), confirmButtons());
        continue;
      }

      // --- Captura de consulta (cuando el usuario tocó "Buscar")
      if (state === 'awaiting_consulta') {
        await setState(from, 'verified');
        await handleConsulta(from, nombre, text);
        continue;
      }

      // --- Confirmaciones
      if (state === 'confirm') {
        const intentC = detectarIntent(text);

        if (intentC === 'confirm_no') {
          await clearPending(from);
          await setState(from, 'verified');
          await sendWhatsAppText(from, t('cancelado'));
          await pushMenu(from, nombre, { extended: true });
          continue;
        }

        if (intentC === 'confirm_si') {
          if (!pending) { await setState(from, 'verified'); await pushMenu(from, nombre, { extended: true }); continue; }
          const { action, value } = pending;

          if (action === 'edit_nombre') {
            await updateVetName(vet.id, value);
            await clearPending(from);
            await setState(from, 'verified');
            const nombreNuevo = firstName(value) || nombre;
            await sendWhatsAppText(from, t('editar_ok_nombre', { nombre: nombreNuevo }));
            await pushMenu(from, nombreNuevo, { extended: true });
            continue;
          }
          if (action === 'edit_email') {
            await updateVetEmail(vet.id, value);
            await clearPending(from);
            await setState(from, 'verified');
            await sendWhatsAppText(from, t('editar_ok_email', { nombre, email: value }));
            await pushMenu(from, nombre, { extended: true });
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
          await pushMenu(from, nombre, { extended: true });
          continue;
        }

        // Si escribe otra cosa, re-mostramos la confirmación
        if (pending?.action === 'edit_nombre') {
          await sendWhatsAppButtons(from, t('editar_confirmar_nombre', { valor: pending.value }), confirmButtons());
        } else if (pending?.action === 'edit_email') {
          await sendWhatsAppButtons(from, t('editar_confirmar_email', { valor: pending.value }), confirmButtons());
        } else if (pending?.action === 'logout') {
          await sendWhatsAppButtons(from, t('logout_confirm'), confirmButtons());
        } else {
          await clearPending(from);
          await setState(from, 'verified');
          await pushMenu(from, nombre, { extended: true });
        }
        continue;
      }

      // ====== Intents generales
      const intent = detectarIntent(text);
      console.log('[WH] intent=%s pending=%s', intent, JSON.stringify(pending));

      if (['saludo', 'menu', 'ayuda', 'gracias'].includes(intent)) {
        if (intent === 'saludo') await sendWhatsAppText(from, t('saludo', { nombre }));
        await pushMenu(from, nombre, { extended: true });
        continue;
      }

      if (intent === 'despedida') {
        await sendWhatsAppText(from, t('despedida', { nombre }));
        continue;
      }

      if (intent === 'editar') {
        await sendWhatsAppButtons(from, t('editar_intro'), [
          { id: 'editar_nombre', title: '📝 Nombre' },
          { id: 'editar_email',  title: '📧 Email' },
          { id: 'cancelar',      title: '↩️ Volver' }
        ]);
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
          await sendWhatsAppText(
            from,
            t('ejecutivo_contacto_enviado', { ejecutivo: ej.nombre, telefono: ej.phone || '' })
          );
        } else {
          await sendWhatsAppText(from, t('ejecutivo_sin_asignar'));
        }
        await pushMenu(from, nombre);
        continue;
      }

      // ====== Feedback (anti-loop: marcamos respuesta)
      if (intent === 'feedback_ok') {
        await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
        await sendWhatsAppText(from, '¡Genial! Gracias por contarnos. 🙌');
        await pushMenu(from, nombre);
        continue;
      }
      if (intent === 'feedback_meh' || intent === 'feedback_txt') {
        await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
        await sendWhatsAppText(from, 'Te leo 👇 Contame en un mensaje qué mejorarías.');
        await setState(from, 'awaiting_feedback_text');
        continue;
      }

      if (state === 'awaiting_feedback_text') {
        const comentario = (text || '').trim().slice(0, 3000);
        if (!comentario) { await sendWhatsAppText(from, '¿Podés escribir tu comentario? 👇'); continue; }
        try {
          // Si tenés un modelo Feedback, guardalo acá.
          // await Feedback.create({ flow_id: 'feedback_inactividad', satisfecho: 'meh', comentario, phone: from });
        } catch (e) {
          console.error('Error guardando feedback:', e);
        }
        await setState(from, 'verified');
        await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
        await sendWhatsAppText(from, '¡Gracias! Registré tu comentario. 💬');
        await pushMenu(from, nombre);
        continue;
      }

      // ====== Botón “Buscar” (pide la consulta)
      if (intent === 'buscar') {
        await setState(from, 'awaiting_consulta');
        await sendWhatsAppText(from, t('pedir_consulta'));
        continue;
      }

      // ====== Fallback: interpretamos como consulta
      await handleConsulta(from, nombre, text);
    }
  } catch (err) {
    console.error('❌ Error en webhook WhatsApp:', err);
  }
}
