// src/services/waSessionService.js
import { WhatsAppSession } from '../models/index.js';

const TTL_DAYS = Number(
  process.env.CUIT_VERIFY_TTL_DAYS ||
  process.env.WHATSAPP_SESSION_TTL_DAYS ||
  60
);

export async function getOrCreateSession(phone) {
  let s = await WhatsAppSession.findOne({ where: { phone } });
  if (!s) s = await WhatsAppSession.create({ phone, state: 'awaiting_cuit' });
  return s;
}

export function isExpired(session) {
  return !!(session?.expiresAt && new Date(session.expiresAt) < new Date());
}

export async function upsertVerified(phone, cuit) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TTL_DAYS);

  const [row] = await WhatsAppSession.upsert({
    phone,
    cuit: String(cuit),
    verifiedAt: new Date(),
    expiresAt,
    state: 'verified',
    pending: null,
    feedbackLastPromptAt: null,
    feedbackLastResponseAt: null
  }, { returning: true });

  return row;
}

export async function ensureExpiry(session) {
  if (session?.state === 'verified' && !session.expiresAt) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TTL_DAYS);
    await WhatsAppSession.update({ expiresAt }, { where: { id: session.id } });
    session.expiresAt = expiresAt;
  }
}

export async function bumpExpiry(phone) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TTL_DAYS);
  await WhatsAppSession.update({ expiresAt }, { where: { phone } });
}

export async function setState(phone, state) {
  await WhatsAppSession.update({ state }, { where: { phone } });
}

export async function getState(phone) {
  const s = await WhatsAppSession.findOne({ where: { phone } });
  return s?.state || 'awaiting_cuit';
}

export async function isLogged(phone) {
  const s = await WhatsAppSession.findOne({ where: { phone } });
  return !!(s && s.state === 'verified' && s.cuit && !isExpired(s));
}

export async function setPending(phone, pending) {
  await WhatsAppSession.update({ pending }, { where: { phone } });
}

export async function getPending(phone) {
  const s = await WhatsAppSession.findOne({ where: { phone } });
  return s?.pending || null;
}

export async function clearPending(phone) {
  await WhatsAppSession.update({ pending: null }, { where: { phone } });
}

export async function logout(phone) {
  await WhatsAppSession.update(
    { state: 'awaiting_cuit', cuit: null, verifiedAt: null, expiresAt: null, pending: null },
    { where: { phone } }
  );
}
