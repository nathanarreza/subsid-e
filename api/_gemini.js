/**
 * Gemini API key rotation utility.
 *
 * Loads up to 10 keys from environment variables GEMINI_KEY_1 … GEMINI_KEY_10.
 * Rotation strategy:
 *   1. Picks a starting key based on current minute — distributes load across
 *      warm serverless instances without shared state.
 *   2. On 429 (rate limit) or 503 (overload) the next key is tried immediately.
 *   3. On any other HTTP error the exception is re-thrown (no retry).
 *   4. If ALL keys are exhausted, throws a descriptive error.
 */

'use strict';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS  = parseInt(process.env.API_TIMEOUT_MS || '20000', 10);

// ── Load keys ────────────────────────────────────────────────────────────────
function loadKeys() {
  const keys = [];
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GEMINI_KEY_${i}`];
    if (k && k.trim() && !k.startsWith('AIza...')) keys.push(k.trim());
  }
  return keys;
}

// ── Timed fetch with AbortController ─────────────────────────────────────────
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── Core rotation call ────────────────────────────────────────────────────────
/**
 * @param {string}  model    – Gemini/Gemma model name
 * @param {object}  payload  – generateContent request body
 * @returns {{ data: object, keyIndex: number, model: string }}
 */
async function callGemini(model, payload) {
  const keys = loadKeys();
  if (keys.length === 0) {
    throw Object.assign(new Error('No Gemini API keys configured. Add GEMINI_KEY_1…GEMINI_KEY_10 to your .env'), { statusCode: 500 });
  }

  // Start from a time-based index so concurrent cold starts don't all hammer key #1
  const startIdx = Math.floor(Date.now() / 60_000) % keys.length;
  let lastError;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const idx  = (startIdx + attempt) % keys.length;
    const key  = keys[idx];
    const url  = `${GEMINI_BASE}/${model}:generateContent?key=${key}`;

    let resp;
    try {
      resp = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, TIMEOUT_MS);
    } catch (networkErr) {
      // Network/timeout — try next key
      lastError = networkErr;
      console.warn(`[subsid-e] Key ${idx + 1} network error: ${networkErr.message}`);
      continue;
    }

    if (resp.status === 429 || resp.status === 503) {
      const body = await resp.text();
      console.warn(`[subsid-e] Key ${idx + 1} rate-limited (${resp.status}), rotating…`);
      lastError = Object.assign(new Error(`Rate limited on key ${idx + 1}: ${body}`), { statusCode: 429 });
      continue;
    }

    if (!resp.ok) {
      let errMsg = `HTTP ${resp.status}`;
      try {
        const errBody = await resp.json();
        errMsg = errBody?.error?.message || errMsg;
      } catch (_) { /* ignore */ }
      throw Object.assign(new Error(errMsg), { statusCode: resp.status });
    }

    const data = await resp.json();
    return { data, keyIndex: idx + 1, model };
  }

  throw lastError || Object.assign(new Error('All Gemini API keys exhausted'), { statusCode: 429 });
}

// ── Grounding-aware call (falls back if model doesn't support Search) ─────────
/**
 * Tries with Google Search grounding tool; if the model rejects it
 * (Gemma models don't support grounding), retries without the tool.
 */
async function callGeminiWithOptionalGrounding(model, payload, useGrounding) {
  if (!useGrounding) return callGemini(model, payload);

  const groundedPayload = { ...payload, tools: [{ google_search: {} }] };

  try {
    return await callGemini(model, groundedPayload);
  } catch (err) {
    const msg = err.message.toLowerCase();
    const isToolError = msg.includes('tool') || msg.includes('not support') ||
      msg.includes('unsupported') || msg.includes('unknown') || err.statusCode === 400;

    if (isToolError) {
      console.warn(`[subsid-e] Model ${model} does not support grounding; retrying without search tool.`);
      return callGemini(model, payload);
    }
    throw err;
  }
}

// ── CORS helper ───────────────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function handleOptions(req, res) {
  if (req.method === 'OPTIONS') { setCORS(res); res.status(200).end(); return true; }
  return false;
}

// ── Extract text from Gemini response ─────────────────────────────────────────
function extractText(data) {
  return (data?.candidates?.[0]?.content?.parts ?? [])
    .map(p => p.text || '').join('');
}

function extractGrounding(data) {
  return data?.candidates?.[0]?.groundingMetadata ?? null;
}

module.exports = {
  callGemini,
  callGeminiWithOptionalGrounding,
  setCORS,
  handleOptions,
  extractText,
  extractGrounding,
  loadKeys,
};
