// src/controllers/webhookController.js
import 'dotenv/config';
import {
  sendWhatsAppText,
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
import { WhatsAppSession, Promocion } from '../models/index.js';
import { t } from '../config/texts.js';

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'dev-token';

/* ========== Mensaje CUIT (fijo, siempre este) ========== */
const CUIT_PROMPT = `👋 ¡Hola! Soy KaIA, tu asistente virtual de KrönenVet.

Estoy acá para ayudarte con consultas sobre productos, stock y tu cuenta corriente.  
Pero antes de seguir, necesito verificar que seas parte de nuestra comunidad profesional. 🩺

📌 Por favor, escribime tu **CUIT sin guiones ni espacios** para validar tu identidad.`;

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
            if (it.type === 'list_reply' && it.list_reply?.id) {
              out.push({ from, text: String(it.list_reply.id).trim() });
            }
            if (it.type === 'button_reply' && it.button_reply?.id) {
              // Por compatibilidad: si alguna vez llega un botón, lo tratamos como texto
              out.push({ from, text: String(it.button_reply.id).trim() });
            }
          }
        }
      }
    }
  } catch {}
  return out;
}

/* ========== LISTAS (sin botones) ========== */
async function sendMainList(from, nombre = '') {
  const body = '¿Qué te gustaría hacer?';
  const sections = [{
    title: 'KaIA – KrönenVet',
    rows: [
      { id: 'main.buscar',  title: '🔍 Buscar productos', description: 'Nombre, marca o necesidad' },
      { id: 'main.promos',  title: '🎁 Promociones',      description: 'Ofertas vigentes' },
      { id: 'main.editar',  title: '✍️ Mis datos',        description: 'Cambiar nombre o email' },
      { id: 'main.logout',  title: '🚪 Cerrar sesión',     description: 'Luego volverás a verificar tu CUIT' }
    ]
  }];
  const header = nombre ? t('saludo_header', { nombre }) : 'KaIA';
  await sendWhatsAppList(from, body, sections, header, 'Elegí');
}

async function sendConfirmList(from, body, yesId = 'confirm.si', noId = 'confirm.no', header = 'Confirmar') {
  const sections = [{
    title: 'Confirmación',
    rows: [
      { id: yesId, title: '✅ Confirmar' },
      { id: noId , title: '↩️ Cancelar' }
    ]
  }];
  await sendWhatsAppList(from, body, sections, header, 'Elegí');
}

/* ===== Helper de recomendación ===== */
async function handleConsulta(from, nombre, consultaRaw) {
  const consulta = (consultaRaw || '').trim();
  if (!consulta) {
    await sendWhatsAppText(from, t('pedir_consulta'));
    return;
  }

  // Soporta varios productos (hasta 3)
  const { validos = [], top, similares = [] } = await recomendarDesdeBBDD(consulta);
  const productosValidos = Array.isArray(validos) && validos.length
    ? validos.slice(0, 3)
    : (top ? [top] : []);

  if (!productosValidos.length && (!similares || !similares.length)) {
    await sendWhatsAppText(from, t('no_match'));
    await sendMainList(from, nombre);
    return;
  }

  let respuesta;
  try {
    respuesta = await responderConGPTStrict(consulta, { productosValidos, similares });
  } catch {
    // Fallback local con varios productos
    const bloques = productosValidos.map(p => {
      const precio = p.precio ? ` $${Number(p.precio).toFixed(0)}` : '(consultar)';
      const promo  = p.promo?.activa ? `Sí: ${p.promo.nombre}` : 'No';
      return [
        `- Producto sugerido: ${p.nombre}`,
        `- Marca / Presentación: ${p.marca || '—'}${p.presentacion ? ` / ${p.presentacion}` : ''}`,
        `- ¿Tiene promoción?: ${promo}`,
        `- Precio estimado (si aplica): ${precio}`,
        `- ⚠️ Advertencia: Esta sugerencia no reemplaza una indicación clínica.`
      ].join('\n');
    });

    if (!bloques.length && (similares || []).length) {
      const sims = similares.slice(0, 3).map(s =>
        `• ${s.nombre}${s.presentacion ? ` (${s.presentacion})` : ''}${s.marca ? ` – ${s.marca}` : ''}`
      ).join('\n');
      bloques.push(`No encontré ese producto en el catálogo de KrönenVet. ¿Podés darme nombre comercial o marca?\n${sims}\n\nDecime el nombre para ver detalles.`);
    }

    respuesta = bloques.join('\n\n') || t('error_generico');
  }

  await sendWhatsAppText(from, respuesta);
  await sendMainList(from, nombre);
}

/* ========== CONTROLLER PRINCIPAL ========== */
export async function handleWhatsAppMessage(req, res) {
  try {
    // Responder rápido a Meta
    res.sendStatus(200);

    const messages = extractIncomingMessages(req.body);
    if (!messages.length) return;

    for (const { from, text } of messages) {
      const session = await getOrCreateSession(from);
      await ensureExpiry(session);

      console.log('[WH] from=%s state=%s text="%s"', from, session.state, (text || '').slice(0, 120));

      /* ====== Gating por CUIT ====== */
      if (session.state !== 'verified' || isExpired(session) || !session.cuit) {
        const digits = (text || '').replace(/\D/g, '');
        if (/^\d{11}$/.test(digits)) {
          await upsertVerified(from, digits);
          const vet = await getVetByCuit(digits);
          const nombre = firstName(vet?.nombre) || '';
          const ttl = Number(process.env.CUIT_VERIFY_TTL_DAYS || process.env.WHATSAPP_SESSION_TTL_DAYS || 60);
          await sendWhatsAppText(from, t('ok_cuit', { nombre, ttl }));
          await sendMainList(from, nombre);
          continue;
        }
        // Mensaje CUIT fijo
        await sendWhatsAppText(from, CUIT_PROMPT);
        continue;
      }

      /* ====== Perfil ====== */
      const vet = await getVetByCuit(session.cuit);
      const nombre = firstName(vet?.nombre) || '';

      /* ====== Estados de captura/confirmación ====== */
      const state = await getState(from);
      const pending = await getPending(from);

      // --- Captura de NUEVO NOMBRE
      if (state === 'awaiting_nombre_value') {
        const nuevo = String(text || '').trim().slice(0, 120);
        if (!nuevo) { await sendWhatsAppText(from, t('editar_pedir_nombre')); continue; }
        await setPending(from, { action: 'edit_nombre', value: nuevo });
        await setState(from, 'confirm');
        await sendConfirmList(from, t('editar_confirmar_nombre', { valor: nuevo }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
        continue;
      }

      // --- Captura de NUEVO EMAIL
      if (state === 'awaiting_email_value') {
        const email = String(text || '').trim();
        if (!isValidEmail(email)) { await sendWhatsAppText(from, t('editar_email_invalido')); continue; }
        await setPending(from, { action: 'edit_email', value: email });
        await setState(from, 'confirm');
        await sendConfirmList(from, t('editar_confirmar_email', { valor: email }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
        continue;
      }

      // --- Captura de consulta (cuando el usuario eligió "Buscar productos")
      if (state === 'awaiting_consulta') {
        await setState(from, 'verified');
        await handleConsulta(from, nombre, text);
        continue;
      }

      // --- Confirmaciones (usando lista)
      if (state === 'confirm') {
        const raw = (text || '').toLowerCase();
        const intentC = detectarIntent(text);

        const isNo  = intentC === 'confirm_no' || raw === 'confirm.no';
        const isYes = intentC === 'confirm_si' || raw === 'confirm.si';

        if (isNo) {
          await clearPending(from);
          await setState(from, 'verified');
          await sendWhatsAppText(from, t('cancelado'));
          await sendMainList(from, nombre);
          continue;
        }

        if (isYes) {
          if (!pending) { await setState(from, 'verified'); await sendMainList(from, nombre); continue; }
          const { action, value } = pending;

          if (action === 'edit_nombre') {
            await updateVetName(vet.id, value);
            await clearPending(from);
            await setState(from, 'verified');
            const nombreNuevo = firstName(value) || nombre;
            await sendWhatsAppText(from, t('editar_ok_nombre', { nombre: nombreNuevo }));
            await sendMainList(from, nombreNuevo);
            continue;
          }
          if (action === 'edit_email') {
            await updateVetEmail(vet.id, value);
            await clearPending(from);
            await setState(from, 'verified');
            await sendWhatsAppText(from, t('editar_ok_email', { nombre, email: value }));
            await sendMainList(from, nombre);
            continue;
          }
          if (action === 'logout') {
            await clearPending(from);
            await logout(from);
            // Despedimos y NO pedimos CUIT acá; recién en el siguiente mensaje
            await sendWhatsAppText(from, t('logout_ok'));
            continue;
          }

          // Acción desconocida → cancelamos
          await clearPending(from);
          await setState(from, 'verified');
          await sendWhatsAppText(from, t('cancelado'));
          await sendMainList(from, nombre);
          continue;
        }

        // Si escribe otra cosa, re-mostramos la confirmación
        if (pending?.action === 'edit_nombre') {
          await sendConfirmList(from, t('editar_confirmar_nombre', { valor: pending.value }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
        } else if (pending?.action === 'edit_email') {
          await sendConfirmList(from, t('editar_confirmar_email', { valor: pending.value }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
        } else if (pending?.action === 'logout') {
          await sendConfirmList(from, t('logout_confirm'), 'confirm.si', 'confirm.no', 'Salir');
        } else {
          await clearPending(from);
          await setState(from, 'verified');
          await sendMainList(from, nombre);
        }
        continue;
      }

      /* ====== Intents / Acciones de la lista ====== */
      const intent = detectarIntent(text) || '';

      // Soportar toques de la lista principal:
      if (text === 'main.buscar' || intent === 'buscar') {
        await setState(from, 'awaiting_consulta');
        await sendWhatsAppText(from, t('pedir_consulta'));
        continue;
      }

      if (text === 'main.promos' || intent === 'promos' || /promo/i.test(text || '')) {
        const promos = await Promocion.findAll({
          where: { vigente: true },
          order: [['vigencia_hasta','ASC'], ['nombre','ASC']],
          limit: 10
        });
        if (!promos.length) {
          await sendWhatsAppText(from, 'Disculpá, en este momento no tenemos ninguna promoción activa.');
          await sendMainList(from, nombre);
          continue;
        }
        await sendWhatsAppList(from, 'Promos vigentes:', [{
          title: 'Promociones',
          rows: promos.map(p => ({
            id: `promo:${p.id}`,
            title: (p.nombre || '').slice(0,24),
            description: [p.tipo, p.presentacion].filter(Boolean).join(' • ').slice(0,60)
          }))
        }], 'KaIA – Promos', 'Ver');
        continue;
      }

      // Abrir promo específica (list reply)
      if ((text || '').startsWith('promo:')) {
        const pid = Number(String(text).split(':')[1]);
        const p = await Promocion.findByPk(pid);
        if (!p) { await sendWhatsAppText(from, 'No pude abrir esa promoción.'); continue; }
        const body = [
          `🎁 ${p.nombre}`,
          p.tipo ? `Tipo: ${p.tipo}` : null,
          p.detalle ? p.detalle : null,
          p.regalo ? `Regalo: ${p.regalo}` : null,
          `Vigencia: ${p.vigencia_desde ? new Date(p.vigencia_desde).toLocaleDateString() : '—'} a ${p.vigencia_hasta ? new Date(p.vigencia_hasta).toLocaleDateString() : '—'}`
        ].filter(Boolean).join('\n');
        await sendWhatsAppText(from, body);
        await sendMainList(from, nombre);
        continue;
      }

      if (text === 'main.editar' || intent === 'editar') {
        await sendWhatsAppList(from, t('editar_intro'), [{
          title: 'Mis datos',
          rows: [
            { id: 'edit.nombre', title: '🏷 Nombre', description: 'Razón social / Fantasía' },
            { id: 'edit.email' , title: '📧 Email' , description: 'Correo de contacto' }
          ]
        }], 'Editar datos', 'Elegí');
        continue;
      }

      if (text === 'edit.nombre' || intent === 'editar_nombre') {
        await setState(from, 'awaiting_nombre_value');
        await sendWhatsAppText(from, t('editar_pedir_nombre'));
        continue;
      }

      if (text === 'edit.email' || intent === 'editar_email') {
        await setState(from, 'awaiting_email_value');
        await sendWhatsAppText(from, t('editar_pedir_email'));
        continue;
      }

      if (text === 'main.logout' || intent === 'logout') {
        await setPending(from, { action: 'logout' });
        await setState(from, 'confirm');
        await sendConfirmList(from, t('logout_confirm'), 'confirm.si', 'confirm.no', 'Salir');
        continue;
      }

      // (Opcional) Ejecutivo: no lo mostramos en el menú, pero si el usuario lo pide, respondemos
      if (intent === 'humano') {
        const ej = vet?.EjecutivoCuenta;
        if (ej) {
          await sendWhatsAppContacts(from, [{
            formatted_name: ej.nombre,
            first_name: ej.nombre?.split(' ')[0],
            last_name: ej.nombre?.split(' ').slice(1).join(' ') || undefined,
            org: 'KrönenVet',
            phones: ej.phone ? [{ phone: ej.phone, type: 'WORK' }] : [],
            emails: ej.email ? [{ email: ej.email, type: 'WORK' }] : []
          }]);
          await sendWhatsAppText(
            from,
            t('ejecutivo_contacto_enviado', { ejecutivo: ej.nombre, telefono: ej.phone || '' })
          );
        } else {
          await sendWhatsAppText(from, t('ejecutivo_sin_asignar'));
        }
        await sendMainList(from, nombre);
        continue;
      }

      // ====== Feedback (anti-loop: marcamos respuesta)
      if (intent === 'feedback_ok') {
        await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
        await sendWhatsAppText(from, '¡Genial! Gracias por contarnos. 🙌');
        await sendMainList(from, nombre);
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
          // Guardado opcional en tu modelo Feedback
          // await Feedback.create({ flow_id: 'feedback_inactividad', satisfecho: 'meh', comentario, phone: from });
        } catch (e) {
          console.error('Error guardando feedback:', e);
        }
        await setState(from, 'verified');
        await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
        await sendWhatsAppText(from, '¡Gracias! Registré tu comentario. 💬');
        await sendMainList(from, nombre);
        continue;
      }

      // ====== Saludos/ayuda/gracias → SOLO LISTA (sin menú textual)
      if (['saludo', 'menu', 'ayuda', 'gracias'].includes(intent)) {
        await sendMainList(from, nombre);
        continue;
      }

      // ====== Despedida (sólo texto, sin lista)
      if (intent === 'despedida') {
        await sendWhatsAppText(from, t('despedida', { nombre }));
        continue;
      }

      // ====== Fallback: interpretamos como consulta libre
      await handleConsulta(from, nombre, text);
    }
  } catch (err) {
    console.error('❌ Error en webhook WhatsApp:', err);
  }
}
