// src/controllers/feedbackController.js
import { Op } from 'sequelize';
import { Feedback, Usuario } from '../models/index.js';

export async function registrarFeedback(req, res) {
  try {
    const { flow_id, satisfecho, comentario, meta } = req.body || {};
    const cuit = req.cuit || null;          // si tu middleware lo setea
    const phone = req.body?.phone || null;  // opcional

    await Feedback.create({
      phone, cuit, flow_id: flow_id || 'wh_feedback',
      satisfecho: satisfecho || null,
      comentario: (comentario || '').toString().slice(0, 3000),
      meta: meta || null
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('registrarFeedback error:', e);
    res.status(500).json({ ok: false });
  }
}

export async function listarFeedback(req, res) {
  try {
    const q = (req.query.q || '').trim();
    const where = q ? {
      [Op.or]: [
        { cuit: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
        { comentario: { [Op.like]: `%${q}%` } }
      ]
    } : undefined;

    const rows = await Feedback.findAll({
      where,
      order: [['creado_en', 'DESC']],   // 👈 usa tu columna real
      limit: 500
    });

    res.json({ ok: true, data: rows });
  } catch (e) {
    console.error('listarFeedback error:', e);
    res.status(500).json({ ok: false });
  }
}

/** Listado Admin (vista) */
export async function listAdmin(_req, res) {
  const rows = await Feedback.findAll({
    include: [{
      model: Usuario,
      required: false,
      attributes: ['id', 'nombre', 'email']
    }],
    order: [['creado_en', 'DESC']],
    limit: 500
  });
  const items = rows.map(r => r.get({ plain: true }));
  res.render('admin/feedback/list', {
    title: 'Feedback',
    items,
    success: _req.flash?.('success'),
    error: _req.flash?.('error')
  });
}

