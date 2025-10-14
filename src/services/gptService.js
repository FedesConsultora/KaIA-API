import OpenAI from 'openai';
import 'dotenv/config';
import { getPromptSystem } from './promptTemplate.js';

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn('⚠️ OPENAI_API_KEY no configurado: GPT se simula.');
}

/**
 * Responde usando GPT. Si `openai` no está configurado, simula.
 * @param {string} mensajeVet  Texto del veterinario
 * @param {string} contextoExtra  Markdown con líneas "- Producto …" desde catálogo
 */
export async function responderConGPT(mensajeVet, contextoExtra = '') {
  // Seguridad de negocio: si no hay match en catálogo, no consultamos GPT.
  if (!contextoExtra) {
    return 'No encontré ese producto en el catálogo de KronenVet. ¿Podés darme nombre comercial, marca o principio activo?';
  }

  if (!openai) {
    return `🛠️ Simulación KaIA:\n${mensajeVet}\n\nContexto:\n${contextoExtra}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-2024-05-13',
      messages: [
        { role: 'system', content: getPromptSystem({ contextoExtra }) },
        { role: 'user',   content: mensajeVet }
      ],
      temperature: 0.3
    });

    return completion.choices?.[0]?.message?.content || 'Sin respuesta del modelo.';
  } catch (error) {
    console.error('❌ Error OpenAI:', error);
    return 'No pude procesar tu consulta en este momento. Probá más tarde.';
  }
}
