import { Router } from 'express';
import {
  buscarProductos,
  getProductoById
} from '../controllers/productosController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Catálogo
 *   description: Búsqueda inteligente de productos KrönenVet
 */

/**
 * @swagger
 * /catalogo/buscar:
 *   get:
 *     summary: Busca productos por nombre, compuesto o descripción de uso
 *     tags: [Catálogo]
 *     parameters:
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *         required: true
 *         description: "Término de búsqueda (por ejemplo: ivermectina, otitis, albendazol)"
 *     responses:
 *       200:
 *         description: Lista de productos sugeridos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 *       400:
 *         description: Falta el término de búsqueda
 */
router.get('/buscar', buscarProductos);

/**
 * @swagger
 * /catalogo/productos/{id}:
 *   get:
 *     summary: Trae un producto por ID
 *     tags: [Catálogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       404:
 *         description: Producto no encontrado
 */
router.get('/productos/:id', getProductoById);

export default router;
