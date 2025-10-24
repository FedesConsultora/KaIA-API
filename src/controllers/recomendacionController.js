// src/controllers/recomendacionController.js
import { recomendarDesdeBBDD } from '../services/recommendationService.js';
import { responderConGPTStrict } from '../services/gptService.js';

/**
 * Recibe el texto del vete → busca en BBDD → arma lista de válidos/similares → llama a GPT (guardrails)
 * Válido para REST (/api/recomendar) y para pruebas directas.
 */
export async function recomendarProducto(req, res) {
  try {
    const mensajeVet = req.body?.mensaje || req.query?.mensaje;
    if (!mensajeVet) return res.status(400).json({ ok: false, msg: 'Falta mensaje' });

    // 1) Buscar candidatos y similares SOLO desde BBDD (multi-producto)
    const { validos = [], top, similares = [] } = await recomendarDesdeBBDD(mensajeVet);

    // 2) Pasar a GPT 1..3 productos válidos (si hay) + similares
    const productosValidos = validos.length ? validos.slice(0, 3) : (top ? [top] : []);

    // 3) Responder con GPT (formato y reglas estrictas)
    const respuesta = await responderConGPTStrict(mensajeVet, { productosValidos, similares });

    return res.json({ ok: true, respuesta });
  } catch (err) {
    console.error('❌ Error recomendación:', err);
    return res.status(500).json({ ok: false, msg: 'Error interno' });
  }
}
