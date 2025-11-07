// src/services/disambiguationService.js
import 'dotenv/config';
import { recomendarDesdeBBDD } from './recommendationService.js';
import { responderConGPTStrict, extraerTerminosBusqueda } from './gptService.js';
import { t } from '../config/texts.js';
import {
  sendWhatsAppText,
  sendWhatsAppList,
  sendWhatsAppButtons
} from './whatsappService.js';
import {
  getReco, setReco, incRecoFail, resetRecoFail,
  setState, getState, setPending, getPending, clearPending
} from './waSessionService.js';
import { Promocion, Producto } from '../models/index.js';

// ====== Utils de normalización / parse ======
const RX = {
  kg: /\b(\d+(?:[.,]\d+)?)\s*(?:kg|kilo)s?\b/i,
  range: /(\d+(?:[.,]\d+)?)\s*(?:a|-|–|hasta)\s*(\d+(?:[.,]\d+)?)\s*kg/i,
  hasta: /hasta\s*(\d+(?:[.,]\d+)?)\s*kg/i,
  desde: /(desde|>=)\s*(\d+(?:[.,]\d+)?)\s*kg/i,
  pack: /\b(pa?ck|x)\s*(\d{1,2})\b/i,
  forma_pipeta: /pipet|spot[- ]?on|t[oó]pico/i,
  forma_comp: /comprimid|tableta|tabs/i,
  forma_iny: /inyect/i,
  especie_gato: /gato|felin/i,
  especie_perro: /perr|canin/i,
};
const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

function extractWeightLabel(text = '') {
  const t = String(text || '').toLowerCase().replace(',', '.');
  let m = t.match(RX.range); if (m) return `${m[1]}–${m[2]} kg`;
  m = t.match(RX.hasta);     if (m) return `≤${m[1]} kg`;
  m = t.match(RX.desde);     if (m) return `≥${m[2]} kg`;
  m = t.match(RX.kg);        if (m) return `${m[1]} kg`;
  return null;
}
function extractPackLabel(text = '') {
  const m = String(text || '').toLowerCase().match(RX.pack);
  return m ? `x${m[2]}` : null;
}
function looksLikePipeta(query = '', tokens = {}) {
  const q = norm(query);
  if (RX.forma_pipeta.test(q)) return true;
  const s = new Set([...(tokens.must||[]), ...(tokens.should||[])].map(norm));
  for (const w of s) if (/pipet|spot|topico/.test(w)) return true;
  return false;
}
function speciesFromSignals(query = '', tokens = {}) {
  const q = norm(query);
  if (RX.especie_gato.test(q))  return 'gato';
  if (RX.especie_perro.test(q)) return 'perro';
  const s = new Set([...(tokens.must||[]), ...(tokens.should||[])].map(norm));
  if ([...s].some(w => /gat|felin/.test(w)))  return 'gato';
  if ([...s].some(w => /perr|canin/.test(w))) return 'perro';
  return null;
}
function formFromSignals(query = '', tokens = {}) {
  const q = norm(query);
  if (RX.forma_pipeta.test(q)) return 'pipeta';
  if (RX.forma_comp.test(q))   return 'comprimido';
  if (RX.forma_iny.test(q))    return 'inyectable';
  const s = new Set([...(tokens.must||[]), ...(tokens.should||[])].map(norm));
  if ([...s].some(w => /pipet|spot|topico/.test(w))) return 'pipeta';
  if ([...s].some(w => /comprimid|tableta|tabs/.test(w))) return 'comprimido';
  if ([...s].some(w => /inyect/.test(w))) return 'inyectable';
  return null;
}

// ====== Señales ricas (vía GPT si hay) ======
import OpenAI from 'openai';
import { getPromptDisambigExtract } from './promptTemplate.js';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18';
let openai = null;
if (process.env.OPENAI_API_KEY) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extraerSenalesRicas(query) {
  if (!openai) {
    return {
      species: null,
      form: null,
      brands: [],
      actives: [],
      indications: [],
      weight_hint: null,
      packs: [],
      negatives: [],
    };
  }
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: getPromptDisambigExtract() },
        { role: 'user',   content: query }
      ],
      temperature: 0
    });
    let raw = completion.choices?.[0]?.message?.content || '{}';
    raw = raw.trim().replace(/^\s*```json\s*|\s*```\s*$/g, '');
    const parsed = JSON.parse(raw);
    return {
      species: parsed?.species || null,
      form: parsed?.form || null,
      brands: Array.isArray(parsed?.brands) ? parsed.brands : [],
      actives: Array.isArray(parsed?.actives) ? parsed.actives : [],
      indications: Array.isArray(parsed?.indications) ? parsed.indications : [],
      weight_hint: parsed?.weight_hint || null,
      packs: Array.isArray(parsed?.packs) ? parsed.packs : [],
      negatives: Array.isArray(parsed?.negatives) ? parsed.negatives : [],
    };
  } catch (e) {
    console.warn('⚠️ extraerSenalesRicas fallback:', e?.message);
    return {
      species: null, form: null, brands: [], actives: [], indications: [],
      weight_hint: null, packs: [], negatives: []
    };
  }
}

// ====== Agrupación de variantes y plan de desambiguación ======
function baseKey(p) {
  let t = `${norm(p.marca)} ${norm(p.nombre)} ${norm(p.presentacion)}`;
  t = t.replace(RX.range, ' ')
       .replace(RX.hasta, ' ')
       .replace(RX.desde, ' ')
       .replace(RX.kg, ' ')
       .replace(/\b\d+(?:[.,]\d+)?\s*(ml|cc)\b/gi, ' ');
  return t.replace(/\s+/g, ' ').trim();
}

function analyzeVariantDimensions(productos = []) {
  const groups = new Map();
  for (const p of productos) {
    const key = baseKey(p);
    const peso = extractWeightLabel(`${p.nombre} ${p.presentacion}`) || null;
    const pack = extractPackLabel(`${p.nombre} ${p.presentacion}`) || null;
    const marca = p.marca || null;
    const forma = (() => {
      const txt = norm(`${p.nombre} ${p.presentacion} ${p.rubro} ${p.familia}`);
      if (RX.forma_pipeta.test(txt)) return 'pipeta';
      if (RX.forma_comp.test(txt))   return 'comprimido';
      if (RX.forma_iny.test(txt))    return 'inyectable';
      return null;
    })();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ id: p.id, peso, pack, marca, forma, p });
  }

  const sets = { peso: new Set(), pack: new Set(), marca: new Set(), forma: new Set() };
  for (const variants of groups.values()) {
    variants.forEach(v => {
      if (v.peso)  sets.peso.add(v.peso);
      if (v.pack)  sets.pack.add(v.pack);
      if (v.marca) sets.marca.add(v.marca);
      if (v.forma) sets.forma.add(v.forma);
    });
  }

  let needs = { peso: false, pack: false, marca: false, forma: false };
  Object.keys(needs).forEach(k => { if (sets[k].size >= 2) needs[k] = true; });

  return { groups, needs, sets };
}

function pickFirstQuestion({ signals, tokens, productos, consulta }) {
  const especie = signals.species || speciesFromSignals(consulta, tokens);
  const forma   = signals.form || formFromSignals(consulta, tokens);
  const isPipeta = looksLikePipeta(consulta, tokens) || forma === 'pipeta';

  const { needs, sets } = analyzeVariantDimensions(productos);

  // Prioridad de preguntas
  if (!especie) {
    const txt = norm(productos.map(p => `${p.nombre} ${p.presentacion} ${p.familia} ${p.rubro} ${p.observaciones||''}`).join(' | '));
    const hayGato  = RX.especie_gato.test(txt);
    const hayPerro = RX.especie_perro.test(txt);
    if (hayGato && hayPerro) {
      return { type: 'species', title: t('desambig_species_header'), body: t('desambig_species_body') };
    }
  }

  if (isPipeta && needs.peso && !signals.weight_hint) {
    return { type: 'weight', title: t('desambig_peso_header'), body: especie === 'gato' ? t('desambig_peso_body_gato') : t('desambig_peso_body_perro') };
  }

  if (!forma && needs.forma) {
    return { type: 'form', title: t('desambig_form_header'), body: t('desambig_form_body') };
  }

  if (needs.pack && (!signals.packs || !signals.packs.length)) {
    return { type: 'pack', title: t('desambig_pack_header'), body: t('desambig_pack_body') };
  }

  if (needs.marca && (!signals.brands || !signals.brands.length)) {
    return { type: 'brand', title: t('desambig_brand_header'), body: t('desambig_brand_body') };
  }

  // Si no hay necesidad evidente, sugerimos por diversidad (fallback)
  const diversity = [
    { key: 'peso',  size: sets.peso.size,  type: 'weight', title: t('desambig_peso_header'),  body: (especie === 'gato') ? t('desambig_peso_body_gato') : t('desambig_peso_body_perro') },
    { key: 'marca', size: sets.marca.size, type: 'brand',  title: t('desambig_brand_header'), body: t('desambig_brand_body') },
    { key: 'forma', size: sets.forma.size, type: 'form',   title: t('desambig_form_header'),  body: t('desambig_form_body') },
    { key: 'pack',  size: sets.pack.size,  type: 'pack',   title: t('desambig_pack_header'),  body: t('desambig_pack_body') },
  ].sort((a,b) => b.size - a.size);

  const best = diversity.find(d => d.size >= 2);
  if (best) return { type: best.type, title: best.title, body: best.body };

  return null;
}

function toDetailBlock(p) {
  const precio = p.precio ? ` $${Number(p.precio).toFixed(0)}` : '(consultar)';
  const promo  = p.promo?.activa ? `Sí: ${p.promo.nombre}` : 'No';
  return [
    `- Producto sugerido: ${p.nombre}`,
    `- Marca / Presentación: ${p.marca || '—'}${p.presentacion ? ` / ${p.presentacion}` : ''}`,
    `- ¿Tiene promoción?: ${promo}`,
    `- Precio estimado (si aplica): ${precio}`,
    `- ⚠️ Advertencia: Esta sugerencia no reemplaza una indicación clínica.`
  ].join('\n');
}

// ====== Lista interactiva de productos (export) ======
export async function sendProductsList(from, productos, header = null) {
  if (!productos?.length) return;
  const rows = productos.slice(0, 6).map(p => ({
    id: `prod:${p.id}`,
    title: String(p.nombre || 'Producto').slice(0, 24),
    description: [p.marca, p.presentacion, p.promo?.activa ? 'Promo' : ''].filter(Boolean).join(' • ').slice(0, 60)
  }));
  console.log(`[RECO][LIST] to=${from} rows=${rows.length}`);
  await sendWhatsAppList(
    from,
    t('productos_list_body'),
    [{ title: t('productos_list_title'), rows }],
    header || t('productos_select_header'),
    t('btn_elegi')
  );
}

// ====== Ficha completa de producto (export) ======
function pick(p, keys = []) {
  for (const k of keys) {
    if (p[k] != null && String(p[k]).toString().trim() !== '') return String(p[k]);
  }
  return null;
}
function money(val) {
  const n = Number(val);
  return Number.isFinite(n) ? `$${n.toFixed(0)}` : '(consultar)';
}
function formatProductoDetalle(p) {
  const j = typeof p.toJSON === 'function' ? p.toJSON() : p;

  const nombre = pick(j, ['nombre']) || '—';
  const marca  = pick(j, ['marca']) || '—';
  const presentacion = pick(j, ['presentacion']) || '';
  const rubro   = pick(j, ['rubro']);
  const familia = pick(j, ['familia']);
  const especie = pick(j, ['especie']);
  const forma   = pick(j, ['forma', 'presentacion_forma']);
  const contenido = pick(j, ['contenido_neto', 'volumen', 'peso']);
  const unidad = pick(j, ['unidad', 'unidad_medida']);
  const sku    = pick(j, ['sku', 'codigo_sku']);
  const codigo = pick(j, ['codigo', 'codigo_interno']);
  const ean    = pick(j, ['codigo_barras', 'ean']);
  const stock  = pick(j, ['cantidad', 'stock']);
  const precio = pick(j, ['precio']);

  const obs    = pick(j, ['observaciones', 'descripcion', 'notas']);

  const promo = (j.Promocions?.[0]) ? `Sí: ${j.Promocions[0].nombre}` : 'No';

  const lines = [
    `📦 *${nombre}*`,
    presentacion ? `Presentación: ${presentacion}` : null,
    `Marca: ${marca}`,
    rubro ? `Rubro: ${rubro}` : null,
    familia ? `Familia: ${familia}` : null,
    especie ? `Especie: ${especie}` : null,
    forma ? `Forma: ${forma}` : null,
    contenido ? `Contenido: ${contenido}${unidad ? ' ' + unidad : ''}` : null,
    sku ? `SKU: ${sku}` : null,
    codigo ? `Código: ${codigo}` : null,
    ean ? `EAN: ${ean}` : null,
    (precio != null) ? `Precio estimado: ${money(precio)}` : `Precio estimado: (consultar)`,
    stock ? `Stock: ${stock}` : null,
    `¿Promoción?: ${promo}`,
    obs ? `\n📝 *Observaciones*\n${obs}` : null
  ].filter(Boolean);

  return lines.join('\n');
}

export async function openProductDetail(from, productId) {
  const pid = Number(productId);
  if (!Number.isFinite(pid)) {
    await sendWhatsAppText(from, t('producto_open_error'));
    return false;
  }
  const p = await Producto.findByPk(pid, {
    include: [{ model: Promocion, attributes: ['nombre'], required: false }]
  });
  if (!p) {
    await sendWhatsAppText(from, t('producto_open_error'));
    return false;
  }
  const detail = formatProductoDetalle(p);
  await sendWhatsAppText(from, t('producto_ficha_header'));
  await sendWhatsAppText(from, detail);

  try {
    const g = {
      id: p.id,
      nombre: p.nombre,
      marca: p.marca || '',
      presentacion: p.presentacion || '',
      precio: p.precio ? Number(p.precio) : null,
      rubro: p.rubro || '',
      familia: p.familia || '',
      promo: p.Promocions?.[0]
        ? { activa: true, nombre: p.Promocions[0].nombre }
        : { activa: false, nombre: '' },
    };
    const texto = await responderConGPTStrict(p.nombre, { productosValidos: [g], similares: [] });
    if (texto && texto.trim()) {
      await sendWhatsAppText(from, texto.trim());
    }
  } catch (_) {}

  return true;
}

// ====== API principal (muestra lista primero) ======
export async function runDisambiguationOrRecommend({ from, nombre, consulta }) {
  const tokensPrev = await getReco(from);
  const tokensNew = await extraerTerminosBusqueda(consulta);
  const mergedTokens = {
    must:   Array.from(new Set([...(tokensPrev?.tokens?.must || []), ...(tokensNew?.must || [])])),
    should: Array.from(new Set([...(tokensPrev?.tokens?.should || []), ...(tokensNew?.should || [])])),
    negate: Array.from(new Set([...(tokensPrev?.tokens?.negate || []), ...(tokensNew?.negate || [])]))
  };

  // Señales ricas (GPT → species/form/actives/brands/weight/pack)
  const signals = await extraerSenalesRicas(consulta);

  // Buscar
  const { validos = [], similares = [] } = await recomendarDesdeBBDD(consulta, { gpt: mergedTokens, signals });
  const candidatos = [...validos, ...similares];

  console.log(`[RECO][ITER] query="${consulta}" -> validos=${validos.length} similares=${similares.length} total=${candidatos.length}`);

  if (!validos.length) {
    const after = await incRecoFail(from);
    if ((after?.failCount || 0) >= Number(process.env.SEARCH_MAX_FAILS || 5)) {
      await setReco(from, { tokens: mergedTokens, lastQuery: consulta });
      await sendWhatsAppText(from, t('no_match'));
      await sendWhatsAppButtons(from, t('reco_pedir_especie'), [
        { id: 'perro', title: t('btn_perro') },
        { id: 'gato',  title: t('btn_gato') },
        { id: 'volver', title: t('btn_volver') }
      ]);
      return true;
    }
    await setReco(from, { tokens: mergedTokens, lastQuery: consulta });
    await sendWhatsAppText(from, t('no_match'));
    await sendWhatsAppText(from, t('refinar_tip'));
    return true;
  }

  // Reset fails y guardar contexto
  await resetRecoFail(from);
  await setReco(from, {
    tokens: mergedTokens,
    lastQuery: consulta,
    lastShownIds: validos.map(v => v.id),
    lastSimilares: similares.map(s => s.id)
  });

  // ¿Hace falta desambiguar?
  // Si hay más de 6 candidatos o GPT sugiere, preguntar.
  let question = null;
  if (candidatos.length > 6) {
    question = pickFirstQuestion({ signals, tokens: mergedTokens, productos: candidatos, consulta });
  } else {
    question = pickFirstQuestion({ signals, tokens: mergedTokens, productos: candidatos, consulta });
  }

  if (question) {
    const { groups } = analyzeVariantDimensions(candidatos);
    const opts = new Map();
    for (const variants of groups.values()) {
      for (const v of variants) {
        if (question.type === 'weight' && v.peso) opts.set(v.peso, true);
        if (question.type === 'pack'  && v.pack) opts.set(v.pack, true);
        if (question.type === 'brand' && v.marca) opts.set(v.marca, true);
        if (question.type === 'form'  && v.forma) opts.set(v.forma, true);
      }
    }
    if (question.type === 'species') {
      opts.set('gato', true); opts.set('perro', true);
    }
    if (question.type === 'active') {
      opts.set('fipronil', true);
      opts.set('imidacloprid', true);
      opts.set('permethrin', true);
    }
    const rows = [...opts.keys()].slice(0, 6).map(val => ({
      id: `disambig:${question.type}:${String(val)}`,
      title: String(val).slice(0, 24),
      description: undefined
    }));

    console.log(`[RECO][Q] type=${question.type} rows=${rows.length}`);

    await setState(from, 'awaiting_disambig');
    await setPending(from, {
      disambig: {
        question: question.type,
        signals,
        tokens: mergedTokens,
        consulta,
        opciones: rows.map(r => r.id)
      }
    });

    await sendWhatsAppList(
      from,
      question.body,
      [{ title: question.title, rows }],
      question.title,
      t('btn_elegi')
    );
    return true;
  }

  // Lista final (siempre primero). Preferimos 3–4, tope 6.
  await sendProductsList(from, validos, t('productos_select_header'));
  return true;
}

// ====== Resolver una respuesta de desambiguación ======
export async function handleDisambigAnswer(from, answerIdOrText) {
  const id = String(answerIdOrText || '').trim();
  const p = await getPending(from);
  const d = p?.disambig;
  if (!d) return false;

  let type = null, value = null;
  if (/^disambig:/.test(id)) {
    const [, t, ...rest] = id.split(':');
    type = t;
    value = rest.join(':');
  } else {
    type = d.question;
    value = String(answerIdOrText).trim();
  }

  const signals = { ...(d.signals || {}) };
  if (type === 'species') signals.species = norm(value);
  if (type === 'form')    signals.form    = norm(value);
  if (type === 'weight')  signals.weight_hint = value;
  if (type === 'brand')   signals.brands  = [value];
  if (type === 'pack')    signals.packs   = [value];
  if (type === 'active')  signals.actives = [value];

  await clearPending(from);
  await setState(from, 'awaiting_consulta');

  const extraShould = [];
  if (signals.species) extraShould.push(signals.species);
  if (signals.form)    extraShould.push(signals.form);
  (signals.brands || []).forEach(b => extraShould.push(b));
  (signals.packs  || []).forEach(px => extraShould.push(px));
  if (signals.weight_hint) extraShould.push(signals.weight_hint);
  const extraMust = (signals.actives || []).map(norm);

  const prev = await getReco(from);
  const mergedTokens = {
    must:   Array.from(new Set([...(prev?.tokens?.must || []), ...extraMust])),
    should: Array.from(new Set([...(prev?.tokens?.should || []), ...extraShould])),
    negate: Array.from(new Set([...(prev?.tokens?.negate || [])]))
  };

  console.log(`[RECO][ANS] type=${type} value="${value}"`);

  await setReco(from, {
    tokens: mergedTokens,
    lastQuery: d.consulta
  });

  return runDisambiguationOrRecommend({ from, nombre: '', consulta: d.consulta });
}
