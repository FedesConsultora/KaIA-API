// src/services/whatsappService.js
import 'dotenv/config';

const WABA_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v20.0';
const WABA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

if (!WABA_TOKEN) console.warn('⚠️ Falta WHATSAPP_ACCESS_TOKEN');
if (!PHONE_ID) console.warn('⚠️ Falta WHATSAPP_PHONE_NUMBER_ID');

// 🔧 Config de paginado para List Messages
const LIST_ROWS_PER_SECTION = Number(process.env.RECO_LIST_ROWS_PER_SECTION || 10); // WhatsApp recomienda 10
const LIST_MAX_SECTIONS    = Number(process.env.RECO_LIST_MAX_SECTIONS    || 10); // recomendado 10
// ⚠️ Tope duro observado por WABA (evitamos 131009). Si la cuenta permite más, podés subirlo por env.
const HARD_MAX_ROWS        = Number(process.env.WABA_SAFE_LIST_MAX || 10);

// Si alguien setea un global mayor por env, igual lo capamos a HARD_MAX_ROWS
const LIST_GLOBAL_MAX      = Math.min(
  Number(process.env.RECO_LIST_GLOBAL_MAX || (LIST_ROWS_PER_SECTION * LIST_MAX_SECTIONS)),
  HARD_MAX_ROWS
);

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

/**
 * Envia una lista interactiva paginada.
 * ⚠️ Para evitar 131009, limitamos SIEMPRE el total a LIST_GLOBAL_MAX (por defecto 10).
 */
export async function sendWhatsAppList(to, body, sections, headerText = null, buttonText = 'Elegí') {
  // Aplano todas las filas manteniendo el id/title/description
  const allRows = [];
  for (const sec of (sections || [])) {
    const rows = (sec?.rows || []).map(r => ({
      id: String(r.id),
      title: String(r.title).slice(0, 24),
      description: r.description ? String(r.description).slice(0, 60) : undefined
    }));
    allRows.push(...rows);
  }

  const total = allRows.length;
  const maxRows = Math.max(1, LIST_GLOBAL_MAX); // ← tope duro (10 por defecto)
  const used = Math.min(total, maxRows);
  const rowsToSend = allRows.slice(0, used);

  // Chunk en secciones (igual capado a maxRows total)
  const chunked = [];
  for (let i = 0; i < rowsToSend.length && chunked.length < LIST_MAX_SECTIONS; i += LIST_ROWS_PER_SECTION) {
    const chunkRows = rowsToSend.slice(i, i + LIST_ROWS_PER_SECTION);
    const idx = chunked.length + 1;
    const baseTitle = sections?.[0]?.title || 'Opciones';
    const secTitle = rowsToSend.length > LIST_ROWS_PER_SECTION
      ? `${baseTitle} ${idx}/${Math.ceil(rowsToSend.length / LIST_ROWS_PER_SECTION)}`
      : baseTitle;

    chunked.push({
      title: String(secTitle).slice(0, 24),
      rows: chunkRows
    });
  }

  const interactive = {
    type: 'list',
    body: { text: String(body).slice(0, 1024) },
    action: {
      button: String(buttonText).slice(0, 20),
      sections: chunked
    }
  };
  if (headerText) interactive.header = { type: 'text', text: String(headerText).slice(0, 60) };

  const rowTitles = interactive.action.sections.flatMap(s => s.rows.map(r => r.title));
  console.log(`[TX][list] to=${to} :: header="${headerText||''}" :: rows=${rowTitles.length}/${total} :: ${rowTitles.slice(0,8).join(' | ')}${rowTitles.length>8?' …':''}`);

  return wabaFetch({
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive
  });
}