// src/routes/router.js
import { Router } from 'express';
import cuentaRouter from './cuentaRouter.js';
import productosRouter from './productosRouter.js';

const router = Router();

// Montamos los routers especializados
router.use('/cuenta', cuentaRouter);
router.use('/catalogo', productosRouter);

// Opcional: health-check o ruta raíz
router.get('/health', (_req, res) => {
  res.json({ status: 'ok 🔋' });
});

export default router;
