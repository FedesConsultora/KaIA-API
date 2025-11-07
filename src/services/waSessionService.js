// src/services/waSessionService.js
import { WhatsAppSession } from '../models/index.js';

const TTL_DAYS = Number(
  process.env.CUIT_VERIFY_TTL_DAYS ||
  process.env.WHATSAPP_SESSION_TTL_DAYS ||
  60
);

// ⏱️ inactividad para volver al menú (12h por defecto)
const MENU_IDLE_MS = Number(process.env.MENU_IDLE_MS || (12 * 60 * 60 * 1000));
// ⏱️ inactividad para ping de feedback (15m por defecto)
const FEEDBACK_IDLE_MS = Number(process.env.FEEDBACK_IDLE_MS || (15 * 60 * 1000));

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

/** Marca el último mensaje real del usuario */
export async function bumpLastInteraction(phone) {
  const s = await WhatsAppSession.findOne({ where: { phone } });
  const cur = s?.pending || {};
  const reco = { ...(cur.reco || {}), lastInteractionAt: new Date().toISOString() };
  await WhatsAppSession.update({ pending: { ...cur, reco } }, { where: { phone } });
}

function getLastInteractionFromSession(session) {
  return session?.pending?.reco?.lastInteractionAt || null;
}

/* ===== Inactividad → menú ===== */
export function shouldResetToMenu(session) {
  const lastIso = getLastInteractionFromSession(session);
  const base = lastIso ? new Date(lastIso) : new Date(session?.updatedAt || session?.createdAt || Date.now());
  return (Date.now() - base.getTime()) > MENU_IDLE_MS;
}

/* ===== Feedback tras inactividad ===== */
export function shouldPromptFeedback(session) {
  if (session?.feedbackLastPromptAt) return false;
  const lastIso = getLastInteractionFromSession(session);
  const base = lastIso ? new Date(lastIso) : new Date(session?.updatedAt || session?.createdAt || Date.now());
  return (Date.now() - base.getTime()) > FEEDBACK_IDLE_MS;
}

export async function markFeedbackPrompted(phone) {
  await WhatsAppSession.update({ feedbackLastPromptAt: new Date() }, { where: { phone } });
}

/* ===== Contexto de recomendación ===== */
const DEF_SIGNALS = {
  species: null,
  form: null,
  brands: [],
  actives: [],
  indications: [],
  weight_hint: null,
  packs: [],
  negatives: []
};

export async function getReco(phone) {
  const p = await getPending(phone);
  const def = {
    failCount: 0,
    tokens: { must: [], should: [], negate: [] },
    lastQuery: '',
    lastSimilares: [],
    lastShownIds: [],
    signals: { ...DEF_SIGNALS },
    asked: [],
    hops: 0,
    lastInteractionAt: null
  };
  return (p && p.reco) ? deepMergeReco(def, p.reco) : def;
}

export async function setReco(phone, patch) {
  const cur = await getReco(phone);
  const next = deepMergeReco(cur, patch);
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
  if (a?.reco || b?.reco) {
    out.reco = deepMergeReco(a?.reco || {}, b?.reco || {});
  }
  return out;
}

function dedup(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function mergeSignals(a = {}, b = {}) {
  const A = { ...DEF_SIGNALS, ...(a || {}) };
  const B = { ...DEF_SIGNALS, ...(b || {}) };
  return {
    species: B.species ?? A.species ?? null,
    form:    B.form    ?? A.form    ?? null,
    brands:  dedup([...(A.brands||[]), ...(B.brands||[])]),
    actives: dedup([...(A.actives||[]), ...(B.actives||[])]),
    indications: dedup([...(A.indications||[]), ...(B.indications||[])]),
    weight_hint: B.weight_hint ?? A.weight_hint ?? null,
    packs:   dedup([...(A.packs||[]), ...(B.packs||[])]),
    negatives: dedup([...(A.negatives||[]), ...(B.negatives||[])])
  };
}

function mergeTokenSets(a = {}, b = {}) {
  const mergeArr = (x = [], y = []) => Array.from(new Set([...(x||[]), ...(y||[])])).filter(Boolean);
  return {
    must:   mergeArr(a.must,   b.must),
    should: mergeArr(a.should, b.should),
    negate: mergeArr(a.negate, b.negate)
  };
}

function deepMergeReco(a = {}, b = {}) {
  return {
    ...a,
    ...b,
    tokens: mergeTokenSets(a.tokens || {}, b.tokens || {}),
    signals: mergeSignals(a.signals || {}, b.signals || {}),
    asked: dedup([...(a.asked||[]), ...(b.asked||[])]),
    hops: Math.max(a.hops || 0, b.hops || 0)
  };
}

/**
 * Resetea la sesión para volver al menú sin cerrar sesión:
 * - state → 'awaiting_consulta'
 * - pending → null
 */
export async function resetToMenu(phone) {
  await WhatsAppSession.update(
    { state: 'awaiting_consulta', pending: null },
    { where: { phone } }
  );
}
