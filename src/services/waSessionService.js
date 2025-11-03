// src/services/waSessionService.js
// ----------------------------------------------------
import { WhatsAppSession } from '../models/index.js';

const TTL_DAYS = Number(
  process.env.CUIT_VERIFY_TTL_DAYS ||
  process.env.WHATSAPP_SESSION_TTL_DAYS ||
  60
);

// ⏱️ inactividad para volver al menú (pide 12h)
const MENU_IDLE_MS = Number(process.env.MENU_IDLE_MS || (12 * 60 * 60 * 1000)); // 12h

// ⏱️ inactividad para pedir feedback (guía funcional lo contempla)
const FEEDBACK_IDLE_MS = Number(process.env.FEEDBACK_IDLE_MS || (15 * 60 * 1000)); // 15m

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
  return !!(s && s.cuit && !isExpired(s));
}

export async function setPending(phone, pending) {
  // ⚠️ Mantener compatibilidad: si otro código llama setPending, mergeamos
  const s = await WhatsAppSession.findOne({ where: { phone } });
  const cur = s?.pending || {};
  const next = mergePendingObjects(cur, pending);
  await WhatsAppSession.update({ pending: next }, { where: { phone } });
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

/* ===== Inactividad → menú ===== */
export function shouldResetToMenu(session) {
  const last = new Date(session?.updatedAt || session?.createdAt || Date.now());
  return (Date.now() - last.getTime()) > MENU_IDLE_MS;
}

export async function resetToMenu(phone) {
  await WhatsAppSession.update(
    { state: 'menu_idle', pending: null },
    { where: { phone } }
  );
}

/* ===== Feedback tras inactividad ===== */
export function shouldPromptFeedback(session) {
  if (session?.feedbackLastPromptAt) return false;
  const last = new Date(session?.updatedAt || session?.createdAt || Date.now());
  return (Date.now() - last.getTime()) > FEEDBACK_IDLE_MS;
}

export async function markFeedbackPrompted(phone) {
  await WhatsAppSession.update({ feedbackLastPromptAt: new Date() }, { where: { phone } });
}

/* ===== Contexto de recomendación (sin migraciones) =====
   Guardamos bajo pending.reco para no tocar schema. */
export async function getReco(phone) {
  const p = await getPending(phone);
  const def = { failCount: 0, tokens: { must: [], should: [], negate: [] }, lastQuery: '', lastSimilares: [], lastShownIds: [] };
  return (p && p.reco) ? { ...def, ...p.reco } : def;
}

export async function setReco(phone, patch) {
  const cur = await getReco(phone);
  const next = {
    ...cur,
    ...patch,
    tokens: mergeTokenSets(cur.tokens, patch.tokens || {})
  };
  await setPending(phone, { reco: next });
  return next;
}

export async function incRecoFail(phone) {
  const cur = await getReco(phone);
  return setReco(phone, { failCount: (cur.failCount || 0) + 1 });
}

export async function resetRecoFail(phone) {
  const cur = await getReco(phone);
  if (!cur.failCount) return cur;
  return setReco(phone, { failCount: 0 });
}

/* ===== Utils ===== */
function mergePendingObjects(a, b) {
  const out = { ...(a || {}) , ...(b || {}) };
  // mezclar reco sin pisar
  if (a?.reco || b?.reco) {
    out.reco = {
      ...(a?.reco || {}),
      ...(b?.reco || {}),
      tokens: mergeTokenSets(a?.reco?.tokens || {}, b?.reco?.tokens || {})
    };
  }
  return out;
}

function mergeTokenSets(a = {}, b = {}) {
  const mergeArr = (x = [], y = []) => Array.from(new Set([...(x||[]), ...(y||[])])).filter(Boolean);
  return {
    must:   mergeArr(a.must,   b.must),
    should: mergeArr(a.should, b.should),
    negate: mergeArr(a.negate, b.negate)
  };
}
