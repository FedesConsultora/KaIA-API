// src/services/whatsappService.js
import 'dotenv/config';

const WABA_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v20.0';
const WABA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

if (!WABA_TOKEN) console.warn('⚠️ Falta WHATSAPP_ACCESS_TOKEN');
if (!PHONE_ID) console.warn('⚠️ Falta WHATSAPP_PHONE_NUMBER_ID');

function buildUrl(path) {
  return `${WABA_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function wabaFetch(payload) {
  const url = buildUrl(`${PHONE_ID}/messages`);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WABA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  try { data = await resp.json(); } catch {}

  if (!resp.ok) {
    const metaErr = data?.error;
    const msg = metaErr?.message || `HTTP ${resp.status}`;
    const details = metaErr?.error_data?.details;
    const code = metaErr?.code;
    const fbtrace = metaErr?.fbtrace_id;

    console.error('❌ WhatsApp send error', {
      status: resp.status,
      code,
      message: msg,
      details,
      fbtrace_id: fbtrace,
      payloadType: payload?.type,
    });

    const e = new Error(`WhatsApp send error ${resp.status} ${code || ''} ${msg}`);
    e.status = resp.status;
    e.code = code;
    e.details = details;
    e.fbtrace_id = fbtrace;
    throw e;
  }

  return data;
}

/* ---------- Helpers ---------- */
export async function sendWhatsAppText(to, body) {
  return wabaFetch({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: String(body).slice(0, 4096) }, // límite de WhatsApp
  });
}

/** Botones 1..3 (si 0 → fallback a texto) */
export async function sendWhatsAppButtons(to, body, buttons = []) {
  const safe = (buttons || [])
    .filter(b => b && b.id && b.title)
    .slice(0, 3)
    .map(b => ({
      type: 'reply',
      reply: { id: String(b.id), title: String(b.title).slice(0, 20) } // título ≤ 20
    }));

  if (safe.length === 0) return sendWhatsAppText(to, body);

  return wabaFetch({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: String(body).slice(0, 1024) },
      action: { buttons: safe },
    },
  });
}

/** Contactos (Cloud API) */
export async function sendWhatsAppContacts(to, contacts = []) {
  const mapped = (contacts || []).map(c => ({
    name: { formatted_name: c.formatted_name?.toString().slice(0, 512) || 'Contacto' },
    phones: (c.phones || []).map(p => ({ phone: String(p.phone), type: p.type || 'CELL' })),
    emails: (c.emails || []).map(e => ({ email: String(e.email), type: e.type || 'WORK' })),
  }));
  if (mapped.length === 0) return { skipped: true, reason: 'no-contacts' };

  return wabaFetch({
    messaging_product: 'whatsapp',
    to,
    type: 'contacts',
    contacts: mapped,
  });
}

/** List menu (para más de 3 opciones) */
export async function sendWhatsAppList(to, body, sections, headerText = null, buttonText = 'Elegí') {
  const interactive = {
    type: 'list',
    body: { text: String(body).slice(0, 1024) },
    action: {
      button: String(buttonText).slice(0, 20),
      sections: (sections || []).slice(0, 10).map(sec => ({
        title: String(sec.title || '').slice(0, 24),
        rows: (sec.rows || []).map(r => ({
          id: String(r.id),
          title: String(r.title).slice(0, 24),
          description: r.description ? String(r.description).slice(0, 60) : undefined
        }))
      }))
    }
  };
  if (headerText) interactive.header = { type: 'text', text: String(headerText).slice(0, 60) };

  // WhatsApp limita a 10 filas total entre todas las secciones
  const allRows = interactive.action.sections.flatMap(s => s.rows);
  if (allRows.length > 10) {
    let remaining = 10;
    const newSections = [];
    for (const s of interactive.action.sections) {
      if (!remaining) break;
      const rows = s.rows.slice(0, remaining);
      remaining -= rows.length;
      newSections.push({ ...s, rows });
    }
    interactive.action.sections = newSections;
  }

  return wabaFetch({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive
  });
}
