// src/services/waSessionService.js
import { Op } from 'sequelize';
import { WhatsAppSession, Usuario } from '../models/index.js';

const TTL_DAYS = Number(process.env.WHATSAPP_SESSION_TTL_DAYS || 60);

export async function getOrCreateSession(phone) {
  let s = await WhatsAppSession.findOne({ where: { phone } });
  if (!s) s = await WhatsAppSession.create({ phone, state: 'awaiting_cuit' });
  return s;
}

export function isExpired(session) {
  return session.expires_at && new Date(session.expires_at) < new Date();
}

export async function upsertVerified(phone, cuit) {
  const expires = new Date();
  expires.setDate(expires.getDate() + TTL_DAYS);

  return WhatsAppSession.upsert({
    phone,
    cuit,
    verified_at: new Date(),
    expires_at: expires,
    state: 'verified'
  }, { returning: true });
}

export async function validateCuitExists(cuit) {
  return Usuario.findOne({ where: { cuit: String(cuit) } });
}
