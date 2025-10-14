import 'dotenv/config';

const WABA_URL  = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v20.0';
const WABA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;            // Bearer <token>
const PHONE_ID   = process.env.WHATSAPP_PHONE_NUMBER_ID;         // ej. 123456789012345

if (!WABA_TOKEN)  console.warn('⚠️ Falta WHATSAPP_ACCESS_TOKEN');
if (!PHONE_ID)    console.warn('⚠️ Falta WHATSAPP_PHONE_NUMBER_ID');

export async function sendWhatsAppText(to, body) {
  const url = `${WABA_URL}/${PHONE_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body }
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WABA_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    console.error('❌ Error enviando WhatsApp:', resp.status, txt);
    throw new Error(`WhatsApp send error ${resp.status}`);
  }
  return resp.json();
}
