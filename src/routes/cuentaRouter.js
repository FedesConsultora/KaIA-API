// src/routes/cuentaRouter.js
import { Router } from 'express';
import { getSaldo } from '../controllers/cuentaController.js';
import auth from '../middlewares/auth.js';

const router = Router();

router.get('/saldo', auth, getSaldo);

export default router;
