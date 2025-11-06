// src/services/gptService.js
// ----------------------------------------------------
import OpenAI from 'openai';
import 'dotenv/config';
import { getPromptSystemStrict, getPromptQueryExtract } from './promptTemplate.js';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18';

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn('⚠️ OPENAI_API_KEY no configurado: GPT se simula.');
}

export async function responderConGPTStrict(mensajeVet, { productosValidos = [], similares = [] } = {}) {
  const system = getPromptSystemStrict({ productosValidos, similares });

  if (!openai) {
    if (!productosValidos.length) {
      return 'No encontré ese producto en el catálogo de KrönenVet. ¿Podés darme nombre comercial o marca?';
    }
    const bloques = productosValidos.slice(0, 3).map(p => {
      const precio = p.precio ? ` $${Number(p.precio).toFixed(0)}` : '(consultar)';
      const promo  = p.promo?.activa ? `Sí: ${p.promo.nombre}` : 'No';
      return [
        `- Producto sugerido: ${p.nombre}`,
        `- Marca / Presentación: ${p.marca || '—'}${p.presentacion ? ` / ${p.presentacion}` : ''}`,
        `- ¿Tiene promoción?: ${promo}`,
        `- Precio estimado (si aplica): ${precio}`,
        `- ⚠️ Advertencia: Esta sugerencia no reemplaza una indicación clínica.`
      ].join('\n');
    });
    return bloques.join('\n\n');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user',   content: mensajeVet }
      ],
      temperature: 0.3
    });
    return completion.choices?.[0]?.message?.content || 'Sin respuesta del modelo.';
  } catch (error) {
    console.error('❌ Error OpenAI:', error);
    if (!productosValidos.length) {
      return 'No encontré ese producto en el catálogo de KrönenVet. ¿Podés darme nombre comercial o marca?';
    }
    const bloques = productosValidos.slice(0, 3).map(p => {
      const precio = p.precio ? ` $${Number(p.precio).toFixed(0)}` : '(consultar)';
      const promo  = p.promo?.activa ? `Sí: ${p.promo.nombre}` : 'No';
      return [
        `- Producto sugerido: ${p.nombre}`,
        `- Marca / Presentación: ${p.marca || '—'}${p.presentacion ? ` / ${p.presentacion}` : ''}`,
        `- ¿Tiene promoción?: ${promo}`,
        `- Precio estimado (si aplica): ${precio}`,
        `- ⚠️ Advertencia: Esta sugerencia no reemplaza una indicación clínica.`
      ].join('\n');
    });
    return bloques.join('\n\n');
  }
}

/** ---------- EXTRACTOR ---------- */
// 🆕 ampliamos STOP para ignorar saludos/comandos triviales
const STOP = new Set([
  'de','para','por','con','sin','y','o','la','el','los','las','un','una','unos','unas','que','del','al','en','a','se',
  'hola','holaa','holis','buenas','buenos','hey','hi','menu','menú','buscar','volver','opciones','inicio','gracias','chau','adios','adiós','hasta','luego'
]);

const norm = (s) => (s || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').trim();

/** Heurística offline si no hay API */
function naiveExtract(query) {
  const toks = norm(query).split(/\s+/).filter(Boolean).filter(w => !STOP.has(w));
  const should = Array.from(new Set(toks)).slice(0, 12);
  return { must: [], should, negate: [] };
}

/**
 * Devuelve { must:[], should:[], negate:[] } para pasar a la capa SQL/score.
 */
export async function extraerTerminosBusqueda(query) {
  if (!query || typeof query !== 'string') return { must: [], should: [], negate: [] };

  if (!openai) return naiveExtract(query);

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: getPromptQueryExtract() },
        { role: 'user',   content: query }
      ],
      temperature: 0
    });

    let raw = completion.choices?.[0]?.message?.content || '{}';
    raw = raw.trim().replace(/^\s*```json\s*|\s*```\s*$/g, '');
    const parsed = JSON.parse(raw);
    const must   = Array.isArray(parsed.must)   ? parsed.must.map(norm)   : [];
    const should = Array.isArray(parsed.should) ? parsed.should.map(norm).filter(w => !STOP.has(w)) : [];
    const negate = Array.isArray(parsed.negate) ? parsed.negate.map(norm).filter(w => !STOP.has(w)) : [];
    return { must, should, negate };
  } catch (e) {
    console.error('⚠️ extraerTerminosBusqueda fallback:', e?.message);
    return naiveExtract(query);
  }
}