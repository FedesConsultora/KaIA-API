// src/jobs/feedbackScheduler.js
import { Op } from 'sequelize';
import { WhatsAppSession } from '../models/index.js';
import { sendWhatsAppButtons } from '../services/whatsappService.js';

const MIN = 60 * 1000;
const INACTIVITY_MS = 15 * MIN;
const FEEDBACK_COOLDOWN_MS = 24 * 60 * MIN; // 24 h

export function startFeedbackScheduler() {
  setInterval(async () => {
    try {
      const now = Date.now();
      const inactiveSince = new Date(now - INACTIVITY_MS);
      const cooldownSince = new Date(now - FEEDBACK_COOLDOWN_MS);

      // Inactivas (no se actualiza la fila hace 15m)
      const sessions = await WhatsAppSession.findAll({
        where: {
          state: 'verified',
          updated_at: { [Op.lt]: inactiveSince },
          [Op.or]: [
            { feedback_last_prompt_at: { [Op.is]: null } },
            { feedback_last_prompt_at: { [Op.lt]: cooldownSince } }
          ]
        },
        limit: 100
      });

      for (const s of sessions) {
        // Chequeo ventana 24h: si updated_at > now-24h, estamos dentro de ventana
        const inside24h = s.updated_at && (now - new Date(s.updated_at).getTime()) < (24 * 60 * MIN);

        if (!inside24h) {
          // Estás fuera de 24h → necesitarías TEMPLATE aprobado (no lo enviamos automático por ahora).
          // TODO: si definís un template, llamá a sendWhatsAppTemplate(...) aquí.
          continue;
        }

        const nombre = '¡Doc!'; // o resolvés por CUIT → nombre real
        const body = `¿Cómo venís con KaIA, ${nombre}?`;
        const buttons = [
          { id: 'fb_ok',  title: '👍 Todo bien' },
          { id: 'fb_meh', title: '🛠 Mejorable' },
          { id: 'fb_txt', title: '📝 Comentario' }
        ];
        await sendWhatsAppButtons(s.phone, body, buttons);

        // Marcar último prompt (evita re-pedir dentro del cooldown)
        await WhatsAppSession.update(
          { feedback_last_prompt_at: new Date() },
          { where: { id: s.id } }
        );
      }
    } catch (e) {
      console.error('⚠️ feedbackScheduler error:', e.message);
    }
  }, MIN);
}
