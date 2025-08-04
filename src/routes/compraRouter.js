import { Router } from 'express';
import { registrarCompra, listarMisCompras } from '../controllers/compraController.js';
import validarCuit from '../middlewares/validarCuit.js';

const router = Router();

router.post('/', validarCuit, registrarCompra);
router.get('/mias', validarCuit, listarMisCompras);

export default router;
