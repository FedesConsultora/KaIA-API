// src/services/gptService.js
import OpenAI from 'openai';
import 'dotenv/config';
import { getPromptSystemStrict } from './promptTemplate.js';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18';

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn('⚠️ OPENAI_API_KEY no configurado: GPT se simula.');
}

export async function responderConGPTStrict(mensajeVet, { productosValidos = [], similares = [] } = {}) {
  const system = getPromptSystemStrict({ productosValidos, similares });

  // Simulación si falta API key (multi-producto)
  if (!openai) {
    if (!productosValidos.length) {
      const sims = similares.slice(0, 3).map(s => `• ${s.nombre}${s.marca ? ` (${s.marca})` : ''}`).join('\n');
      const simsBlock = sims ? `\n${sims}\n\nDecime el nombre para ver detalles.` : '';
      return `No encontré ese producto en el catálogo de KrönenVet. ¿Podés darme nombre comercial o marca?${simsBlock}`;
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
    // Fallback multi-producto
    if (!productosValidos.length) {
      const sims = similares.slice(0, 3).map(s => `• ${s.nombre}${s.marca ? ` (${s.marca})` : ''}`).join('\n');
      const simsBlock = sims ? `\n${sims}\n\nDecime el nombre para ver detalles.` : '';
      return `No encontré ese producto en el catálogo de KrönenVet. ¿Podés darme nombre comercial o marca?${simsBlock}`;
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
