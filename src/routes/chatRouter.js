// src/routes/chatRouter.js
import { Router } from 'express';
import { responderChat } from '../controllers/chatController.js';

const router = Router();

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Envia una consulta de texto al asistente KaIA
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mensaje:
 *                 type: string
 *                 example: Necesito ivermectina para gatos
 *     responses:
 *       200:
 *         description: Respuesta generada por KaIA
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 respuesta:
 *                   type: string
 */
router.post('/', responderChat);

export default router;
