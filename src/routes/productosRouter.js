// src/routes/productosRouter.js
import { Router } from 'express';
import {
  getProductos,
  getProductoById
} from '../controllers/productosController.js';

const router = Router();

router.get('/productos', getProductos);
router.get('/productos/:id', getProductoById);

export default router;
