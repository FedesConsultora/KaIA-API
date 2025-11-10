// src/flows/flow-search.js
import { t } from '../config/texts.js';
import { sendWhatsAppText, sendWhatsAppContacts } from '../services/whatsappService.js';
import { ADMIN_PHONE_DIGITS } from '../config/app.js';

import { extraerTerminosBusqueda } from '../services/gptService.js';

import {
  openProductDetail,
  handleDisambigAnswer,
  runDisambiguationOrRecommend
} from '../services/disambiguationService.js';

import {
  getReco, setReco, overwriteReco, setState, getState, resetRecoContext
} from '../services/waSessionService.js';

import { detectarIntent } from '../services/intentService.js';
import { getVetByCuit } from '../services/userService.js';

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function resetRecoUI(from) {
  try { await resetRecoContext(from); } catch {}
}

function isFreshSearch(prevReco, consulta = '') {
  const q = (consulta || '').toLowerCase();
  const hasVerb = /(busco|estoy\s*buscando|quiero|necesito|catalogo|catálogo|otra cosa|nuevo|nueva busqueda|nueva búsqueda)/i.test(q);
  const prevMust = (prevReco?.tokens?.must || []);
  const killsMust = prevMust.length > 0 && !prevMust.some(m => q.includes(String(m).toLowerCase()));
  const cameFromMenu = !prevReco?.lastQuery;
  return hasVerb || killsMust || cameFromMenu;
}

// “disambig:*”
export async function tryHandleDisambig(from, normText) {
  if ((normText || '').startsWith('disambig:')) {
    await sendWhatsAppText(from, '🤔 Ajustando tu búsqueda…');
    await delay(500);
    await handleDisambigAnswer(from, normText);
    return true;
  }
  return false;
}

async function handleConsulta(from, nombre, consulta) {
  const prev = await getReco(from);
  const gptNew = await extraerTerminosBusqueda(consulta);

  if (isFreshSearch(prev, consulta)) {
    await overwriteReco(from, {
      failCount: 0,
      tokens: {
        must:   Array.isArray(gptNew?.must)   ? gptNew.must   : [],
        should: Array.isArray(gptNew?.should) ? gptNew.should : [],
        negate: Array.isArray(gptNew?.negate) ? gptNew.negate : []
      },
      lastQuery: consulta,
      lastSimilares: [],
      lastShownIds: [],
      signals: { species: null, form: null, brands: [], actives: [], indications: [], weight_hint: null, packs: [], negatives: [] },
      asked: [],
      hops: 0,
      lastInteractionAt: null
    });
  } else {
    const mergedTokens = {
      must:   Array.from(new Set([...(prev?.tokens?.must || []), ...(gptNew?.must || [])])),
      should: Array.from(new Set([...(prev?.tokens?.should || []), ...(gptNew?.should || [])])),
      negate: Array.from(new Set([...(prev?.tokens?.negate || []) , ...(gptNew?.negate || [])]))
    };
    await setReco(from, { tokens: mergedTokens, lastQuery: consulta });
  }

  await setState(from, 'awaiting_consulta');

  // 🕵️ Mensaje de “buscando” antes de resolver recomendaciones
  await sendWhatsAppText(from, '🔎 Buscando opciones para vos…');
  await delay(700);

  await runDisambiguationOrRecommend({ from, nombre, consulta });
}

export async function handle({ from, state, normText, vet, nombre }) {
  // Abrir ficha por “prod:<id>”
  if ((normText || '').startsWith('prod:')) {
    await sendWhatsAppText(from, '🔎 Abriendo ficha…');
    await delay(600);

    const pid = Number(String(normText).split(':')[1]);
    const ok = await openProductDetail(from, pid);
    if (ok) {
      const ej = vet?.EjecutivoCuenta;
      if (ej && (ej.phone || ej.email)) {
        await sendWhatsAppContacts(from, [{
          formatted_name: ej.nombre,
          first_name: ej.nombre?.split(' ')[0],
          last_name: ej.nombre?.split(' ').slice(1).join(' ') || undefined,
          org: 'KrönenVet',
          phones: ej.phone ? [{ phone: ej.phone, type: 'WORK' }] : [],
          emails: ej.email ? [{ email: ej.email, type: 'WORK' }] : []
        }]);
        await sendWhatsAppText(from, t('handoff_ejecutivo', { ejecutivo: ej.nombre, telefono: ej.phone || '' }));
      } else {
        await sendWhatsAppContacts(from, [{
          formatted_name: 'Administración KronenVet',
          first_name: 'Administración',
          last_name: 'KronenVet',
          org: 'KrönenVet',
          phones: [{ phone: ADMIN_PHONE_DIGITS, type: 'WORK' }]
        }]);
        await sendWhatsAppText(from, t('handoff_admin', { telefono: ADMIN_PHONE_DIGITS }));
      }
    } else {
      await sendWhatsAppText(from, t('producto_open_error'));
    }
    return true;
  }

  // Estado de búsqueda
  if (state === 'awaiting_consulta') {
    const intent = detectarIntent(normText);
    if (['menu','saludo','ayuda','gracias'].includes(intent)) {
      await resetRecoContext(from);
      return false; // que lo agarre el flow-menu en el controller
    }
    if (!normText) {
      await sendWhatsAppText(from, t('pedir_consulta'));
      return true;
    }
    await handleConsulta(from, nombre, normText);
    return true;
  }

  // Sin estado explícito: si escribe algo, lo tomamos como consulta
  if (normText && !normText.startsWith('promo:')) {
    const s = await getState(from);
    if (s !== 'awaiting_feedback_text') {
      await handleConsulta(from, nombre, normText);
      return true;
    }
  }

  return false;
}
