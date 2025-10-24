import { Op } from 'sequelize';
import { WhatsAppSession } from '../models/index.js';
import { sendWhatsAppButtons } from '../services/whatsappService.js';

const MIN = 60 * 1000;
const INACTIVITY_MS = 15 * MIN;           // 15 minutos sin activity
const FEEDBACK_COOLDOWN_MS = 24 * 60 * MIN; // 24 hs
let running = false;

export function startFeedbackScheduler() {
  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const now = Date.now();
      const inactiveSince = new Date(now - INACTIVITY_MS);
      const cooldownSince = new Date(now - FEEDBACK_COOLDOWN_MS);

      // Importante: usar ATRIBUTOS camelCase del modelo
      const sessions = await WhatsAppSession.findAll({
        where: {
          state: 'verified',
          updatedAt: { [Op.lt]: inactiveSince },
          [Op.or]: [
            { feedbackLastPromptAt: { [Op.is]: null } },
            { feedbackLastPromptAt: { [Op.lt]: cooldownSince } },
          ],
        },
        limit: 50,
      });

      for (const s of sessions) {
        // Ventana de 24h desde el último update de la sesión
        const inside24h = s.updatedAt && (now - new Date(s.updatedAt).getTime()) < (24 * 60 * MIN);
        if (!inside24h) continue; // fuera de ventana → no mandamos

        const nombre = '¡Doc!';
        const body = `¿Cómo venís con KaIA, ${nombre}?`;
        const buttons = [
          { id: 'fb_ok',  title: '👍 Todo bien' },
          { id: 'fb_meh', title: '🛠 Mejorable' },
          { id: 'fb_txt', title: '📝 Comentario' },
        ];

        await sendWhatsAppButtons(s.phone, body, buttons);

        // Anti-spam: registramos el prompt
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
