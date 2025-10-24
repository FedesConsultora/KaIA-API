// src/schedulers/feedbackScheduler.js
import { Op, col, where } from 'sequelize';
import { WhatsAppSession } from '../models/index.js';
import { sendWhatsAppButtons } from '../services/whatsappService.js';

const MIN = 60 * 1000;
const INACTIVITY_MS = 15 * MIN;               // 15 minutos
const WINDOW_24H_MS = 24 * 60 * MIN;          // 24 hs
let running = false;

export function startFeedbackScheduler() {
  setInterval(async () => {
    if (running) return;
    running = true;

    try {
      const now = Date.now();
      const inactiveSince = new Date(now - INACTIVITY_MS);
      const windowSince   = new Date(now - WINDOW_24H_MS);

      const sessions = await WhatsAppSession.findAll({
        where: {
          state: 'verified',
          // Solo si NUNCA se lo mandamos → evita duplicados
          feedbackLastPromptAt: { [Op.is]: null },

          // updated_at entre (now-24h .. now-15m)
          [Op.and]: [
            where(col('updated_at'), { [Op.lt]: inactiveSince }),
            where(col('updated_at'), { [Op.gt]: windowSince }),
          ],
        },
        limit: 200,
      });

      for (const s of sessions) {
        await sendWhatsAppButtons(s.phone, '¿Cómo venís con KaIA?', [
          { id: 'fb_ok',  title: '👍 Todo bien' },
          { id: 'fb_meh', title: '🛠 Mejorable' },
          { id: 'fb_txt', title: '📝 Comentario' },
        ]);

        await WhatsAppSession.update(
          { feedbackLastPromptAt: new Date() },
          { where: { id: s.id } },
        );
      }
    } catch (e) {
      console.error('⚠️ feedbackScheduler error:', e.message);
    } finally {
      running = false;
    }
  }, MIN);
}
