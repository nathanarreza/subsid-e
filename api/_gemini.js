/**
 * Gemini API key rotation utility.
 *
 * Loads up to 10 keys from environment variables GEMINI_KEY_1 … GEMINI_KEY_10.
 * Rotation strategy:
 *   1. Picks a starting key based on current minute.
 *   2. On 429 (rate limit) or 503 (overload) the next key is tried immediately.
 *   3. On Timeout (AbortError) it FAILS FAST so fallback models can trigger.
 *   4. On any other HTTP error the exception is re-thrown.
 */

'use strict';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// Dropped to 15s to allow Vercel enough time to run fallback models before hitting the strict 60s cap.
const TIMEOUT_MS  = parseInt(process.env.API_TIMEOUT_MS || '15000', 10);

// ── Load keys ────────────────────────────────────────────────────────────────
function loadKeys() {
  const keys =[];
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
    throw Object.assign(new Error('No API keys configured. Add GEMINI_KEY_1…GEMINI_KEY_10 to your .env'), { statusCode: 500 });
  }

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
      lastError = networkErr;
      
      // 🔥 CRITICAL FIX: If the model is slow, do NOT rotate keys. 
      // Rotating keys will just cause another timeout and crash Vercel. 
      // Throw immediately to trigger the fallback model.
      if (networkErr.name === 'AbortError') {
         console.warn(`[subsid-e] Model ${model} timed out after ${TIMEOUT_MS}ms. Failing fast.`);
         throw Object.assign(new Error(`Timeout: API took longer than ${TIMEOUT_MS}ms`), { statusCode: 504 });
      }

      console.warn(`[subsid-e] Key ${idx + 1} network error: ${networkErr.message}`);
      continue; // Other network connection issues can safely retry
    }

    if (resp.status === 429 || resp.status === 503) {
      const body = await resp.text();
      console.warn(`[subsid-e] Key ${idx + 1} rate-limited (${resp.status}), rotating…`);
      lastError = Object.assign(new Error(`Rate limited on key ${idx + 1}: ${body}`), { statusCode: 429 });
      continue; // Move to the next API key
    }

    if (!resp.ok) {
      let errMsg = `HTTP ${resp.status}`;
      try {
        const errBody = await resp.json();
        errMsg = errBody?.error?.message || errMsg;
      } catch (_) { /* ignore */ }
      
      // Do not rotate keys for bad inputs (like malformed JSON or invalid prompt)
      throw Object.assign(new Error(errMsg), { statusCode: resp.status });
    }

    const data = await resp.json();
    return { data, keyIndex: idx + 1, model };
  }

  throw lastError || Object.assign(new Error('All API keys exhausted or rate limited.'), { statusCode: 429 });
}

// ── Grounding-aware call ──────────────────────────────────────────────────────
/**
 * Tries with Google Search grounding tool. If the specific model doesn't 
 * support it natively, it strips the tool and retries.
 */
async function callGeminiWithOptionalGrounding(model, payload, useGrounding) {
  if (!useGrounding) return callGemini(model, payload);

  const groundedPayload = { ...payload, tools: [{ google_search: {} }] };

  try {
    return await callGemini(model, groundedPayload);
  } catch (err) {
    const msg = err.message.toLowerCase();
    
    // Check if the error is specifically because the model rejects the grounding tool
    const isToolError = msg.includes('tool') || msg.includes('not support') ||
      msg.includes('unsupported') || msg.includes('unknown') || err.statusCode === 400;

    if (isToolError) {
      console.warn(`[subsid-e] Model ${model} rejected search tool; retrying cleanly without it.`);
      return callGemini(model, payload);
    }
    
    // If it's a Timeout (504) or Rate Limit (429), just bubble the error up
    throw err;
  }
}

// ── CORS & Routing Helpers ────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function handleOptions(req, res) {
  if (req.method === 'OPTIONS') { setCORS(res); res.status(200).end(); return true; }
  return false;
}

// ── Data Extraction ───────────────────────────────────────────────────────────
function extractText(data) {
  return (data?.candidates?.[0]?.content?.parts ??[])
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