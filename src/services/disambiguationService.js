// src/services/disambiguationService.js
import 'dotenv/config';
import { recomendarDesdeBBDD } from './recommendationService.js';
import { responderConGPTStrict, extraerTerminosBusqueda } from './gptService.js';
import { t } from '../config/texts.js';
import {
  getReco, setReco, incRecoFail, resetRecoFail,
  setState, getState, setPending, getPending,
  clearPendingKey, // limpiar solo 'disambig'
  getOrCreateSession
} from './waSessionService.js';
import {
  sendWhatsAppText,
  sendWhatsAppList,
  sendWhatsAppButtons
} from './whatsappService.js';
import { Promocion, Producto } from '../models/index.js';
import { calcularPrecioConDescuento } from './pricingService.js';

import OpenAI from 'openai';
import { getPromptDisambigExtract } from './promptTemplate.js';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18';
let openai = null;
if (process.env.OPENAI_API_KEY) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ===== Config =====
const FIRST_LIST_THRESHOLD = Number(process.env.RECO_FIRST_LIST_THRESHOLD || 10); // si ≤10: listar directo
const MAX_HOPS = Number(process.env.RECO_MAX_HOPS || 2);             // desambiguaciones “normales”
const SAFE_LIST_MAX = Number(process.env.RECO_SAFE_LIST_MAX || 10);       // límite duro WABA
const GPT_SUMMARY_ON_SMALL = process.env.RECO_GPT_SUMMARY_ON_SMALL !== '0';      // opcional

// ====== Utils de normalización / parse ======
const RX = {
  kg: /\b(\d+(?:[.,]\d+)?)\s*(?:kg|kilo)s?\b/i,
  range: /(\d+(?:[.,]\d+)?)\s*(?:a|-|–|hasta)\s*(\d+(?:[.,]\d+)?)\s*kg/i,
  hasta: /≤?\s*hasta\s*(\d+(?:[.,]\d+)?)\s*kg/i,
  desde: /(desde|>=)\s*(\d+(?:[.,]\d+)?)\s*kg/i,
  pack: /\b(pa?ck|x)\s*(\d{1,2})\b/i,
  forma_pipeta: /pipet|spot[- ]?on|t[oó]pico/i,
  forma_comp: /comprimid|tableta|tabs/i,
  forma_iny: /inyect/i,
  especie_gato: /\b(gato|felin[oa]s?)\b/i,
  especie_perro: /\b(perr[oa]s?|canin[oa]s?)\b/i,
};

const NORM = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

function normalizeNumber(n) {
  const x = String(n).replace(',', '.').trim();
  return x.replace(/^0+(\d)/, '$1');
}
function normalizeWeightLabel(text = '') {
  const t = String(text || '').toLowerCase().replace(',', '.').trim();
  let m = t.match(RX.range); if (m) return `${normalizeNumber(m[1])}–${normalizeNumber(m[2])} kg`;
  m = t.match(RX.hasta); if (m) return `≤${normalizeNumber(m[1])} kg`;
  m = t.match(RX.desde); if (m) return `≥${normalizeNumber(m[2])} kg`;
  m = t.match(RX.kg); if (m) return `${normalizeNumber(m[1])} kg`;
  return null;
}
function extractPackLabel(text = '') {
  const m = String(text || '').toLowerCase().match(RX.pack);
  return m ? `x${m[2]}` : null;
}
function looksLikePipeta(query = '', tokens = {}) {
  const q = NORM(query);
  if (RX.forma_pipeta.test(q)) return true;
  const s = new Set([...(tokens.must || []), ...(tokens.should || [])].map(NORM));
  for (const w of s) if (/pipet|spot|topico/.test(w)) return true;
  return false;
}
function hardSpeciesInQuery(query = '') {
  const q = NORM(query);
  if (RX.especie_gato.test(q)) return 'gato';
  if (RX.especie_perro.test(q)) return 'perro';
  return null;
}

// ====== Señales ricas (GPT) ======
async function extraerSenalesRicas(query) {
  if (!openai) {
    return {
      species: null, form: null, brands: [], actives: [], indications: [],
      weight_hint: null, packs: [], negatives: []
    };
  }
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: getPromptDisambigExtract() },
        { role: 'user', content: query }
      ],
      temperature: 0
    });
    let raw = completion.choices?.[0]?.message?.content || '{}';
    raw = raw.trim().replace(/^\s*```json\s*|\s*```\s*$/g, '');
    const parsed = JSON.parse(raw);
    const weight = normalizeWeightLabel(parsed?.weight_hint || '');
    return {
      species: parsed?.species || null,
      form: parsed?.form || null,
      brands: Array.isArray(parsed?.brands) ? parsed.brands : [],
      actives: Array.isArray(parsed?.actives) ? parsed.actives : [],
      indications: Array.isArray(parsed?.indications) ? parsed.indications : [],
      weight_hint: weight,
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

// ====== Agrupación y plan de desambiguación ======
function baseKey(p) {
  let t = `${NORM(p.marca)} ${NORM(p.nombre)} ${NORM(p.presentacion)}`;
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
    const peso = normalizeWeightLabel(`${p.nombre} ${p.presentacion}`) || null;
    const pack = extractPackLabel(`${p.nombre} ${p.presentacion}`) || null;
    const marca = p.marca || null;
    const forma = (() => {
      const txt = NORM(`${p.nombre} ${p.presentacion} ${p.rubro} ${p.familia}`);
      if (RX.forma_pipeta.test(txt)) return 'pipeta';
      if (RX.forma_comp.test(txt)) return 'comprimido';
      if (RX.forma_iny.test(txt)) return 'inyectable';
      return null;
    })();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ id: p.id, peso, pack, marca, forma, p });
  }

  const sets = { peso: new Set(), pack: new Set(), marca: new Set(), forma: new Set() };
  for (const variants of groups.values()) {
    variants.forEach(v => {
      if (v.peso) sets.peso.add(v.peso);
      if (v.pack) sets.pack.add(v.pack);
      if (v.marca) sets.marca.add(v.marca);
      if (v.forma) sets.forma.add(v.forma);
    });
  }

  let needs = { peso: false, pack: false, marca: false, forma: false };
  Object.keys(needs).forEach(k => { if (sets[k].size >= 2) needs[k] = true; });

  return { groups, needs, sets };
}

function pickFirstQuestion({ signals, tokens, productos, consulta, asked = [] }) {
  const explicitSpecies = hardSpeciesInQuery(consulta);
  const especie = signals.species || explicitSpecies || null;
  const forma = signals.form || null;
  const isPipeta = looksLikePipeta(consulta, tokens) || forma === 'pipeta';

  const { needs, sets } = analyzeVariantDimensions(productos);
  const already = new Set(asked || []);

  const txt = NORM(productos.map(p => `${p.nombre} ${p.presentacion} ${p.familia} ${p.rubro} ${p.observaciones || ''}`).join(' | '));
  const hayGato = RX.especie_gato.test(txt);
  const hayPerro = RX.especie_perro.test(txt);

  if (!especie && !already.has('species')) {
    if (hayGato && hayPerro) {
      return { type: 'species', title: t('desambig_species_header'), body: t('desambig_species_body') };
    }
  }

  const especieBody = especie || (hayGato && !hayPerro ? 'gato' : hayPerro && !hayGato ? 'perro' : null);

  if (isPipeta && needs.peso && !signals.weight_hint && !already.has('weight')) {
    return {
      type: 'weight',
      title: t('desambig_peso_header'),
      body: (especieBody === 'gato') ? t('desambig_peso_body_gato') : t('desambig_peso_body_perro')
    };
  }

  if (!forma && needs.forma && !already.has('form')) {
    return { type: 'form', title: t('desambig_form_header'), body: t('desambig_form_body') };
  }

  if (needs.pack && (!signals.packs || !signals.packs.length) && !already.has('pack')) {
    return { type: 'pack', title: t('desambig_pack_header'), body: t('desambig_pack_body') };
  }

  if (needs.marca && (!signals.brands || !signals.brands.length) && !already.has('brand')) {
    return { type: 'brand', title: t('desambig_brand_header'), body: t('desambig_brand_body') };
  }

  const diversity = [
    { key: 'peso', size: sets.peso.size, type: 'weight', title: t('desambig_peso_header'), body: (especieBody === 'gato') ? t('desambig_peso_body_gato') : t('desambig_peso_body_perro') },
    { key: 'marca', size: sets.marca.size, type: 'brand', title: t('desambig_brand_header'), body: t('desambig_brand_body') },
    { key: 'forma', size: sets.forma.size, type: 'form', title: t('desambig_form_header'), body: t('desambig_form_body') },
    { key: 'pack', size: sets.pack.size, type: 'pack', title: t('desambig_pack_header'), body: t('desambig_pack_body') },
  ]
    .filter(d => !already.has(d.type))
    .sort((a, b) => b.size - a.size);

  const best = diversity.find(d => d.size >= 2);
  if (best) return { type: best.type, title: best.title, body: best.body };

  return null;
}

function pick(v, keys = []) {
  for (const k of keys) {
    if (v[k] != null && String(v[k]).toString().trim() !== '') return String(v[k]);
  }
  return null;
}
function money(val) {
  const n = Number(val);
  return Number.isFinite(n) ? `$${n.toFixed(0)}` : '(consultar)';
}
async function formatProductoDetalle(p, usuarioId = null) {
  const j = typeof p.toJSON === 'function' ? p.toJSON() : p;

  const nombre = pick(j, ['nombre']) || '—';
  const marca = pick(j, ['marca']) || '—';
  const presentacion = pick(j, ['presentacion']) || '';
  const rubro = pick(j, ['rubro']);
  const familia = pick(j, ['familia']);
  const especie = pick(j, ['especie']);
  const forma = pick(j, ['forma', 'presentacion_forma']);
  const contenido = pick(j, ['contenido_neto', 'volumen', 'peso']);
  const unidad = pick(j, ['unidad', 'unidad_medida']);
  const sku = pick(j, ['sku', 'codigo_sku']);
  const codigo = pick(j, ['codigo', 'codigo_interno']);
  const ean = pick(j, ['codigo_barras', 'ean']);

  // Calcular precio con descuento si el usuario tiene condiciones
  let precio = j.precio;
  if (usuarioId && precio) {
    try {
      const resultado = await calcularPrecioConDescuento({ producto: j, usuarioId });
      precio = resultado.precioFinal;
    } catch (e) {
      console.warn('Error calculando precio con descuento:', e);
      precio = j.precio;
    }
  }

  const obs = pick(j, ['observaciones', 'descripcion', 'notas']);

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
    (precio != null) ? `Precio: ${money(precio)}` : `Precio: (consultar)`,
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

  // Obtener usuario para calcular precio con descuento
  const session = await getOrCreateSession(from);
  const usuarioId = session?.Usuario?.id || null;

  const detail = await formatProductoDetalle(p, usuarioId);
  await sendWhatsAppText(from, t('producto_ficha_header'));
  await sendWhatsAppText(from, detail);

  try {
    // Calcular precio con descuento para GPT también
    let precioFinal = p.precio ? Number(p.precio) : null;
    if (usuarioId && precioFinal) {
      try {
        const resultado = await calcularPrecioConDescuento({ producto: p, usuarioId });
        precioFinal = resultado.precioFinal;
      } catch (e) {
        console.warn('Error calculando precio para GPT:', e);
        precioFinal = p.precio ? Number(p.precio) : null;
      }
    }

    const g = {
      id: p.id,
      nombre: p.nombre,
      marca: p.marca || '',
      presentacion: p.presentacion || '',
      precio: precioFinal,
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
  } catch (_) { }

  return true;
}

// ===== Quick summary GPT cuando el universo es chico =====
async function sendGptQuickReply(from, consulta, productosValidos = []) {
  if (!GPT_SUMMARY_ON_SMALL) return;
  try {
    if (!productosValidos?.length) return;
    const texto = await responderConGPTStrict(consulta, {
      productosValidos: productosValidos.slice(0, 3), // Top 1–3
      similares: []
    });
    if (texto && texto.trim()) await sendWhatsAppText(from, texto.trim());
  } catch (_) { }
}

// ===== Lista de productos (capada a 10 filas) =====
export async function sendProductsList(from, productos, header = null) {
  if (!productos?.length) return;
  const prods = productos.slice(0, SAFE_LIST_MAX);
  const rows = prods.map(p => ({
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

/* ====== Filtro: no meter especie “fantasma” si el usuario no la dijo ====== */
function scrubSpuriousSpeciesTokens(mergedTokens, consulta, signals) {
  const explicit = hardSpeciesInQuery(consulta);
  const locked = signals?.species || null;
  if (explicit || locked) return mergedTokens;

  const blacklist = new Set(['gato', 'gatos', 'felino', 'felinos', 'perro', 'perros', 'canino', 'caninos']);
  const should = (mergedTokens.should || []).filter(x => !blacklist.has(NORM(x)));
  return { ...mergedTokens, should };
}

// ====== API principal (muestra lista primero) ======
export async function runDisambiguationOrRecommend({ from, nombre, consulta }) {
  const prev = await getReco(from);

  // 1) Tokens desde texto + merge con prev
  const tokensNew = await extraerTerminosBusqueda(consulta);
  let mergedTokens = {
    must: Array.from(new Set([...(prev?.tokens?.must || []), ...(tokensNew?.must || [])])),
    should: Array.from(new Set([...(prev?.tokens?.should || []), ...(tokensNew?.should || [])])),
    negate: Array.from(new Set([...(prev?.tokens?.negate || []), ...(tokensNew?.negate || [])]))
  };

  // 2) Señales ricas (GPT) + merge con señales persistidas
  const signalsNew = await extraerSenalesRicas(consulta);
  const signals = {
    species: prev.signals?.species ?? signalsNew.species ?? null,
    form: prev.signals?.form ?? signalsNew.form ?? null,
    brands: Array.from(new Set([...(prev.signals?.brands || []), ...(signalsNew.brands || [])])),
    actives: Array.from(new Set([...(prev.signals?.actives || []), ...(signalsNew.actives || [])])),
    indications: Array.from(new Set([...(prev.signals?.indications || []), ...(signalsNew.indications || [])])),
    weight_hint: prev.signals?.weight_hint ?? signalsNew.weight_hint ?? null,
    packs: Array.from(new Set([...(prev.signals?.packs || []), ...(signalsNew.packs || [])])),
    negatives: Array.from(new Set([...(prev.signals?.negatives || []), ...(signalsNew.negatives || [])])),
  };

  // 3) No asumir especie si no fue explícita ni está lockeada
  mergedTokens = scrubSpuriousSpeciesTokens(mergedTokens, consulta, signals);

  // Guardamos contexto actualizado
  await setReco(from, { tokens: mergedTokens, lastQuery: consulta, signals });

  // Obtener usuario para calcular precios con descuento
  const session = await getOrCreateSession(from);
  const usuarioId = session?.Usuario?.id || null;

  // 4) Buscar candidatos (con usuarioId para precios)
  const { validos = [], similares = [] } = await recomendarDesdeBBDD(consulta, { gpt: mergedTokens, signals, usuarioId });
  const candidatos = [...validos, ...similares];

  console.log(`[RECO][ITER] query="${consulta}" -> validos=${validos.length} similares=${similares.length} total=${candidatos.length}`);

  if (!validos.length) {
    const after = await incRecoFail(from);
    if ((after?.failCount || 0) >= Number(process.env.SEARCH_MAX_FAILS || 5)) {
      await sendWhatsAppText(from, t('no_match'));
      await sendWhatsAppButtons(from, t('reco_pedir_especie'), [
        { id: 'perro', title: t('btn_perro') },
        { id: 'gato', title: t('btn_gato') },
        { id: 'volver', title: t('btn_volver') }
      ]);
      return true;
    }
    await sendWhatsAppText(from, t('no_match'));
    await sendWhatsAppText(from, t('refinar_tip'));
    return true;
  }

  // Reset fails y guardar ids mostrados
  await resetRecoFail(from);
  await setReco(from, {
    lastShownIds: validos.map(v => v.id),
    lastSimilares: similares.map(s => s.id)
  });

  const hops = prev.hops || 0;
  const asked = prev.asked || [];

  // 1 candidato → ficha + GPT
  if (candidatos.length === 1) {
    await openProductDetail(from, candidatos[0].id);
    await setState(from, 'awaiting_consulta');
    return true;
  }

  // REGLA 1: pocos candidatos → listar TODO (cap a 10) + mini-resumen GPT
  if (candidatos.length <= FIRST_LIST_THRESHOLD) {
    await sendWhatsAppText(from, t('mostrando_todos', { total: Math.min(candidatos.length, SAFE_LIST_MAX) }));
    await sendProductsList(from, candidatos, t('productos_select_header'));
    await setState(from, 'awaiting_consulta');
    await sendGptQuickReply(from, consulta, validos);
    return true;
  }

  // Muchos: ¿conviene desambiguar?
  let question = pickFirstQuestion({
    signals,
    tokens: mergedTokens,
    productos: candidatos,
    consulta,
    asked
  });

  // REGLA 2: máximo de hops “normales”
  if (hops >= MAX_HOPS) {
    if (candidatos.length <= SAFE_LIST_MAX) {
      await sendWhatsAppText(from, t('mostrando_todos', { total: candidatos.length }));
      await sendProductsList(from, candidatos, t('productos_select_header'));
      await setState(from, 'awaiting_consulta');
      await sendGptQuickReply(from, consulta, validos);
      return true;
    }

    // Una pregunta extra “inteligente”
    if (question) {
      const { groups } = analyzeVariantDimensions(candidatos);
      const opts = new Set();
      for (const variants of groups.values()) {
        for (const v of variants) {
          if (question.type === 'weight' && v.peso) opts.add(v.peso);
          if (question.type === 'pack' && v.pack) opts.add(v.pack);
          if (question.type === 'brand' && v.marca) opts.add(v.marca);
          if (question.type === 'form' && v.forma) opts.add(v.forma);
        }
      }
      if (question.type === 'species') { opts.add('gato'); opts.add('perro'); }

      const rows = Array.from(opts).map(val => ({
        id: `disambig:${question.type}:${String(val)}`,
        title: String(val).slice(0, 24),
        description: undefined
      }));

      console.log(`[RECO][Q-OVERFLOW] type=${question.type} rows=${rows.length}`);

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
      await setReco(from, { asked: Array.from(new Set([...(asked || []), question.type])) });

      await sendWhatsAppList(
        from,
        question.body,
        [{ title: question.title, rows }],
        question.title,
        t('btn_elegi')
      );
      return true;
    }

    // Sin pregunta útil → mostrar hasta el máximo y sugerir refinar
    await sendWhatsAppText(from, t('muchos_resultados', { total: candidatos.length, max: SAFE_LIST_MAX, shown: SAFE_LIST_MAX }));
    await sendProductsList(from, candidatos.slice(0, SAFE_LIST_MAX), t('productos_select_header'));
    await setState(from, 'awaiting_consulta');
    return true;
  }

  // Aún podemos desambiguar normalmente
  if (question) {
    const { groups } = analyzeVariantDimensions(candidatos);
    const opts = new Set();
    for (const variants of groups.values()) {
      for (const v of variants) {
        if (question.type === 'weight' && v.peso) opts.add(v.peso);
        if (question.type === 'pack' && v.pack) opts.add(v.pack);
        if (question.type === 'brand' && v.marca) opts.add(v.marca);
        if (question.type === 'form' && v.forma) opts.add(v.forma);
      }
    }
    if (question.type === 'species') { opts.add('gato'); opts.add('perro'); }

    const rows = Array.from(opts).map(val => ({
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
    await setReco(from, { asked: Array.from(new Set([...(asked || []), question.type])), hops: hops + 1 });

    await sendWhatsAppList(
      from,
      question.body,
      [{ title: question.title, rows }],
      question.title,
      t('btn_elegi')
    );
    return true;
  }

  // Sin más preguntas → mostrar lista final
  if (candidatos.length <= SAFE_LIST_MAX) {
    await sendWhatsAppText(from, t('mostrando_todos', { total: candidatos.length }));
    await sendProductsList(from, candidatos, t('productos_select_header'));
    await sendGptQuickReply(from, consulta, validos);
  } else {
    await sendWhatsAppText(from, t('muchos_resultados', { total: candidatos.length, max: SAFE_LIST_MAX, shown: SAFE_LIST_MAX }));
    await sendProductsList(from, candidatos.slice(0, SAFE_LIST_MAX), t('productos_select_header'));
  }
  await setState(from, 'awaiting_consulta');
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

  const newSignals = { ...(d.signals || {}) };
  const mustByAnswer = []; // <— elecciones explícitas pasan a MUST

  if (type === 'species') { newSignals.species = NORM(value); if (newSignals.species) mustByAnswer.push(newSignals.species); }
  if (type === 'form') { newSignals.form = NORM(value); if (newSignals.form) mustByAnswer.push(newSignals.form); }
  if (type === 'weight') {
    newSignals.weight_hint = normalizeWeightLabel(value);
    if (newSignals.weight_hint) mustByAnswer.push(newSignals.weight_hint);
  }
  if (type === 'brand') {
    newSignals.brands = Array.from(new Set([...(newSignals.brands || []), value]));
    mustByAnswer.push(value);
  }
  if (type === 'pack') {
    newSignals.packs = Array.from(new Set([...(newSignals.packs || []), value]));
    mustByAnswer.push(value);
  }
  if (type === 'active') newSignals.actives = Array.from(new Set([...(newSignals.actives || []), value]));

  // limpiar SOLO 'disambig'
  await clearPendingKey(from, 'disambig');
  await setState(from, 'awaiting_consulta');

  // Merge señales + tokens al reco y continuar
  const prev = await getReco(from);
  const extraShould = [];
  if (newSignals.species) extraShould.push(newSignals.species);
  if (newSignals.form) extraShould.push(newSignals.form);
  (newSignals.brands || []).forEach(b => extraShould.push(b));
  (newSignals.packs || []).forEach(px => extraShould.push(px));
  if (newSignals.weight_hint) extraShould.push(newSignals.weight_hint);

  // MUST ahora incluye principios activos + la elección explícita
  const extraMust = [
    ...(newSignals.actives || []),
    ...mustByAnswer
  ].map(NORM);

  const mergedTokens = {
    must: Array.from(new Set([...(prev?.tokens?.must || []), ...extraMust])),
    should: Array.from(new Set([...(prev?.tokens?.should || []), ...extraShould])),
    negate: Array.from(new Set([...(prev?.tokens?.negate || [])]))
  };

  const newAsked = Array.from(new Set([...(prev?.asked || []), type]));

  await setReco(from, {
    tokens: mergedTokens,
    signals: newSignals,
    asked: newAsked
  });

  console.log(`[RECO][ANS] type=${type} value="${value}"`);

  return runDisambiguationOrRecommend({ from, nombre: '', consulta: d.consulta });
}