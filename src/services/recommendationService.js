// src/services/recommendationService.js
import { Op } from 'sequelize';
import { Producto, Promocion } from '../models/index.js';

// 🔍 DEBUG ALWAYS ON para desambiguación
const DEBUG = true;

const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

const SYN = {
  pipetas: ['pipeta', 'pipetas', 'spot on', 'spot-on', 'antiparasitario', 'antiparasitarios'],
  gatos: ['gato', 'gatos', 'felino', 'felinos'],
  perros: ['perro', 'perros', 'canino', 'caninos'],
  condroprotectores: [
    'condroprotector', 'condroprotectores',
    'glucosamina', 'sulfato de condroitina', 'condroitina',
    'hialuronato', 'ácido hialurónico', 'hialuronico', 'msm',
    'perna canaliculus', 'cartilago', 'cartílago'
  ],
};

const LIKE_FIELDS = ['nombre', 'presentacion', 'marca', 'rubro', 'familia', 'observaciones'];

function expandTerms(raw) {
  const toks = norm(raw).split(/\s+/).filter(Boolean);
  const out = new Set(toks);
  for (const t of toks) {
    for (const [k, arr] of Object.entries(SYN)) {
      if (k === t || arr.includes(t)) arr.forEach((x) => out.add(x));
    }
  }
  return Array.from(out);
}

/**
 * Convierte un producto a formato para GPT, aplicando descuentos si usuarioId está disponible
 * @param {Object} p - Producto
 * @param {number|null} usuarioId - ID del usuario (opcional)
 * @returns {Promise<Object>} Producto formateado para GPT
 */
export async function toGPTProduct(p, usuarioId = null) {
  let precio = p.precio ? Number(p.precio) : null;

  // Si hay usuarioId y precio, intentar calcular descuento
  if (usuarioId && precio) {
    try {
      const { calcularPrecioConDescuento } = await import('./pricingService.js');
      const resultado = await calcularPrecioConDescuento({ producto: p, usuarioId });
      precio = resultado.precioFinal;
    } catch (e) {
      // En caso de error, usar precio de lista
      console.warn('Error calculando descuento en toGPTProduct:', e);
    }
  }

  return {
    id: p.id,
    nombre: p.nombre,
    marca: p.marca || '',
    presentacion: p.presentacion || '',
    precio,
    rubro: p.rubro || '',
    familia: p.familia || '',
    promo: p.Promocions?.[0]
      ? { activa: true, nombre: p.Promocions[0].nombre }
      : { activa: false, nombre: '' },
  };
}

function logDiversity(tag, arr = []) {
  const weights = new Set();
  const packs = new Set();
  const brands = new Set();
  const forms = new Set();
  for (const p of arr) {
    const txt = norm(`${p.nombre} ${p.presentacion} ${p.rubro} ${p.familia} ${p.observaciones || ''}`);
    const w = (txt.match(/\b(\d+(?:[.,]\d+)?)\s*(?:a|-|–|hasta)\s*(\d+(?:[.,]\d+)?)\s*kg\b/i) ||
      txt.match(/hasta\s*(\d+(?:[.,]\d+)?)\s*kg\b/i) ||
      txt.match(/\b(\d+(?:[.,]\d+)?)\s*kg\b/i)) ? 'peso' : null;
    if (w) weights.add('peso');

    const mPack = txt.match(/\bx\s*(\d{1,2})\b/i);
    if (mPack) packs.add(`x${mPack[1]}`);

    if (/\bpipet|spot[- ]?on|t[oó]pico\b/i.test(txt)) forms.add('pipeta');
    else if (/\bcomprimid|tableta|tabs\b/i.test(txt)) forms.add('comprimido');
    else if (/\binyect\b/i.test(txt)) forms.add('inyectable');

    if (p.marca) brands.add(norm(p.marca));
  }
  console.log(`[RECO][STATS] ${tag} :: candidatos=${arr.length} | marcas=${brands.size} | formas=${forms.size} | packs=${packs.size} | pesos=${weights.size}`);
}

/* ========= Matching robusto para peso/pack ========= */
function isWeightToken(t = '') { return /\d/.test(t) && /(kg)/i.test(t); }
function weightTokenRegex(t = '') {
  const s = String(t).toLowerCase().replace(/\s+/g, ' ').trim();
  // rangos tipo "2–4 kg" / "2 - 4 kg" / "2 a 4 kg"
  const mR = s.match(/(\d+(?:[.,]\d+)?)\s*(?:–|-|a)\s*(\d+(?:[.,]\d+)?)\s*kg/);
  if (mR) {
    const a = mR[1].replace(',', '[.,]?');
    const b = mR[2].replace(',', '[.,]?');
    return new RegExp(`\\b(?:${a}\\s*(?:kg)?\\s*(?:a|–|-)\\s*${b}\\s*kg|${a}\\s*(?:a|–|-)\\s*${b}\\s*kg)\\b`);
  }
  // hasta / ≤
  const mLe = s.match(/(?:≤|hasta)\s*(\d+(?:[.,]\d+)?)\s*kg/);
  if (mLe) return new RegExp(`\\b(?:≤\\s*)?hasta\\s*${mLe[1]}\\s*kg\\b|\\b≤\\s*${mLe[1]}\\s*kg\\b`);
  // desde / ≥
  const mGe = s.match(/(?:≥|desde)\s*(\d+(?:[.,]\d+)?)\s*kg/);
  if (mGe) return new RegExp(`\\b(?:≥\\s*)?${mGe[1]}\\s*kg\\b|\\bdesde\\s*${mGe[1]}\\s*kg\\b`);
  // número simple "5 kg"
  const mN = s.match(/(\d+(?:[.,]\d+)?)\s*kg/);
  if (mN) return new RegExp(`\\b${mN[1]}\\s*kg\\b`);
  return null;
}
function isPackToken(t = '') {
  const s = String(t).toLowerCase().trim();
  return /^x?\d{1,2}$/.test(s.replace(/\s+/g, '')) || /pack/.test(s);
}
function packTokenRegex(t = '') {
  const n = String(t).toLowerCase().replace(/[^0-9]/g, '');
  if (!n) return null;
  return new RegExp(`\\b(?:x\\s*${n}|pack\\s*(?:de\\s*)?${n})\\b`);
}
function tokenHit(H, t) {
  const tt = norm(t);
  if (!tt) return false;
  if (isWeightToken(tt)) {
    const rx = weightTokenRegex(tt);
    return rx ? rx.test(H) : H.includes(tt);
  }
  if (isPackToken(tt)) {
    const rx = packTokenRegex(tt);
    return rx ? rx.test(H) : H.includes(tt.replace(/^x/, 'x '));
  }
  return H.includes(tt);
}

/**
 * Recomienda desde BBDD con apoyo opcional de tokens GPT y señales ricas.
 * @param {string} termRaw
 * @param {{ gpt?: { must?: string[], should?: string[], negate?: string[] }, signals?: object, usuarioId?: number }} opts
 */
export async function recomendarDesdeBBDD(termRaw = '', opts = {}) {
  const term = (termRaw || '').trim();
  const gpt = opts?.gpt || {};
  const sig = opts?.signals || {};
  const usuarioId = opts?.usuarioId || null;

  const must = Array.from(new Set([
    ...(gpt.must || []).map(norm),
    ...(Array.isArray(sig.actives) ? sig.actives.map(norm) : [])
  ])).filter(Boolean);

  const should = Array.from(new Set([
    ...(gpt.should || []).map(norm),
    ...(sig.species ? [norm(sig.species)] : []),
    ...(sig.form ? [norm(sig.form)] : []),
    ...(Array.isArray(sig.brands) ? sig.brands.map(norm) : []),
    ...(Array.isArray(sig.indications) ? sig.indications.map(norm) : []),
    ...(Array.isArray(sig.packs) ? sig.packs.map(norm) : []),
    ...(sig.weight_hint ? [norm(sig.weight_hint)] : []),
  ])).filter(Boolean);

  const negate = Array.from(new Set([
    ...(gpt.negate || []).map(norm),
    ...(Array.isArray(sig.negatives) ? sig.negatives.map(norm) : [])
  ])).filter(Boolean);

  console.log('🔍 ========== RECOMENDACIÓN INICIO ==========');
  console.log(`📝 BÚSQUEDA: "${term}"`);
  console.log(`👤 Usuario ID: ${usuarioId || 'ninguno'}`);
  console.log(`🎯 SEÑALES GPT:`, {
    must: gpt.must || [],
    should: gpt.should || [],
    negate: gpt.negate || []
  });
  console.log(`🎯 SEÑALES RICAS:`, sig);
  console.log(`📊 FILTROS COMPILADOS:`, {
    must: must,
    should: should.slice(0, 10), // Solo primeros 10
    negate: negate
  });

  if (!term && !must.length && !should.length) {
    console.log('⚠️ Sin términos de búsqueda, retornando vacío');
    return { validos: [], top: null, similares: [] };
  }
  if (/^main\./i.test(term)) {
    console.log(`⚠️ SKIP: term="${term}" (comando main)`);
    return { validos: [], top: null, similares: [] };
  }

  const expanded = expandTerms(term);

  // LIKE dinámico
  const shouldTokens = Array.from(new Set([...expanded, ...should])).filter(Boolean);
  const likeOr = [];
  for (const f of LIKE_FIELDS) {
    for (const t of shouldTokens) likeOr.push({ [f]: { [Op.like]: `%${t}%` } });
  }

  const mustClauses = must.map((t) => ({
    [Op.or]: LIKE_FIELDS.map((f) => ({ [f]: { [Op.like]: `%${t}%` } }))
  }));

  const negateClauses = negate.map((t) => ({
    [Op.and]: LIKE_FIELDS.map((f) => ({ [f]: { [Op.notLike]: `%${t}%` } }))
  }));

  const andClauses = [];
  if (mustClauses.length) andClauses.push(...mustClauses);
  if (negateClauses.length) andClauses.push(...negateClauses);

  const where = {
    visible: true,
    debaja: false,
    ...(likeOr.length ? { [Op.or]: likeOr } : {}),
    ...(andClauses.length ? { [Op.and]: andClauses } : {}),
  };

  console.log(`🔎 SQL WHERE: likeOr=${likeOr.length} cláusulas, andClauses=${andClauses.length} (must=${mustClauses.length}, negate=${negateClauses.length})`);

  const candidatos = await Producto.findAll({
    where,
    include: [{ model: Promocion, attributes: ['nombre'], required: false }],
    limit: 200, // ⬆️ Aumentado de 120 a 200
  });

  console.log(`📦 CANDIDATOS ENCONTRADOS: ${candidatos.length}`);

  // Mostrar diversidad de marcas y rubros
  const marcasEncontradas = [...new Set(candidatos.map(p => p.marca).filter(Boolean))];
  const rubrosEncontrados = [...new Set(candidatos.map(p => p.rubro).filter(Boolean))];
  console.log(`   🏷️  Marcas: ${marcasEncontradas.length} diferentes →`, marcasEncontradas.slice(0, 10));
  console.log(`   📁 Rubros: ${rubrosEncontrados.length} diferentes →`, rubrosEncontrados);

  logDiversity('pre-score', candidatos);

  if (!candidatos.length) {
    console.log('❌ NO SE ENCONTRARON CANDIDATOS');
    return { validos: [], top: null, similares: [] };
  }

  // POST-FILTRO + SCORE con pesos para señales ricas (y penalización por especie opuesta)
  const tokensForHit = Array.from(new Set([...shouldTokens, ...must])).filter(Boolean);

  // 🎯 Detectar categoría de búsqueda (usando término + GPT signals)
  const termLower = term.toLowerCase();
  const buscaAlimento = /\b(comida|alimento|nutricion|balanceado|feed|pienso)\b/i.test(term);
  const buscaPipeta = /\b(pipeta|spot.?on|antipulga|antiparasit|flea|tick|garrapata|pulga)\b/i.test(term);
  const buscaMedicamento = /\b(medicamento|medicina|tratamiento|antibiotico|antiinflamatorio|analgesico)\b/i.test(term);

  console.log(`🔍 CATEGORÍA BÚSQUEDA: alimento=${buscaAlimento}, pipeta=${buscaPipeta}, medicamento=${buscaMedicamento}`);

  const scored = candidatos
    .map((p) => {
      const H = norm([
        p.nombre, p.presentacion, p.marca, p.rubro, p.familia, p.observaciones
      ].filter(Boolean).join(' | '));

      let s = 0;
      let hits = 0;

      // 🏷️ CATEGORIZACIÓN INTELIGENTE del producto
      // Revisa: RUBRO + FAMILIA + OBSERVACIONES

      const esAlimento = /\b(alimento|alimentos|food|feed|nutricion|snacks?|comida)\b/i.test(p.rubro || '') ||
        /\b(alimento|alimentos|food|feed|nutricion)\b/i.test(p.familia || '');

      const esPipeta = /\b(pipeta|spot|topico|antiparasit.*topico)\b/i.test(p.familia || '') ||
        /\b(pipeta|spot.?on)\b/i.test(p.nombre || '') ||
        (/antiparasit/i.test(p.familia || '') && /topico|externo/i.test(p.familia || ''));

      const esMedicamento = /\b(antibiotico|antiinflamatorio|analgesico|antidiarreico|hepatoprotector|cardiovascular)\b/i.test(p.familia || '') ||
        /\b(iny|inyectable|comprimido|suspension|solucion)\b/i.test(p.presentacion || '') ||
        (/medicamento|tratamiento/i.test(p.observaciones || '') && !/alimento/i.test(p.familia || ''));

      // 🎯 BOOST + PENALTY SYSTEM
      if (buscaAlimento) {
        if (esAlimento) {
          s += 15;
          console.log(`   ✅ BOOST ALIMENTO: "${p.nombre}"`);
        } else {
          s -= 25; // ⚠️ HEAVY PENALTY
          console.log(`   ❌ PENALTY (no es alimento): "${p.nombre}" (rubro: ${p.rubro})`);
        }
      }

      if (buscaPipeta) {
        if (esPipeta) {
          s += 15;
          console.log(`   ✅ BOOST PIPETA: "${p.nombre}"`);
        } else {
          s -= 25;
          console.log(`   ❌ PENALTY (no es pipeta): "${p.nombre}"`);
        }
      }

      if (buscaMedicamento) {
        if (esMedicamento) {
          s += 15;
          console.log(`   ✅ BOOST MEDICAMENTO: "${p.nombre}"`);
        } else {
          s -= 25;
          console.log(`   ❌ PENALTY (no es medicamento): "${p.nombre}"`);
        }
      }

      // MUST fuerte (activos, elecciones del usuario)
      for (const t of must) {
        if (t && tokenHit(H, t)) { s += 6; hits++; }
      }
      // SHOULD (consulta + signals generales)
      for (const t of tokensForHit) {
        if (t && tokenHit(H, t)) { s += 2; hits++; }
        if (t && norm(p.nombre).startsWith(norm(t))) s += 1;
      }
      // Negativos
      for (const n of negate) {
        if (n && tokenHit(H, n)) s -= 5;
      }

      // Bonos por señales ricas bien mapeadas
      if (sig.species && H.includes(norm(sig.species))) s += 3;
      if (sig.form && H.includes(norm(sig.form))) s += 3;
      (sig.brands || []).forEach(b => { if (b && H.includes(norm(b))) s += 2; });
      (sig.indications || []).forEach(i => { if (i && H.includes(norm(i))) s += 1; });
      (sig.packs || []).forEach(px => { if (px && tokenHit(H, px)) s += 2; });
      if (sig.weight_hint && tokenHit(H, sig.weight_hint)) s += 3;

      // 💥 PENALIZACIÓN MEJORADA: Especie contrapuesta + pesos sospechosos
      const hasPerro = /\bperr[oa]s?|canin[oa]s?\b/i.test(H);
      const hasGato = /\bgat[oa]s?|felin[oa]s?|cat\b/i.test(H);

      // Detectar pesos grandes (más de 20kg = probablemente perro)
      const pesoGrande = /\b(2[0-9]|[3-9][0-9]|[1-9][0-9]{2,})\s*(kg|kilos?)\b/i.test(p.nombre || '');

      if (sig.species === 'perro' && hasGato && !hasPerro) {
        s -= 15; // Penalización MUY fuerte
        console.log(`   ⚠️ PENALIZADO (especie): "${p.nombre}" (score -15)`);
      }
      if (sig.species === 'gato') {
        if (hasPerro && !hasGato) {
          s -= 15;
          console.log(`   ⚠️ PENALIZADO (especie): "${p.nombre}" (score -15)`);
        }
        if (pesoGrande) {
          s -= 10; // Peso >20kg no es de gato
          console.log(`   ⚠️ PENALIZADO (peso sospechoso): "${p.nombre}" (score -10)`);
        }
      }

      // Disponibilidad leve (NO mostrada al usuario, solo para scoring interno)
      s += (Number(p.cantidad) || 0) / 1000;

      return { p, s, hits, H };
    })
    // 🚫 FILTRO DURO POR MARCA: Solo si la marca NO está en el término de búsqueda original
    //    (evita filtrar cuando usuario busca "Power Gold" directamente)
    .filter(x => {
      if (sig.brands && sig.brands.length > 0) {
        // Si alguna brand está en MUST o en el term original, NO filtrar
        // (significa que el usuario la escribió directamente, no la seleccionó de una lista)
        const brandInSearchTerm = sig.brands.some(b => {
          const normBrand = norm(b);
          return must.some(m => norm(m).includes(normBrand)) || norm(term).includes(normBrand);
        });

        if (brandInSearchTerm) {
          // No filtrar, el usuario buscó esto directamente
          return true;
        }

        // Filtrar: usuario seleccionó marca en desambiguación
        const marcaProducto = norm(x.p.marca || '');
        const marcasPermitidas = sig.brands.map(b => norm(b));
        const match = marcasPermitidas.some(m => marcaProducto.includes(m) || m.includes(marcaProducto));
        if (!match) {
          console.log(`   🚫 FILTRADO POR MARCA: "${x.p.nombre}" (marca: ${x.p.marca}, buscando: ${sig.brands.join(', ')})`);
          return false;
        }
      }
      return true;
    })
    // 🚫 Filtrar productos MUY penalizados (score < -10)
    .filter(x => x.s > -10)
    // Si hay MUST, al menos uno debe matchear (con regex de peso/pack)
    .filter(x => must.length ? must.some(t => t && tokenHit(x.H, t)) : x.hits > 0)
    .sort((a, b) => b.s - a.s);

  console.log(`📊 DESPUÉS DE FILTROS: ${scored.length} productos válidos`);

  if (!scored.length) {
    console.log('❌ NO QUEDARON PRODUCTOS DESPUÉS DE FILTRAR');
    return { validos: [], top: null, similares: [] };
  }

  const ordered = scored.map(x => x.p);
  logDiversity('post-score', ordered);

  console.log(`✅ SCORING COMPLETO: ${scored.length} productos con score > 0`);
  console.log(`   Top 5 scores:`, scored.slice(0, 5).map(x => ({
    nombre: x.p.nombre,
    marca: x.p.marca,
    score: x.s.toFixed(2),
    hits: x.hits
  })));

  // Análisis para desambiguación
  const todasLasMarcas = [...new Set(ordered.map(p => p.marca).filter(Boolean))];
  const todosLosPesos = [...new Set(ordered.flatMap(p => {
    const match = (p.nombre || '').match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|cc|mg)/gi);
    return match || [];
  }))];
  const todasLasPresentaciones = [...new Set(ordered.map(p => p.presentacion).filter(Boolean))];

  console.log(`🎲 OPCIONES PARA DESAMBIGUAR (en ${ordered.length} resultados):`);
  console.log(`   • Marcas disponibles (${todasLasMarcas.length}):`, todasLasMarcas.slice(0, 10));
  console.log(`   • Pesos detectados (${todosLosPesos.length}):`, todosLosPesos.slice(0, 10));
  console.log(`   • Presentaciones (${todasLasPresentaciones.length}):`, todasLasPresentaciones.slice(0, 10));

  // Top N para conversación (preferimos 3-4, tope 6)
  const TOP_N = 6;

  // Convertir productos a formato GPT con precios calculados
  const validos = await Promise.all(
    ordered.slice(0, TOP_N).map(p => toGPTProduct(p, usuarioId))
  );
  const top = validos[0] || null;
  const similares = await Promise.all(
    ordered.slice(TOP_N, TOP_N + 6).map(p => toGPTProduct(p, usuarioId))
  );

  console.log(`📤 RETORNANDO: ${validos.length} válidos, ${similares.length} similares`);
  console.log(`   🥇 TOP: "${top?.nombre || '—'}"`);
  console.log('🔍 ========== RECOMENDACIÓN FIN ==========\n');

  return { validos, top, similares };
}
