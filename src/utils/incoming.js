// src/utils/incoming.js
import { sanitizeText } from '../services/intentService.js';

export function extractIncomingMessages(body) {
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
          if (m.type === 'text') {
            out.push({ from, text: sanitizeText(m.text?.body || '') });
          }
          if (m.type === 'interactive') {
            const it = m.interactive || {};
            if (it.type === 'list_reply' && it.list_reply?.id) {
              out.push({ from, text: sanitizeText(String(it.list_reply.id)) });
            }
            if (it.type === 'button_reply' && it.button_reply?.id) {
              out.push({ from, text: sanitizeText(String(it.button_reply.id)) });
            }
          }
        }
      }
    }
  } catch {}
  return out;
}
