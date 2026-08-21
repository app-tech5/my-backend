const DEFAULT_OPENAI_MODEL = process.env.OPENAI_RECOMMENDATION_MODEL || 'gpt-4.1-mini';
const DEFAULT_GEMINI_MODEL =
process.env.GEMINI_RECOMMENDATION_MODEL || 'gemini-1.5-flash';

const PROVIDERS = Object.freeze({
  BUILTIN: 'builtin',
  OPENAI: 'openai',
  GEMINI: 'gemini'
});

function normalizeProvider(value) {
  const raw = String(value || PROVIDERS.BUILTIN).trim().toLowerCase();
  if (raw === PROVIDERS.OPENAI) return PROVIDERS.OPENAI;
  if (raw === PROVIDERS.GEMINI) return PROVIDERS.GEMINI;
  return PROVIDERS.BUILTIN;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJsonObject(text) {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return safeJsonParse(text.slice(start, end + 1));
}

function toExternalContext(input) {
  return {
    timeOfDay: input.bucket,
    weather: input.weather?.condition || 'fair',
    cartProductIds: input.productIds || [],
    historyProductIds: input.historyIds || [],
    candidates: (input.candidates || []).map((p) => ({
      id: String(p._id),
      name: p.name,
      tags: p.tags || [],
      price: p.price,
      ratingAverage: p?.rating?.average || 0,
      ratingCount: p?.rating?.count || 0,
      hasDiscount: Boolean(p?.discount?.isActive)
    })),
    requestedLimit: input.limit
  };
}

function buildPrompt(context) {
  return [
  'You are a food delivery recommendation engine.',
  'Pick cross-sell items from candidates.',
  'Return strict JSON only in this shape:',
  '{"recommendedProductIds":["id1","id2"],"reasonsById":{"id1":"short reason"}}',
  'Rules:',
  '- Prefer candidates that fit cart/history, weather and time-of-day.',
  '- Never include ids not in candidates.',
  '- Do not include cartProductIds in response.',
  '- Keep reasons very short (max 12 words).',
  '',
  JSON.stringify(context)].
  join('\n');
}

function reorderWithExternalIds({ candidates, externalIds, limit }) {
  const byId = new Map(candidates.map((p) => [String(p._id), p]));
  const selected = [];
  const seen = new Set();

  for (const id of externalIds || []) {
    const key = String(id);
    if (!byId.has(key) || seen.has(key)) continue;
    selected.push(byId.get(key));
    seen.add(key);
    if (selected.length >= limit) break;
  }

  for (const item of candidates) {
    const key = String(item._id);
    if (seen.has(key)) continue;
    selected.push(item);
    if (selected.length >= limit) break;
  }

  return selected;
}

async function callOpenAI({ apiKey, model, prompt }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
      {
        role: 'system',
        content:
        'You return strict JSON only. No markdown, no code fences, no commentary.'
      },
      { role: 'user', content: prompt }]

    })
  });
  if (!res.ok) throw new Error(`openai_http_${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  const parsed = safeJsonParse(text) || extractJsonObject(text);
  if (!parsed) throw new Error('openai_invalid_json');
  return parsed;
}

async function callGemini({ apiKey, model, prompt }) {
  const url =
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
  `?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
  });
  if (!res.ok) throw new Error(`gemini_http_${res.status}`);
  const data = await res.json();
  const text =
  data?.candidates?.[0]?.content?.parts?.
  map((p) => p?.text || '').
  join('\n').
  trim() || '';
  const parsed = safeJsonParse(text) || extractJsonObject(text);
  if (!parsed) throw new Error('gemini_invalid_json');
  return parsed;
}

async function applyRecommendationProvider(input) {
  const provider = normalizeProvider(process.env.AI_RECOMMENDATION_PROVIDER || process.env.AI_PROVIDER);
  const candidates = input.candidates || [];
  const builtinItems = input.builtinItems || [];

  if (provider === PROVIDERS.BUILTIN) {
    return {
      provider,
      mode: 'builtin',
      items: builtinItems
    };
  }

  const context = toExternalContext(input);
  const prompt = buildPrompt(context);

  try {
    let parsed;
    if (provider === PROVIDERS.OPENAI) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error('openai_missing_key');
      parsed = await callOpenAI({ apiKey, model: DEFAULT_OPENAI_MODEL, prompt });
    } else {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('gemini_missing_key');
      parsed = await callGemini({ apiKey, model: DEFAULT_GEMINI_MODEL, prompt });
    }

    const externalIds = Array.isArray(parsed?.recommendedProductIds) ?
    parsed.recommendedProductIds.map(String) :
    [];
    const reordered = reorderWithExternalIds({
      candidates,
      externalIds,
      limit: input.limit
    });
    const reasonsById =
    parsed?.reasonsById && typeof parsed.reasonsById === 'object' ?
    parsed.reasonsById :
    {};

    const mergedItems = reordered.map((item) => {
      const id = String(item._id);
      const aiReason = typeof reasonsById[id] === 'string' ? reasonsById[id].trim() : '';
      return aiReason ? { ...item, aiReason } : item;
    });

    return {
      provider,
      mode: 'external',
      items: mergedItems,
      model:
      provider === PROVIDERS.OPENAI ? DEFAULT_OPENAI_MODEL : DEFAULT_GEMINI_MODEL
    };
  } catch (error) {
    return {
      provider,
      mode: 'fallback_builtin',
      fallbackError: error.message,
      items: builtinItems
    };
  }
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function pickProviderFor(feature) {
  const specific = process.env[`AI_${feature.toUpperCase()}_PROVIDER`];
  return normalizeProvider(specific || process.env.AI_PROVIDER);
}

async function callExternalProvider({ provider, prompt }) {
  if (provider === PROVIDERS.OPENAI) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('openai_missing_key');
    return callOpenAI({
      apiKey,
      model: process.env.OPENAI_RECOMMENDATION_MODEL || DEFAULT_OPENAI_MODEL,
      prompt
    });
  }
  if (provider === PROVIDERS.GEMINI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('gemini_missing_key');
    return callGemini({
      apiKey,
      model: process.env.GEMINI_RECOMMENDATION_MODEL || DEFAULT_GEMINI_MODEL,
      prompt
    });
  }
  throw new Error('builtin_provider_no_external_call');
}

async function applyEtaProvider({ builtinResult }) {
  const provider = pickProviderFor('eta');
  if (provider === PROVIDERS.BUILTIN) {
    return { provider, mode: 'builtin', eta: builtinResult };
  }
  const prompt = [
  'You optimize delivery ETA ranges for food delivery.',
  'Return JSON only: {"minMinutes":number,"maxMinutes":number,"labelReason":"short"}',
  'Rules: maxMinutes must be >= minMinutes, realistic, conservative.',
  'Input:',
  JSON.stringify(builtinResult)].
  join('\n');
  try {
    const parsed = await callExternalProvider({ provider, prompt });
    const minMinutes = clampNumber(
      parsed?.minMinutes,
      5,
      180,
      builtinResult.minMinutes
    );
    const maxMinutes = clampNumber(
      parsed?.maxMinutes,
      minMinutes + 1,
      240,
      builtinResult.maxMinutes
    );
    return {
      provider,
      mode: 'external',
      eta: {
        ...builtinResult,
        minMinutes,
        maxMinutes,
        estimatedArrivalAt: new Date(Date.now() + maxMinutes * 60 * 1000).toISOString(),
        aiLabelReason:
        typeof parsed?.labelReason === 'string' ? parsed.labelReason.trim() : ''
      }
    };
  } catch (error) {
    return {
      provider,
      mode: 'fallback_builtin',
      fallbackError: error.message,
      eta: builtinResult
    };
  }
}

async function applySurgeProvider({ builtinResult }) {
  const provider = pickProviderFor('surge');
  if (provider === PROVIDERS.BUILTIN) {
    return { provider, mode: 'builtin', surge: builtinResult };
  }
  const prompt = [
  'You optimize surge multiplier for food delivery marketplace.',
  'Return JSON only: {"active":boolean,"multiplier":number,"labelReason":"short"}',
  'Rules: multiplier between 1.0 and 2.0',
  'Input:',
  JSON.stringify(builtinResult)].
  join('\n');
  try {
    const parsed = await callExternalProvider({ provider, prompt });
    const multiplier = clampNumber(
      parsed?.multiplier,
      1,
      2,
      builtinResult.multiplier
    );
    const active =
    typeof parsed?.active === 'boolean' ? parsed.active : multiplier > 1.05;
    return {
      provider,
      mode: 'external',
      surge: {
        ...builtinResult,
        active,
        multiplier: active ? Number(multiplier.toFixed(2)) : 1,
        aiLabelReason:
        typeof parsed?.labelReason === 'string' ? parsed.labelReason.trim() : ''
      }
    };
  } catch (error) {
    return {
      provider,
      mode: 'fallback_builtin',
      fallbackError: error.message,
      surge: builtinResult
    };
  }
}

module.exports = {
  PROVIDERS,
  normalizeProvider,
  applyRecommendationProvider,
  applyEtaProvider,
  applySurgeProvider
};
