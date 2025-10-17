// src/controllers/webhookController.js
import 'dotenv/config';
import { sendWhatsAppText } from '../services/whatsappService.js';
import { buildCatalogContext } from '../services/catalogContext.js';
import { responderConGPT } from '../services/gptService.js';

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'dev-token';
const FALLBACK_MSG = 'No encontré ese producto en el catálogo de KronenVet. ¿Podés darme nombre comercial, marca o principio activo?';

export function handleWhatsAppVerify(req, res) {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  console.log('VERIFY HIT', { ip: req.ip, mode, token_len: token?.length });
  
  if (mode === 'subscribe' && token && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado por Meta.');
    return res.status(200).type('text/plain').send(String(challenge));
  }
  console.warn('❌ Verificación de webhook fallida. Token no coincide.');
  return res.sendStatus(403);
}

// Extrae mensajes de la estructura del Webhook de WhatsApp Cloud API
function extractIncomingMessages(body) {
  const out = [];
  const entry = body?.entry || [];
  entry.forEach(e => {
    (e.changes || []).forEach(ch => {
      const value = ch.value || {};
      const messages = value.messages || [];
      const contacts = value.contacts || [];

      messages.forEach((m, idx) => {
        if (m.type !== 'text') return;
        const from = m.from; // número internacional sin +
        const text = m.text?.body || '';
        const profileName = contacts?.[idx]?.profile?.name || null;

        out.push({ from, text, profileName });
      });
    });
  });
  return out;
}

export async function handleWhatsAppMessage(req, res) {
  try {
    // WhatsApp exige 200 rápido; procesamos en background "light"
    res.sendStatus(200);

    const messages = extractIncomingMessages(req.body);
    if (!messages.length) return;

    for (const msg of messages) {
      const pregunta = (msg.text || '').trim();
      if (!pregunta) continue;

      // 1) Buscamos productos que macheen SÍ o SÍ
      const contexto = await buildCatalogContext(pregunta, 5);

      // 2) Si no hay match en catálogo → respondemos sin llamar a GPT
      if (!contexto) {
        await sendWhatsAppText(msg.from, FALLBACK_MSG);
        continue;
      }

      // 3) Llamamos a GPT con contexto para armar la recomendación
      const respuesta = await responderConGPT(pregunta, contexto);
      await sendWhatsAppText(msg.from, respuesta);
    }
  } catch (err) {
    console.error('❌ Error en webhook WhatsApp:', err);
  }
}
