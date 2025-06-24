import { Router } from 'express';
import { getPromosByProducto } from '../controllers/promosController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Promociones
 *   description: Consulta de promociones activas por producto
 */

/**
 * @swagger
 * /productos/{id}/promos:
 *   get:
 *     summary: Devuelve las promociones activas para un producto específico
 *     tags: [Promociones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Lista de promociones activas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   nombre:
 *                     type: string
 *                     example: "Promo 2x1"
 *                   tipo:
 *                     type: string
 *                     example: "2x1"
 *                   fin:
 *                     type: string
 *                     format: date
 *                     example: "2025-07-31"
 *       404:
 *         description: Producto no encontrado
 */
router.get('/:id/promos', getPromosByProducto);

export default router;
