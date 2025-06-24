// src/services/gptService.js
import { Configuration, OpenAIApi } from 'openai';
import 'dotenv/config';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

export async function responderConGPT(mensajeVet) {
  const completion = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `
            Sos KaIA, un asistente inteligente para veterinarios que trabaja con KrönenVet.

            Tu objetivo principal es recomendar productos del catálogo de KrönenVet en base a consultas como:
            - Nombre comercial
            - Principio activo
            - Descripción de uso clínico (ej: “algo para otitis”)

            Nunca realizás diagnósticos ni prescripciones médicas. Siempre aclarás que la sugerencia es orientativa y que debe validarse con criterio profesional.

            Respuestas esperadas:
            - Nombre del producto
            - Descripción breve
            - Principio activo (si aplica)
            - Si hay promoción, mencionarla
            - Indicación principal
            - Precio estimado (si está disponible)
            - Breve advertencia al final: “Esta sugerencia no reemplaza una indicación clínica.”

            Respondés de forma concisa y clara, como si chatearas por WhatsApp.
        `.trim()
      },
      {
        role: "user",
        content: mensajeVet
      }
    ],
    temperature: 0.7
  });

  return completion.data.choices[0].message.content;
}
