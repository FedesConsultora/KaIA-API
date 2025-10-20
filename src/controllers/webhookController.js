// src/controllers/webhookController.js
import 'dotenv/config';
import { sendWhatsAppText } from '../services/whatsappService.js';
import { recomendarDesdeBBDD } from '../services/recommendationService.js';
import { responderConGPTStrict } from '../services/gptService.js';
import { getOrCreateSession, isExpired, upsertVerified, validateCuitExists } from '../services/waSessionService.js';

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'dev-token';
const ASK_CUIT_MSG = 'Para continuar, decime tu CUIT (11 dígitos, sin guiones).';
const BAD_CUIT_MSG = 'No encuentro ese CUIT en la base de clientes. ¿Podés revisarlo o contactarte con tu ejecutivo?';
const THANKS_MSG   = '¡Gracias! Verifiqué tu CUIT. ¿Qué producto necesitás?';

export function handleWhatsAppVerify(req, res) {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token && token === VERIFY_TOKEN) {
    return res.status(200).type('text/plain').send(String(challenge));
  }
  return res.sendStatus(403);
}

// ÚNICA versión: extrae {from, text}
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
          if (m.type !== 'text') continue;
          out.push({
            from: m.from,
            text: m.text?.body?.trim() || ''
          });
        }
      }
    }
  } catch (_) {}
  return out;
}

export async function handleWhatsAppMessage(req, res) {
  try {
    // Respondemos rápido al webhook
    res.sendStatus(200);

    const messages = extractIncomingMessages(req.body);
    if (!messages.length) return;

    for (const { from, text } of messages) {
      const s = await getOrCreateSession(from);

      // Gating CUIT
      if (s.state !== 'verified' || isExpired(s) || !s.cuit) {
        const digits = (text || '').replace(/\D/g, '');
        if (/^\d{11}$/.test(digits)) {
          const user = await validateCuitExists(digits);
          if (!user) {
            await sendWhatsAppText(from, BAD_CUIT_MSG);
            continue;
          }
          await upsertVerified(from, digits);
          await sendWhatsAppText(from, THANKS_MSG);
          continue;
        }
        await sendWhatsAppText(from, ASK_CUIT_MSG);
        continue;
      }

      // Recomendación: SIEMPRE GPT con guardrails
      const consulta = (text || '').trim();
      if (!consulta) continue;

      const { top, similares } = await recomendarDesdeBBDD(consulta);
      const productosValidos = top ? [top] : []; // máx. 1 válido

      const respuesta = await responderConGPTStrict(consulta, {
        productosValidos,
        similares
      });

      await sendWhatsAppText(from, respuesta);
    }
  } catch (err) {
    console.error('❌ Error en webhook WhatsApp:', err);
  }
}
