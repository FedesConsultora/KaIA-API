// src/controllers/webhookController.js
// ----------------------------------------------------
import 'dotenv/config';
import {
  sendWhatsAppText,
  sendWhatsAppContacts,
  sendWhatsAppList,
  sendWhatsAppButtons
} from '../services/whatsappService.js';

import { recomendarDesdeBBDD, fetchProductsByIds } from '../services/recommendationService.js';
import { responderConGPTStrict, extraerTerminosBusqueda } from '../services/gptService.js';
import {
  getOrCreateSession, isExpired, upsertVerified, setState, getState,
  ensureExpiry, setPending, getPending, clearPending, logout, bumpExpiry,
  shouldResetToMenu, resetToMenu,
  getReco, setReco, incRecoFail, resetRecoFail,
  shouldPromptFeedback, markFeedbackPrompted
} from '../services/waSessionService.js';
import { detectarIntent } from '../services/intentService.js';
import {
  getVetByCuit, firstName, isValidEmail, updateVetEmail, updateVetName, isValidCuitNumber
} from '../services/userService.js';
import { WhatsAppSession, Promocion } from '../models/index.js';
import { t } from '../config/texts.js';

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'dev-token';
const MAX_FAILS = Number(process.env.SEARCH_MAX_FAILS || 5);

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

/* ===== Recomendación con contexto + desambiguación ===== */
async function handleConsulta(from, nombre, consultaRaw) {
  const consulta = (consultaRaw || '').trim();
  if (!consulta) {
    await sendWhatsAppText(from, t('pedir_consulta'));
    return;
  }

  // 1) Extraer señales nuevas y mergear con contexto previo (null-safe)
  const gptNew = await extraerTerminosBusqueda(consulta);
  const recoCtx = (await getReco(from)) || {};
  const mergedTokens = {
    must:   Array.from(new Set([...(recoCtx?.tokens?.must || []), ...(gptNew?.must || [])])),
    should: Array.from(new Set([...(recoCtx?.tokens?.should || []), ...(gptNew?.should || [])])),
    negate: Array.from(new Set([...(recoCtx?.tokens?.negate || []), ...(gptNew?.negate || [])]))
  };

  console.log(`[RECO] consulta="${consulta}" gpt=${JSON.stringify(mergedTokens)}`);

  // 2) Buscar
  const { validos = [], similares = [] } = await recomendarDesdeBBDD(consulta, { gpt: mergedTokens });

  // 3) Sin resultados → desambiguar y escalar a los 5 fails
  if (!validos.length) {
    const after = await incRecoFail(from);

    if (after?.failCount === 3) {
      await setReco(from, { tokens: mergedTokens, lastQuery: consulta });
      await sendWhatsAppText(from, t('no_match'));
      await sendWhatsAppButtons(from, t('reco_pedir_especie'), [
        { id: 'perro', title: t('btn_perro') },
        { id: 'gato',  title: t('btn_gato') },
        { id: 'volver', title: t('btn_volver') }
      ]);
      return;
    }

    if ((after?.failCount || 0) >= MAX_FAILS) {
      const s = await getOrCreateSession(from);
      const vet = s?.cuit ? await getVetByCuit(s.cuit) : null;
      const ej = vet?.EjecutivoCuenta;
      await setReco(from, { tokens: mergedTokens, lastQuery: consulta });

      if (ej) {
        await sendWhatsAppContacts(from, [{
          formatted_name: ej.nombre,
          first_name: ej.nombre?.split(' ')[0],
          last_name: ej.nombre?.split(' ').slice(1).join(' ') || undefined,
          org: 'KrönenVet',
          phones: ej.phone ? [{ phone: ej.phone, type: 'WORK' }] : [],
          emails: ej.email ? [{ email: ej.email, type: 'WORK' }] : []
        }]);
        await sendWhatsAppText(from, t('escala_ejecutivo', { ejecutivo: ej.nombre }));
      } else {
        await sendWhatsAppText(from, t('ejecutivo_sin_asignar'));
      }
      return;
    }

    await setReco(from, { tokens: mergedTokens, lastQuery: consulta });
    await sendWhatsAppText(from, t('no_match'));
    await sendWhatsAppText(from, t('refinar_tip'));
    return;
  }

  // 4) Con resultados → reset fails, guardar contexto y responder
  await resetRecoFail(from);
  await setReco(from, {
    tokens: mergedTokens,
    lastQuery: consulta,
    lastShownIds: validos.map(v => v.id),
    lastSimilares: similares.map(s => s.id)
  });

  let respuesta;
  try {
    respuesta = await responderConGPTStrict(consulta, { productosValidos: validos, similares });
  } catch {
    const bloques = validos.map(p => {
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
    respuesta = bloques.join('\n\n') || t('error_generico');
  }

  await sendWhatsAppText(from, respuesta);

  // CTA breve para seguir hilando
  await sendWhatsAppButtons(from, t('cta_como_seguimos'), [
    { id: 'ver_mas', title: t('btn_ver_mas') },
    { id: 'humano',  title: t('btn_humano') },
    { id: 'menu',    title: t('btn_menu') }
  ]);
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

      // Feedback ping si regresa tras inactividad
      if (shouldPromptFeedback(session)) {
        await sendWhatsAppButtons(from, t('fb_ping'), [
          { id: 'fb_ok',  title: '👍 Sí' },
          { id: 'fb_meh', title: '👎 No' },
          { id: 'fb_txt', title: '💬 Dejar comentario' }
        ]);
        await markFeedbackPrompted(from);
      }

      console.log(`[RX] from=${from} state=${session.state} cuit=${session.cuit || '-'} text="${(text || '').slice(0, 160)}"`);

      // ===== Gating por CUIT + expiración
      const loggedIn = !!(session.cuit && !isExpired(session));
      if (!loggedIn) {
        const digits = (text || '').replace(/\D/g, '');
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

      // 🕒 Inactividad: volver a menú (no desloguea)
      if (shouldResetToMenu(session)) {
        await resetToMenu(from);
        const vet = await getVetByCuit(session.cuit);
        await sendWhatsAppText(from, t('menu_back_idle'));
        await sendMainList(from, firstName(vet?.nombre) || '');
        continue;
      }

      await bumpExpiry(from);

      const vet = await getVetByCuit(session.cuit);
      const nombre = firstName(vet?.nombre) || '';

      const state = await getState(from);
      const pending = await getPending(from);

      // --- Captura de NUEVO NOMBRE
      if (state === 'awaiting_nombre_value') {
        const nuevo = String(text || '').trim().slice(0, 120);
        if (!nuevo) { await sendWhatsAppText(from, t('editar_pedir_nombre')); continue; }
        await setPending(from, { action: 'edit_nombre', value: nuevo, prev: { state } });
        await setState(from, 'confirm');
        console.log(`[FLOW] edit_nombre -> confirm "${nuevo}"`);
        await sendConfirmList(from, t('editar_confirmar_nombre', { valor: nuevo }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
        continue;
      }

      // --- Captura de NUEVO EMAIL
      if (state === 'awaiting_email_value') {
        const email = String(text || '').trim();
        if (!isValidEmail(email)) { await sendWhatsAppText(from, t('editar_email_invalido')); continue; }
        await setPending(from, { action: 'edit_email', value: email, prev: { state } });
        await setState(from, 'confirm');
        console.log(`[FLOW] edit_email -> confirm "${email}"`);
        await sendConfirmList(from, t('editar_confirmar_email', { valor: email }), 'confirm.si', 'confirm.no', 'Confirmar cambio');
        continue;
      }

      // --- Modo búsqueda continuo / refinadores
      if (state === 'awaiting_consulta') {
        const intent = detectarIntent(text) || '';

        // especie via botones
        if (intent === 'species_perro' || intent === 'species_gato') {
          const especie = intent === 'species_perro' ? 'perro' : 'gato';
          await setReco(from, { tokens: { should: [especie] } });
          const r = await getReco(from);
          // si hay última consulta, reintentar con ese contexto
          if (r?.lastQuery) {
            await handleConsulta(from, nombre, r.lastQuery);
          } else {
            await sendWhatsAppText(from, t('pedir_consulta'));
          }
          continue;
        }

        // ver más
        if (intent === 'ver_mas') {
          const r = await getReco(from);
          if (!r?.lastSimilares?.length) {
            await sendWhatsAppText(from, t('reco_no_mas_similares'));
          } else {
            const prods = await fetchProductsByIds(r.lastSimilares.slice(0, 6));
            if (!prods.length) {
              await sendWhatsAppText(from, t('reco_no_mas_similares'));
            } else {
              const bullets = prods.map(p => `• ${p.nombre}${p.marca ? ` — ${p.marca}` : ''}`).join('\n');
              await sendWhatsAppText(from, `${t('reco_similares_intro')}\n${bullets}`);
            }
          }
          continue;
        }

        if (intent === 'volver') {
          await sendMainList(from, nombre);
          continue;
        }

        console.log(`[FLOW] consulta="${(text||'').slice(0,80)}"`);
        await handleConsulta(from, nombre, text);
        continue;
      }

      // --- Confirmaciones (sí/no/volver)
      if (state === 'confirm') {
        const raw = (text || '').toLowerCase();
        const intentC = detectarIntent(text);
        const isNo   = intentC === 'confirm_no' || raw === 'confirm.no';
        const isYes  = intentC === 'confirm_si' || raw === 'confirm.si';
        const isBack = intentC === 'volver';

        const goBack = async () => {
          if (!pending?.prev?.state) {
            await clearPending(from);
            await setState(from, 'awaiting_consulta');
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

      /* ====== Intents / Acciones ====== */
      const intent = detectarIntent(text) || '';

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

      if ((text || '').startsWith('promo:')) {
        const pid = Number(String(text).split(':')[1]);
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

      if (text === 'main.editar' || intent === 'editar') {
        await sendWhatsAppList(from, t('editar_intro'), [{
          title: 'Mis datos',
          rows: [
            { id: 'edit.nombre', title: '🏷 Nombre', description: 'Razón social / Fantasía' },
            { id: 'edit.email' , title: '📧 Email' , description: 'Correo de contacto' }
          ]
        }], 'Editar datos', t('btn_elegi'));
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
          await sendWhatsAppText(from, t('ejecutivo_sin_asignar'));
        }
        continue;
      }

      // Feedback
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
      if (state === 'awaiting_feedback_text') {
        const comentario = (text || '').trim().slice(0, 3000);
        if (!comentario) { await sendWhatsAppText(from, t('fb_txt_empty')); continue; }
        await setState(from, 'awaiting_consulta');
        await WhatsAppSession.update({ feedbackLastResponseAt: new Date() }, { where: { phone: from } });
        await sendWhatsAppText(from, t('fb_txt_ok'));
        await sendWhatsAppText(from, t('refinar_follow'));
        continue;
      }

      if (['saludo', 'menu', 'ayuda', 'gracias'].includes(intent)) {
        await sendMainList(from, nombre);
        continue;
      }

      if (intent === 'despedida') {
        await sendWhatsAppText(from, t('despedida', { nombre }));
        continue;
      }

      // Fallback: seguimos en búsqueda
      await setState(from, 'awaiting_consulta');
      await handleConsulta(from, nombre, text);
    }
  } catch (err) {
    console.error('❌ Error en webhook WhatsApp:', err);
  }
}