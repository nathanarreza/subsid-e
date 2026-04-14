'use strict';

/**
 * POST /api/news
 *
 * Body: {
 *   query?: string    // search topic, default: "Philippine government subsidy 2025"
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
  callGeminiWithOptionalGrounding,
  setCORS,
  handleOptions,
  extractText,
  extractGrounding,
} = require('./_gemini');

const GROUND_MODEL = process.env.GEMINI_GROUNDING_MODEL || 'gemini-2.0-flash';
const MODEL        = process.env.GEMINI_MODEL            || 'gemma-3-1b-it';
const MAX_TOKENS   = parseInt(process.env.NEWS_MAX_TOKENS || '2000', 10);

function buildNewsPrompt(query) {
  return `You are a news analyst specializing in Philippine government social protection and subsidy programs.

Search for and provide the latest news and updates about: "${query}"

Structure your response as a clear news briefing with 5–7 items. For each news item provide:
- A clear, factual headline
- The source or publication name
- A concise 2–3 sentence summary of the development
- Date if available

Focus on: new program launches, updated benefit amounts, application window openings, eligibility changes, distribution updates, policy changes, and official announcements from government agencies (DSWD, DOLE, DOH, DA, CHED, DTI, etc.).

Write in a clear journalistic style. If grounding sources are available, prioritize information from official .gov.ph sources, major Philippine news outlets (Inquirer, GMA, ABS-CBN, PhilStar, Rappler), and government press releases.`;
}

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCORS(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = 'Philippine government subsidy programs 2025' } = req.body ?? {};

  if (typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'query must be a non-empty string' });
  }

  const safeQuery = query.trim().substring(0, 300);

  const payload = {
    contents: [{ role: 'user', parts: [{ text: buildNewsPrompt(safeQuery) }] }],
    generationConfig: {
      maxOutputTokens: MAX_TOKENS,
      temperature: 0.3,
      topP: 0.85,
    },
  };

  // Attempt 1: grounding model + Google Search
  try {
    const groundedPayload = { ...payload, tools: [{ google_search: {} }] };
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
    console.warn(`[subsid-e/news] Grounding attempt failed: ${groundErr.message}. Falling back to ${MODEL}…`);
  }

  // Fallback: primary model (Gemma) without grounding
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
