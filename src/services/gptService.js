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
 * Responde un mensaje usando GPT o, si no está configurado,
 * devuelve una respuesta simulada para pruebas.
 */
export async function responderConGPT(mensajeVet) {
  if (!openai) {
    return `🛠️ Simulación KaIA: recibí tu mensaje "${mensajeVet}", pero OpenAI aún no está configurado.`;
  }

  try {
    console.log("📥 [GPT INPUT]:", mensajeVet);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-05-13", // modelo fijado para consistencia
      messages: [
        { role: "system", content: getPromptSystem() },
        { role: "user", content: mensajeVet }
      ],
      temperature: 0.7
    });

    const respuesta = completion.choices?.[0]?.message?.content || "Sin respuesta del modelo.";
    console.log("📤 [GPT OUTPUT]:", respuesta);
    return respuesta;

  } catch (error) {
    console.error("❌ Error al consultar OpenAI:", error);
    return "Lo siento, no pude procesar tu consulta en este momento. Por favor intentá más tarde.";
  }
}
