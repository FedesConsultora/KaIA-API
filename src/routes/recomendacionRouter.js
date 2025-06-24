import { Router } from 'express';
import { sugerirProducto } from '../controllers/recomendacionController.js';
import auth from '../middlewares/auth.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Recomendación
 *   description: Sugerencias inteligentes de compra según consulta del veterinario
 */

/**
 * @swagger
 * /recomendacion:
 *   post:
 *     summary: Devuelve productos sugeridos según la necesidad expresada por el veterinario
 *     tags: [Recomendación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 example: "Necesito algo para otitis"
 *     responses:
 *       200:
 *         description: Lista de sugerencias inteligentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sugerencias:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       producto:
 *                         $ref: '#/components/schemas/Producto'
 *                       promo:
 *                         type: string
 *                         nullable: true
 *                         example: "2x1"
 *                       qtySugerida:
 *                         type: integer
 *                         example: 3
 *       400:
 *         description: Falta el campo query
 */
router.post('/', auth, sugerirProducto);

export default router;
