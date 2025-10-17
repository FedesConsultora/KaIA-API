import { Router } from 'express';
import {
  handleWhatsAppVerify,
  handleWhatsAppMessage
} from '../controllers/webhookController.js';

const router = Router();

// Responder HEAD con 200 (salud)
router.head('/', (_req, res) => res.sendStatus(200));

// Si viene GET sin hub.*, devolvemos 200 "ok" (ping)
router.get('/', (req, res, next) => {
  if (!req.query['hub.mode']) return res.status(200).type('text/plain').send('ok');
  return next(); // sigue a la verificación real
});

// GET para verificación de Meta (hub.challenge)
router.get('/', handleWhatsAppVerify);

// POST para eventos/mensajes entrantes
router.post('/', handleWhatsAppMessage);

export default router;
