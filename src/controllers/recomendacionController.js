import { buildCatalogContext } from '../services/catalogContext.js';
import { responderConGPT }    from '../services/gptService.js';

/**
 * Recibe el texto del vete → busca datos → llama a GPT → devuelve respuesta
 * Pensado para usarlo tanto desde REST (/api/recomendar) como desde webhook.
 */
export async function recomendarProducto(req, res) {
  try {
    const mensajeVet = req.body?.mensaje || req.query?.mensaje;
    if (!mensajeVet) return res.status(400).json({ msg: 'Falta mensaje' });

    // 1) Buscamos productos relacionados para el contexto
    const contextoExtra = await buildCatalogContext(mensajeVet);
    
    // 2) Llamamos a GPT pasándole prompt + contexto
    const respuesta = await responderConGPT(mensajeVet, contextoExtra);

    res.json({ ok: true, respuesta });
  } catch (err) {
    console.error('❌ Error recomendación:', err);
    res.status(500).json({ ok: false, msg: 'Error interno' });
  }
}
