// src/flows/flow-promos.js
import { Promocion } from '../models/index.js';
import { sendWhatsAppList, sendWhatsAppText } from '../services/whatsappService.js';
import { t } from '../config/texts.js';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function handle({ from, intent, normText }) {
  if (intent === 'promos') {
    await sendWhatsAppText(from, '🎁 Buscando promos vigentes…');
    await delay(600);

    const promos = await Promocion.findAll({
      where: { vigente: true },
      order: [['vigencia_hasta','ASC'], ['nombre','ASC']],
      limit: 10
    });

    if (!promos.length) {
      await sendWhatsAppText(from, t('promos_empty'));
      return true;
    }

    await sendWhatsAppList(
      from,
      t('promos_list_body'),
      [{
        title: t('promos_list_title'),
        rows: promos.map(p => ({
          id: `promo:${p.id}`,
          title: (p.nombre || '').slice(0,24),
          description: [p.tipo, p.presentacion].filter(Boolean).join(' • ').slice(0,60)
        }))
      }],
      t('promos_list_header'),
      t('btn_elegi')
    );
    return true;
  }

  if ((normText || '').startsWith('promo:')) {
    await sendWhatsAppText(from, '🎁 Abriendo promo…');
    await delay(600);

    const pid = Number(String(normText).split(':')[1]);
    const p = await Promocion.findByPk(pid);
    if (!p) { await sendWhatsAppText(from, t('promo_open_error')); return true; }

    const body = [
      `🎁 ${p.nombre}`,
      p.tipo ? `Tipo: ${p.tipo}` : null,
      p.detalle ? p.detalle : null,
      p.regalo ? `Regalo: ${p.regalo}` : null,
      `Vigencia: ${p.vigencia_desde ? new Date(p.vigencia_desde).toLocaleDateString() : '—'} a ${p.vigencia_hasta ? new Date(p.vigencia_hasta).toLocaleDateString() : '—'}`
    ].filter(Boolean).join('\n');

    await sendWhatsAppText(from, body);
    return true;
  }

  return false;
}
