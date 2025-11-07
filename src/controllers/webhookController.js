// src/controllers/webhookController.js
import 'dotenv/config';
import {
  sendWhatsAppText,
  sendWhatsAppContacts,
  sendWhatsAppList,
  sendWhatsAppButtons
} from '../services/whatsappService.js';

import { recomendarDesdeBBDD } from '../services/recommendationService.js';
import { responderConGPTStrict, extraerTerminosBusqueda } from '../services/gptService.js';
import {
  getOrCreateSession, isExpired, upsertVerified, setState, getState,
  ensureExpiry, setPending, getPending, clearPending, logout, bumpExpiry,
  shouldResetToMenu, resetToMenu,
  getReco, setReco, incRecoFail, resetRecoFail,
  shouldPromptFeedback, markFeedbackPrompted,
  bumpLastInteraction
} from '../services/waSessionService.js';
import { detectarIntent, isLikelyGreeting, sanitizeText } from '../services/intentService.js';
import {
  getVetByCuit, firstName, isValidEmail, updateVetEmail, updateVetName, isValidCuitNumber
} from '../services/userService.js';
import { WhatsAppSession, Promocion } from '../models/index.js';
import { t } from '../config/texts.js';

// 🆕 Lista/Detalle de productos + desambiguación
import {
  sendProductsList,
  openProductDetail,
  handleDisambigAnswer,
  runDisambiguationOrRecommend
} from '../services/disambiguationService.js';

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'dev-token';
const MAX_FAILS = Number(process.env.SEARCH_MAX_FAILS || 5);
const DEBUG = process.env.DEBUG_RECO === '1';

// 🆕 Tel. Administrativo (wa.me requiere solo dígitos)
const ADMIN_PHONE_DIGITS = '5492216374218';

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
            if (it.type === 'list_reply' && it.list_reply?.id) out.push({ from, text: String(it.list_reply.id).trim() });
            if (it.type === 'button_reply' && it.button_reply?.id) out.push({ from, text: String(it.button_reply.id).trim() });
          }
        }
      }
    }
  } catch {}
  return out;
}

/* ========== LISTAS (sin botones) ========== */
async function sendMainList(from, nombre = '') {
  const body = t('menu_main_body');
  const sections = [{
    title: t('menu_main_title'),
    rows: [
      { id: 'main.buscar',  title: t('menu_item_buscar_title'), description: t('menu_item_buscar_desc') },
      { id: 'main.promos',  title: t('menu_item_promos_title'), description: t('menu_item_promos_desc') },
      { id: 'main.editar',  title: t('menu_item_editar_title'), description: t('menu_item_editar_desc') },
      { id: 'main.logout',  title: t('menu_item_logout_title'), description: t('menu_item_logout_desc') }
    ]
  }];
  const header = nombre ? t('saludo_header', { nombre }) : t('menu_main_title');
  await sendWhatsAppList(from, body, sections, header, t('btn_elegi'));
}

async function sendConfirmList(from, body, yesId = 'confirm.si', noId = 'confirm.no', header = 'Confirmar') {
  const sections = [{
    title: 'Confirmación',
    rows: [
      { id: yesId, title: t('btn_confirmar') },
      { id: noId , title: t('btn_cancelar') }
    ]
  }];
  await sendWhatsAppList(from, body, sections, header, t('btn_elegi'));
}

/* ===== Helpers ===== */
async function resetRecoContext(phone) {
  await resetRecoFail(phone);
  await setReco(phone, {
    tokens: { must: [], should: [], negate: [] },
    lastQuery: '',
    lastSimilares: [],
    lastShownIds: []
  });
}

/* ===== Recomendación con contexto (lista primero) ===== */
async function handleConsulta(from, nombre, consultaRaw) {
  const consulta = sanitizeText(consultaRaw || '');

  if (!consulta || isLikelyGreeting(consulta) || /^main\./i.test(consulta) || /^buscar$/i.test(consulta) || /^menu$/i.test(consulta)) {
    console.log(`[RECO][SKIP] query="${consulta}"`);
    await sendWhatsAppText(from, t('pedir_consulta'));
    return;
  }

  const prev = await getReco(from);
  const gptNew = await extraerTerminosBusqueda(consulta);
  const mergedTokens = {
    must:   Array.from(new Set([...(prev?.tokens?.must || []), ...(gptNew?.must || [])])),
    should: Array.from(new Set([...(prev?.tokens?.should || []), ...(gptNew?.should || [])])),
    negate: Array.from(new Set([...(prev?.tokens?.negate || []), ...(gptNew?.negate || [])]))
  };

  if (DEBUG) {
    console.log(`[RECO] consulta="${consulta}" prevTokens=${JSON.stringify(prev?.tokens||{})} new=${JSON.stringify(gptNew)} merged=${JSON.stringify(mergedTokens)}`);
  } else {
    console.log(`[RECO] consulta="${consulta}" gpt=${JSON.stringify(mergedTokens)}`);
  }

  // 🚀 Derivamos al motor nuevo (desambiguación iterativa)
  await setState(from, 'awaiting_consulta');
  await setReco(from, { tokens: mergedTokens, lastQuery: consulta });
  await runDisambiguationOrRecommend({ from, nombre, consulta });
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
      await bumpLastInteraction(from);

      if (shouldPromptFeedback(session)) {
        await sendWhatsAppButtons(from, t('fb_ping'), [
          { id: 'fb_ok',  title: '👍 Sí' },
          { id: 'fb_meh', title: '👎 No' },
          { id: 'fb_txt', title: '💬 Dejar comentario' }
        ]);
        await markFeedbackPrompted(from);
      }

      const normText = sanitizeText(text || '');
      console.log(`[RX] from=${from} state=${session.state} cuit=${session.cuit || '-'} text="${normText.slice(0, 160)}"`);

      // 🆕 Capturar respuestas de desambiguación (ids "disambig:*")
      if ((normText || '').startsWith('disambig:')) {
        const ok = await handleDisambigAnswer(from, normText);
        if (ok) continue;
      }

      // ===== Gating por CUIT + expiración
      const loggedIn = !!(session.cuit && !isExpired(session));
      if (!loggedIn) {
        const digits = (normText || '').replace(/\D/g, '');
        if (/^\d{11}$/.test(digits)) {
          if (!isValidCuitNumber(digits)) {
            console.log(`[AUTH] gating=cuenta invalida (checksum) cuit=${digits}`);
            await sendWhatsAppText(from, t('bad_cuit'));
            continue;
          }
          const vet = await getVetByCuit(digits);
          if (!vet) {
            console.log(`[AUTH] gating=cuenta inexistente cuit=${digits}`);
            await sendWhatsAppText(from, t('bad_cuit'));
            continue;
          }
          await upsertVerified(from, digits);
          const nombre = firstName(vet?.nombre) || '';
          const ttl = Number(process.env.CUIT_VERIFY_TTL_DAYS || process.env.WHATSAPP_SESSION_TTL_DAYS || 60);
          console.log(`[AUTH] login ok cuit=${digits} nombre=${nombre}`);
          await sendWhatsAppText(from, t('ok_cuit', { nombre, ttl }));
          await setState(from, 'awaiting_consulta');
          await sendWhatsAppText(from, t('pedir_consulta'));
          continue;
        }
        console.log(`[AUTH] gating=pedir_cuit reason=${!session.cuit ? 'no_cuit' : 'expired'}`);
        await sendWhatsAppText(from, t('ask_cuit'));
        continue;
      }

      // 🕒 Inactividad: volver a menú
      if (shouldResetToMenu(session)) {
        await resetToMenu(from);
        const vet = await getVetByCuit(session.cuit);
        if (DEBUG) console.log('[MENU] reset due to idle');
        await sendWhatsAppText(from, t('menu_back_idle'));
        await sendMainList(from, firstName(vet?.nombre) || '');
        continue;
      }

      await bumpExpiry(from);

      const vet = await getVetByCuit(session.cuit);
      const nombre = firstName(vet?.nombre) || '';

      // 🆕 Apertura de ficha por selección "prod:<id>"
      if ((normText || '').startsWith('prod:')) {
        const pid = Number(String(normText).split(':')[1]);
        const ok = await openProductDetail(from, pid);
        if (ok) {
          const ej = vet?.EjecutivoCuenta;
          if (ej && (ej.phone || ej.email)) {
            await sendWhatsAppContacts(from, [{
              formatted_name: ej.nombre,
              first_name: ej.nombre?.split(' ')[0],
              last_name: ej.nombre?.split(' ').slice(1).join(' ') || undefined,
              org: 'KrönenVet',
              phones: ej.phone ? [{ phone: ej.phone, type: 'WORK' }] : [],
              emails: ej.email ? [{ email: ej.email, type: 'WORK' }] : []
            }]);
            await sendWhatsAppText(from, t('handoff_ejecutivo', { ejecutivo: ej.nombre, telefono: ej.phone || '' }));
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

          await sendWhatsAppButtons(from, t('cta_como_seguimos'), [
            { id: 'humano',  title: t('btn_humano') },
            { id: 'menu',    title: t('btn_menu') }
          ]);
        } else {
          await sendWhatsAppText(from, t('producto_open_error'));
        }
        continue;
      }

      const state = await getState(from);
      const pending = await getPending(from);

      // --- Captura NUEVO NOMBRE
      if (state === 'awaiting_nombre_value') {
        const nuevo = String(normText || '').slice(0, 120);
        if (!nuevo) { await sendWhatsAppText(from, t('editar_pedir_nombre')); continue; }
        await setPending(from, { action: 'edit_nombre', value: nuevo, prev: { state } });
        await setState(from, 'confirm');
        console.log(`[FLOW] edit_nombre -> confirm "${nuevo}"`);
        await sendConfirmList(from, t('editar_confirmar_nombre', { valor: nuevo }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
        continue;
      }

      // --- Captura NUEVO EMAIL
      if (state === 'awaiting_email_value') {
        const email = String(normText || '');
        if (!isValidEmail(email)) { await sendWhatsAppText(from, t('editar_email_invalido')); continue; }
        await setPending(from, { action: 'edit_email', value: email, prev: { state } });
        await setState(from, 'confirm');
        console.log(`[FLOW] edit_email -> confirm "${email}"`);
        await sendConfirmList(from, t('editar_confirmar_email', { valor: email }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
        continue;
      }

      // --- Modo búsqueda
      if (state === 'awaiting_consulta') {
        const intent = detectarIntent(normText) || '';
        if (DEBUG) console.log(`[FLOW] awaiting_consulta intent=${intent}`);

        if (['saludo', 'menu', 'ayuda', 'gracias'].includes(intent) || isLikelyGreeting(normText)) {
          console.log('[GUARD] greeting/menu/ayuda → mostrar menú');
          await resetRecoContext(from);
          await sendMainList(from, nombre);
          continue;
        }
        if (intent === 'buscar') {
          console.log('[GUARD] main.buscar/buscar → pedir consulta');
          await sendWhatsAppText(from, t('pedir_consulta'));
          continue;
        }
        if (intent === 'promos') {
          const promos = await Promocion.findAll({
            where: { vigente: true },
            order: [['vigencia_hasta','ASC'], ['nombre','ASC']],
            limit: 10
          });
          if (!promos.length) {
            await sendWhatsAppText(from, t('promos_empty'));
          } else {
            await sendWhatsAppList(from, t('promos_list_body'), [{
              title: t('promos_list_title'),
              rows: promos.map(p => ({
                id: `promo:${p.id}`,
                title: (p.nombre || '').slice(0,24),
                description: [p.tipo, p.presentacion].filter(Boolean).join(' • ').slice(0,60)
              }))
            }], t('promos_list_header'), t('btn_elegi'));
          }
          continue;
        }
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
        if (intent === 'logout') {
          await setPending(from, { action: 'logout', prev: { state } });
          await setState(from, 'confirm');
          await sendConfirmList(from, t('logout_confirm'), 'confirm.si', 'confirm.no', 'Salir');
          continue;
        }

        if (intent === 'species_perro' || intent === 'species_gato') {
          const especie = intent === 'species_perro' ? 'perro' : 'gato';
          await setReco(from, { tokens: { should: [especie] } });
          const r = await getReco(from);
          if (r?.lastQuery) {
            await handleConsulta(from, nombre, r.lastQuery);
          } else {
            await sendWhatsAppText(from, t('pedir_consulta'));
          }
          continue;
        }

        if (intent === 'volver') {
          await resetRecoContext(from);
          await sendMainList(from, nombre);
          continue;
        }

        console.log(`[FLOW] consulta="${(normText||'').slice(0,80)}"`);
        await handleConsulta(from, nombre, normText);
        continue;
      }

      // --- Confirmaciones
      if (state === 'confirm') {
        const raw = (normText || '').toLowerCase();
        const intentC = detectarIntent(normText);
        const isNo   = intentC === 'confirm_no' || raw === 'confirm.no';
        const isYes  = intentC === 'confirm_si' || raw === 'confirm.si';
        const isBack = intentC === 'volver' || intentC === 'menu';

        const goBack = async () => {
          if (!pending?.prev?.state) {
            await clearPending(from);
            await setState(from, 'awaiting_consulta');
            await resetRecoContext(from);
            await sendMainList(from, nombre);
            return;
          }
          const prevState = pending.prev.state;
          await setState(from, prevState);
          if (prevState === 'awaiting_nombre_value') {
            await sendWhatsAppText(from, t('editar_pedir_nombre'));
          } else if (prevState === 'awaiting_email_value') {
            await sendWhatsAppText(from, t('editar_pedir_email'));
          } else {
            await resetRecoContext(from);
            await sendMainList(from, nombre);
          }
        };

        if (isBack || isNo) {
          console.log('[CONFIRM] volver/cancelar → back');
          await goBack();
          continue;
        }

        if (isYes) {
          if (!pending) {
            await setState(from, 'awaiting_consulta');
            await sendWhatsAppText(from, t('refinar_follow'));
            continue;
          }
          const { action, value } = pending;

          if (action === 'edit_nombre') {
            await updateVetName(vet.id, value);
            await clearPending(from);
            await setState(from, 'awaiting_consulta');
            const nombreNuevo = firstName(value) || nombre;
            console.log('[CONFIRM] edit_nombre OK');
            await sendWhatsAppText(from, t('editar_ok_nombre', { nombre: nombreNuevo }));
            await sendWhatsAppText(from, t('refinar_follow'));
            continue;
          }
          if (action === 'edit_email') {
            await updateVetEmail(vet.id, value);
            await clearPending(from);
            await setState(from, 'awaiting_consulta');
            console.log('[CONFIRM] edit_email OK');
            await sendWhatsAppText(from, t('editar_ok_email', { nombre, email: value }));
            await sendWhatsAppText(from, t('refinar_follow'));
            continue;
          }
          if (action === 'logout') {
            await clearPending(from);
            await logout(from);
            console.log('[AUTH] logout OK');
            await sendWhatsAppText(from, t('logout_ok', { nombre }));
            continue;
          }

          await clearPending(from);
          await setState(from, 'awaiting_consulta');
          console.log('[CONFIRM] acción desconocida → cancelado');
          await sendWhatsAppText(from, t('cancelado'));
          await sendWhatsAppText(from, t('refinar_follow'));
          continue;
        }

        // Re-mostrar confirmación si escribe otra cosa
        if (pending?.action === 'edit_nombre') {
          await sendConfirmList(from, t('editar_confirmar_nombre', { valor: pending.value }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
        } else if (pending?.action === 'edit_email') {
          await sendConfirmList(from, t('editar_confirmar_email', { valor: pending.value }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
        } else if (pending?.action === 'logout') {
          await sendConfirmList(from, t('logout_confirm'), 'confirm.si', 'confirm.no', 'Salir');
        } else {
          await clearPending(from);
          await setState(from, 'awaiting_consulta');
          await sendWhatsAppText(from, t('refinar_follow'));
        }
        continue;
      }

      /* ====== Intents fuera de awaiting_consulta ====== */
      const intent = detectarIntent(normText) || '';

      if (intent === 'buscar') {
        await setState(from, 'awaiting_consulta');
        await sendWhatsAppText(from, t('pedir_consulta'));
        continue;
      }

      if (intent === 'promos' || /promo/i.test(normText || '')) {
        const promos = await Promocion.findAll({
          where: { vigente: true },
          order: [['vigencia_hasta','ASC'], ['nombre','ASC']],
          limit: 10
        });
        if (!promos.length) {
          await sendWhatsAppText(from, t('promos_empty'));
          continue;
        }
        await sendWhatsAppList(from, t('promos_list_body'), [{
          title: t('promos_list_title'),
          rows: promos.map(p => ({
            id: `promo:${p.id}`,
            title: (p.nombre || '').slice(0,24),
            description: [p.tipo, p.presentacion].filter(Boolean).join(' • ').slice(0,60)
          }))
        }], t('promos_list_header'), t('btn_elegi'));
        continue;
      }

      if ((normText || '').startsWith('promo:')) {
        const pid = Number(String(normText).split(':')[1]);
        const p = await Promocion.findByPk(pid);
        if (!p) { await sendWhatsAppText(from, t('promo_open_error')); continue; }
        const body = [
          `🎁 ${p.nombre}`,
          p.tipo ? `Tipo: ${p.tipo}` : null,
          p.detalle ? p.detalle : null,
          p.regalo ? `Regalo: ${p.regalo}` : null,
          `Vigencia: ${p.vigencia_desde ? new Date(p.vigencia_desde).toLocaleDateString() : '—'} a ${p.vigencia_hasta ? new Date(p.vigencia_hasta).toLocaleDateString() : '—'}`
        ].filter(Boolean).join('\n');
        await sendWhatsAppText(from, body);
        continue;
      }

      if (intent === 'editar') {
        await sendWhatsAppList(from, t('editar_intro'), [{
          title: 'Mis datos',
          rows: [
            { id: 'edit.nombre', title: '🏷 Nombre', description: 'Razón social / Fantasía' },
            { id: 'edit.email' , title: '📧 Email' , description: 'Correo de contacto' }
          ]
        }], 'Editar datos', t('btn_elegi'));
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
        await setPending(from, { action: 'logout', prev: { state } });
        await setState(from, 'confirm');
        await sendConfirmList(from, t('logout_confirm'), 'confirm.si', 'confirm.no', 'Salir');
        continue;
      }

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

      if (intent === 'feedback_ok') {
        await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
        await sendWhatsAppText(from, t('fb_ok_resp'));
        continue;
      }
      if (intent === 'feedback_meh' || intent === 'feedback_txt') {
        await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
        await sendWhatsAppText(from, t('fb_meh_ask'));
        await setState(from, 'awaiting_feedback_text');
        continue;
      }
      const stateNow = await getState(from);
      if (stateNow === 'awaiting_feedback_text') {
        const comentario = (normText || '').slice(0, 3000);
        if (!comentario) { await sendWhatsAppText(from, t('fb_txt_empty')); continue; }
        await setState(from, 'awaiting_consulta');
        await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
        await sendWhatsAppText(from, t('fb_txt_ok'));
        await sendWhatsAppText(from, t('refinar_follow'));
        continue;
      }

      if (['saludo', 'menu', 'ayuda', 'gracias'].includes(intent)) {
        await resetRecoContext(from);
        await sendMainList(from, nombre);
        continue;
      }

      if (intent === 'despedida') {
        await sendWhatsAppText(from, t('despedida', { nombre }));
        continue;
      }

      // Fallback: seguimos en búsqueda
      await setState(from, 'awaiting_consulta');
      await handleConsulta(from, nombre, normText);
    }
  } catch (err) {
    console.error('❌ Error en webhook WhatsApp:', err);
  }
}