// src/controllers/chatController.js
import { responderConGPT } from '../services/gptService.js';

export const responderChat = async (req, res) => {
  const { mensaje } = req.body;

  if (!mensaje) {
    return res.status(400).json({ msg: 'Mensaje requerido' });
  }

  try {
    const respuesta = await responderConGPT(mensaje);
    res.json({ respuesta });
  } catch (err) {
    console.error('Error al responder con GPT:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};
