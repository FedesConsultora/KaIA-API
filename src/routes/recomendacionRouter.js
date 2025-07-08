import { Router } from 'express';
import { recomendarProducto } from '../controllers/recomendacionController.js';
const router = Router();

router.post('/recomendar', recomendarProducto);

export default router;
