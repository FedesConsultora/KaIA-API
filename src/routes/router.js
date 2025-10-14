// src/routes/router.js
import { Router } from 'express';
import cuentaRouter from './cuentaRouter.js';
import productosRouter from './productosRouter.js';
import promosRouter from './promosRouter.js';
import recomendacionRouter from './recomendacionRouter.js';
import chatRouter from './chatRouter.js';

const router = Router();

// Montamos los routers especializados
router.use('/cuenta', cuentaRouter);
router.use('/catalogo', productosRouter);
router.use('/productos', productosRouter);
router.use('/promos',    promosRouter); 
router.use('/recomendacion', recomendacionRouter);
router.use('/chat', chatRouter);


// Opcional: health-check o ruta raíz
router.get('/health', (_req, res) => {
  res.json({ status: 'ok 🔋' });
});

export default router;