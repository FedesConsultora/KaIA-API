// src/routes/router.js
import { Router } from 'express';
import cuentaRouter from './cuentaRouter.js';
import productosRouter from './catalogoRouter.js';
import recomendacionRouter from './recomendacionRouter.js';

const router = Router();

// Montamos los routers especializados
router.use('/cuenta', cuentaRouter);
router.use('/catalogo', productosRouter);
router.use('/productos', productosRouter);
router.use('/recomendacion', recomendacionRouter);


// Opcional: health-check o ruta raíz
router.get('/health', (_req, res) => {
  res.json({ status: 'ok 🔋' });
});

export default router;