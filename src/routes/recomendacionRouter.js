// src/routes/recomendacionRouter.js
import { Router } from 'express';
import { recomendarProducto } from '../controllers/recomendacionController.js';
import validarCuit from '../middlewares/validarCuit.js';

const router = Router();

// ✅ Requiere CUIT (sesión o header/body)
router.post('/recomendar', validarCuit, recomendarProducto);

export default router;
