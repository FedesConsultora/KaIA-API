import { Router } from 'express';
import { registrarFeedback, listarFeedback } from '../controllers/feedbackController.js';
import validarCuit from '../middlewares/validarCuit.js';

const router = Router();

router.post('/', validarCuit, registrarFeedback);
router.get('/', listarFeedback); // opcional, solo para admin

export default router;
