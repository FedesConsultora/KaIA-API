// src/routes/authRouter.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const router = Router();

/**
 * @swagger
 * /auth/dev-login:
 *   post:
 *     summary: Devuelve un token JWT simulando login por número de teléfono
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: phone
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de teléfono con código país (ej: 5492215550000)
 *     responses:
 *       200:
 *         description: Token generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/dev-login', async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ msg: 'Falta el número' });
  }

  const user = await Usuario.findOne({ where: { phone } });

  if (!user) {
    return res.status(404).json({ msg: 'Usuario no registrado' });
  }

  const payload = {
    id: user.id,
    phone: user.phone,
    role: user.role
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '2h'
  });

  res.json({ token });
});

export default router;
