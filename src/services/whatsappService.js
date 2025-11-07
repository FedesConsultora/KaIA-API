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

/* ---------- Helpers + LOGS ---------- */
function trunc(s, n = 180) {
  s = String(s ?? '');
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export async function sendWhatsAppText(to, body) {
  console.log(`[TX][text] to=${to} :: ${trunc(body)}`);
  return wabaFetch({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: String(body).slice(0, 4096) },
  });
}

export async function sendWhatsAppButtons(to, body, buttons = []) {
  const safe = (buttons || [])
    .filter(b => b && b.id && b.title)
    .slice(0, 3)
    .map(b => ({
      type: 'reply',
      reply: { id: String(b.id), title: String(b.title).slice(0, 20) }
    }));
  if (safe.length === 0) return sendWhatsAppText(to, body);

  console.log(`[TX][buttons] to=${to} :: ${trunc(body)} :: ${safe.map(b=>b.reply.title).join(' | ')}`);
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

export async function sendWhatsAppContacts(to, contacts = []) {
  const mapped = (contacts || []).map(c => {
    const name = {
      formatted_name: c.formatted_name?.toString().slice(0, 512) || 'Contacto'
    };
    if (c.first_name) name.first_name = String(c.first_name).slice(0, 128);
    if (c.last_name)  name.last_name  = String(c.last_name).slice(0, 128);

    const out = {
      name,
      phones: (c.phones || []).map(p => {
        const ph = { phone: String(p.phone) };
        if (p.type)  ph.type = p.type;
        if (p.wa_id) ph.wa_id = String(p.wa_id);
        return ph;
      }),
      emails: (c.emails || []).map(e => ({ email: String(e.email), type: e.type || 'WORK' })),
    };
    if (c.org) out.org = { company: String(c.org).slice(0, 256) };
    return out;
  });

  if (mapped.length === 0) return { skipped: true, reason: 'no-contacts' };

  console.log(`[TX][contacts] to=${to} :: ${JSON.stringify(mapped[0]?.name)} :: phones=${mapped[0]?.phones?.length||0}`);
  return wabaFetch({
    messaging_product: 'whatsapp',
    to,
        type: 'contacts',
    contacts: mapped,
  });
}

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

  // 🚦 Cap estricto de filas (máx. 6)
  const allRows = interactive.action.sections.flatMap(s => s.rows);
  if (allRows.length > 6) {
    let remaining = 6;
    const newSections = [];
    for (const s of interactive.action.sections) {
      if (!remaining) break;
      const rows = s.rows.slice(0, remaining);
      remaining -= rows.length;
      newSections.push({ ...s, rows });
    }
    interactive.action.sections = newSections;
  }

  const rowTitles = interactive.action.sections.flatMap(s => s.rows.map(r => r.title));
  console.log(`[TX][list] to=${to} :: header="${headerText||''}" :: rows=${rowTitles.length} :: ${rowTitles.join(' | ')}`);
  return wabaFetch({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive
  });
}
