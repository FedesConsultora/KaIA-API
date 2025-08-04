import { Feedback } from '../models/index.js';

export const registrarFeedback = async (req, res) => {
  const { flow_id, satisfecho, comentario } = req.body;
  const { user } = req;

  try {
    const nuevo = await Feedback.create({
      usuarioId: user.id,
      flow_id,
      satisfecho,
      comentario
    });

    res.status(201).json({ msg: 'Gracias por tu opinión', data: nuevo });
  } catch (err) {
    console.error('Error al guardar feedback:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};

export const listarFeedback = async (_req, res) => {
  try {
    const todos = await Feedback.findAll({ order: [['creado_en', 'DESC']] });
    res.json(todos);
  } catch (err) {
    console.error('Error al listar feedback:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};
