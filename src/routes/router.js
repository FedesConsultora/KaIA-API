// src/routes/router.js
import { Router } from 'express';
import cuentaRouter from './cuentaRouter.js';
import productosRouter from './productosRouter.js';
import promosRouter from './promosRouter.js';
import recomendacionRouter from './recomendacionRouter.js';
import authRouter from './authRouter.js';
import chatRouter from './chatRouter.js';

const router = Router();

// Montamos los routers especializados
router.use('/auth', authRouter);
router.use('/cuenta', cuentaRouter);
router.use('/catalogo', productosRouter);
router.use('/productos', promosRouter);
router.use('/recomendacion', recomendacionRouter);
router.use('/chat', chatRouter);


// Opcional: health-check o ruta raíz
router.get('/health', (_req, res) => {
  res.json({ status: 'ok 🔋' });
});

export default router;
