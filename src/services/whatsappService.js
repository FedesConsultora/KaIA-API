// src/services/whatsappService.js
import 'dotenv/config';

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v19.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;
const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

function trimLen(str, max) {
  if (!str) return '';
  const s = String(str);
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

async function waFetch(payload, label = 'send') {
  if (!PHONE_NUMBER_ID || !TOKEN) {
    console.warn('⚠️ Falta configurar WHATSAPP_NUMBER_ID o WHATSAPP_TOKEN');
    console.debug(`[WA][DRYRUN][${label}]`, JSON.stringify(payload, null, 2));
    return null;
  }

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let data = {};
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    console.error(`[WA][ERR][${label}]`, { status: res.status, data });
    throw new Error(data?.error?.message || `WA API error ${res.status}`);
  }

  return data;
}

/**
 * Texto simple
 * @param {string} to - Número E.164 (ej: "5492211234567")
 * @param {string} text
 */
export async function sendWhatsAppText(to, text) {
  const body = trimLen(text || '', 4096);
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body }
  };
  console.log(`[TX][text] to=${to} :: ${body.slice(0, 160)}`);
  return waFetch(payload, 'text');
}

/**
 * Lista interactiva (List message)
 * @param {string} to
 * @param {string} bodyText - cuerpo del mensaje
 * @param {Array<{title:string, rows:Array<{id:string,title:string,description?:string}>}>} sections
 * @param {string} headerText - cabecera visible del listado
 * @param {string} buttonText - texto del botón (ej: "Elegí")
 */
export async function sendWhatsAppList(to, bodyText, sections = [], headerText = '', buttonText = 'Elegí') {
  // saneo longitudes máximas recomendadas por la API
  const safeSections = (sections || []).map(sec => ({
    title: trimLen(sec?.title || '', 24),
    rows: (sec?.rows || []).map(r => ({
      id: String(r.id),
      title: trimLen(r.title || 'Opción', 24),
      description: r.description ? trimLen(r.description, 72) : undefined
    }))
  }));

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: headerText ? { type: 'text', text: trimLen(headerText, 60) } : undefined,
      body: { text: trimLen(bodyText || '', 1024) },
      action: {
        button: trimLen(buttonText || 'Elegí', 20),
        sections: safeSections
      }
    }
  };

  console.log(`[TX][list] to=${to} :: header="${headerText || ''}" :: rows=${safeSections.reduce((n,s)=>n+(s.rows?.length||0),0)}`);
  return waFetch(payload, 'list');
}

/**
 * Botones interactivos (3 max)
 * @param {string} to
 * @param {string} bodyText
 * @param {Array<{id:string,title:string}>} buttons
 */
export async function sendWhatsAppButtons(to, bodyText, buttons = []) {
  const safeButtons = (buttons || []).slice(0, 3).map(b => ({
    type: 'reply',
    reply: {
      id: String(b.id),
      title: trimLen(b.title || 'Elegir', 20)
    }
  }));

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: trimLen(bodyText || '', 1024) },
      action: { buttons: safeButtons }
    }
  };

  console.log(`[TX][buttons] to=${to} :: ${safeButtons.map(b => b.reply.title).join(' | ')}`);
  return waFetch(payload, 'buttons');
}

/**
 * Enviar contactos (card de contacto)
 * @param {string} to
 * @param {Array<{formatted_name:string, first_name:string, last_name?:string, org?:string, phones?:Array<{phone:string,type?:string}>, emails?:Array<{email:string,type?:string}>}>} contacts
 */
export async function sendWhatsAppContacts(to, contacts = []) {
  const safeContacts = (contacts || []).map(c => ({
    name: {
      formatted_name: trimLen(c.formatted_name || `${c.first_name || ''} ${c.last_name || ''}`.trim(), 128),
      first_name: trimLen(c.first_name || '', 60),
      last_name: c.last_name ? trimLen(c.last_name, 60) : undefined
    },
    org: c.org ? { company: trimLen(c.org, 60) } : undefined,
    phones: (c.phones || []).map(p => ({ phone: String(p.phone), type: p.type || 'CELL' })),
    emails: (c.emails || []).map(e => ({ email: String(e.email), type: e.type || 'WORK' }))
  }));

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'contacts',
    contacts: safeContacts
  };

  console.log(`[TX][contacts] to=${to} :: contacts=${safeContacts.length}`);
  return waFetch(payload, 'contacts');
}
