// src/services/whatsappService.js
import 'dotenv/config';

const WABA_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v20.0';
const WABA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

if (!WABA_TOKEN) console.warn('⚠️ Falta WHATSAPP_ACCESS_TOKEN');
if (!PHONE_ID) console.warn('⚠️ Falta WHATSAPP_PHONE_NUMBER_ID');

async function wabaFetch(payload) {
  const url = `${WABA_URL}/${PHONE_ID}/messages`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WABA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    console.error('❌ WhatsApp send error', resp.status, txt);
    throw new Error(`WhatsApp send error ${resp.status}`);
  }
  return resp.json();
}

export async function sendWhatsAppText(to, body) {
  return wabaFetch({ messaging_product: 'whatsapp', to, type: 'text', text: { body } });
}

export async function sendWhatsAppButtons(to, body, buttons = []) {
  return wabaFetch({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: { buttons: buttons.map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title } })) },
    },
  });
}

export async function sendWhatsAppContacts(to, contacts = []) {
  return wabaFetch({
    messaging_product: 'whatsapp',
    to,
    type: 'contacts',
    contacts: contacts.map((c) => ({
      name: { formatted_name: c.formatted_name },
      phones: (c.phones || []).map((p) => ({ phone: p.phone, type: p.type || 'CELL' })),
      emails: (c.emails || []).map((e) => ({ email: e.email, type: e.type || 'WORK' })),
    })),
  });
}

// (Opcional) lista/menú si lo querés sumar:
// export async function sendWhatsAppList(to, body, sections) { ... }
