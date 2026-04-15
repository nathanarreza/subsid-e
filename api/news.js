'use strict';

/**
 * POST /api/news
 *
 * Body: {
 *   query?: string    // search topic, default: "Philippine government subsidy 2026"
 * }
 *
 * Response: {
 *   text: string,
 *   groundingMetadata: object | null,
 *   grounded: boolean,
 *   model: string,
 *   keyIndex: number
 * }
 */

const {
  callGemini,
  setCORS,
  handleOptions,
  extractText,
  extractGrounding,
} = require('./_gemini');

// Upgraded to Gemma 4 31B with native search grounding support
// Inside api/news.js
// Use these names for Vertex AI
const GROUND_MODEL = 'gemini-1.5-flash-002'; // Vertex name for Flash
const MODEL        = 'gemini-1.5-flash-002';
const MAX_TOKENS   = parseInt(process.env.NEWS_MAX_TOKENS || '800', 10);


function buildNewsPrompt(query) {
  // Dynamically inject the exact current date (Manila Time) so the AI doesn't give outdated news.
  const today = new Date().toLocaleDateString('en-US', { 
    timeZone: 'Asia/Manila', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `You are a news analyst specializing in Philippine government social protection and subsidy programs.
Today's date is ${today}.

Search for and provide the latest news and updates about: "${query}"

Structure your response as a clear news briefing with 3–4 items. For each news item provide:
- A clear, factual headline
- The source or publication name
- A concise 2–3 sentence summary of the development
- Date if available

Focus on: new program launches, updated benefit amounts, application window openings, eligibility changes, distribution updates, and official announcements from government agencies (DSWD, DOLE, DOH, DA, CHED, DTI, etc.).

Write in a clear journalistic style. If grounding sources are available, prioritize information from official .gov.ph sources and major Philippine news outlets. Do not include outdated news from previous years unless strictly requested.`;
}

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCORS(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Updated default to the current year
  const { query = 'Philippine government subsidy programs 2026' } = req.body ?? {};

  if (typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'query must be a non-empty string' });
  }

  const safeQuery = query.trim().substring(0, 300);

  const payload = {
    contents: [{ role: 'user', parts:[{ text: buildNewsPrompt(safeQuery) }] }],
    generationConfig: {
      maxOutputTokens: MAX_TOKENS,
      temperature: 0.3,
      topP: 0.85,
    },
  };

  // Attempt 1: Gemma 4 31B Native Grounding + Google Search
  try {
    const groundedPayload = { ...payload, tools: [{ google_search: {} }] };
    
    // We no longer need fetchWithTimeout here! 
    // _gemini.js natively aborts the request and throws a 504 error if it takes longer than TIMEOUT_MS (15s).
    const { data, keyIndex } = await callGemini(GROUND_MODEL, groundedPayload);
    
    const grounding = extractGrounding(data);

    return res.status(200).json({
      text:              extractText(data),
      groundingMetadata: grounding,
      grounded:          !!grounding?.groundingChunks?.length,
      model:             GROUND_MODEL,
      keyIndex,
    });
  } catch (groundErr) {
    console.warn(`[subsid-e/news] Grounding attempt (${GROUND_MODEL}) failed: ${groundErr.message}. Fast-falling back to ${MODEL}…`);
  }

  // Fallback: Primary lightweight model without search
  // Runs immediately if the first step crashes or takes > 15 seconds.
  try {
    const { data, keyIndex } = await callGemini(MODEL, payload);

    return res.status(200).json({
      text:              extractText(data),
      groundingMetadata: null,
      grounded:          false,
      model:             MODEL,
      keyIndex,
    });
  } catch (err) {
    console.error('[subsid-e/news]', err.message);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};