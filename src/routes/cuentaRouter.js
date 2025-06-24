// src/routes/cuentaRouter.js
import { Router } from 'express';
import { getSaldo } from '../controllers/cuentaController.js';
import auth from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cuenta
 *   description: Consulta de saldo de cuenta corriente
 */

/**
 * @swagger
 * /cuenta/saldo:
 *   get:
 *     summary: Devuelve el saldo del usuario autenticado
 *     tags: [Cuenta]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saldo actual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 saldo:
 *                   type: string
 *                   example: "7500.00"
 *                 credito:
 *                   type: string
 *                   example: "2000.00"
 *       401:
 *         description: Token faltante o inválido
 *       404:
 *         description: Cuenta no encontrada
 */
router.get('/saldo', auth, getSaldo);

export default router;
