import { Router } from 'express';
import {
  handleWhatsAppVerify,
  handleWhatsAppMessage
} from '../controllers/webhookController.js';

const router = Router();

// GET para verificación de Meta (hub.challenge)
router.get('/', handleWhatsAppVerify);

// POST para eventos/mensajes entrantes
router.post('/', handleWhatsAppMessage);

export default router;
