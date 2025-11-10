// src/services/wabaParser.js
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
          if (m.type === 'text') out.push({ from, text: (m.text?.body || '').trim() });
          if (m.type === 'interactive') {
            const it = m.interactive || {};
            if (it.type === 'list_reply' && it.list_reply?.id)   out.push({ from, text: String(it.list_reply.id).trim() });
            if (it.type === 'button_reply' && it.button_reply?.id) out.push({ from, text: String(it.button_reply.id).trim() });
          }
        }
      }
    }
  } catch {}
  return out;
}
