// src/routes/productosRouter.js
import { Router } from 'express';
import multer from 'multer';
import {
  buscarProductos,
  getProductoById,
  cargarProductosDesdeExcel
} from '../controllers/productosController.js';

const router = Router();
const upload = multer(); // Almacenamiento en memoria

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

/**
 * @swagger
 * /catalogo/cargar-excel:
 *   post:
 *     summary: Carga productos desde un archivo Excel (.xlsx)
 *     tags: [Catálogo]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               archivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Productos cargados correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 total:
 *                   type: integer
 *       400:
 *         description: No se adjuntó archivo
 */
router.post('/cargar-excel', upload.single('archivo'), cargarProductosDesdeExcel);

export default router;
