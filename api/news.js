'use strict';

const {
  callGemini,
  setCORS,
  handleOptions,
  extractText,
  extractGrounding,
} = require('./_gemini');

// Set for Gemini 2.5 Flash
const GROUND_MODEL = "gemini-2.5-flash"; 
const MODEL        = "gemini-2.5-flash";
// Change this line:
// const MAX_TOKENS = parseInt(process.env.NEWS_MAX_TOKENS || '1000', 10);

// To this (Hardcoded for testing):
const MAX_TOKENS = 20000;

function buildNewsPrompt(query) {
  const today = new Date().toLocaleDateString('en-US', { 
    timeZone: 'Asia/Manila', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `You are the Lead Reporter for SubsidE. 
Current Date: ${today}.

REPORTING TASK:
Search the web and write a 300-word news briefing about: "${query}".

STRUCTURE:
- Use H3 headers for each news story.
- Include the specific date of the news.
- Use bullet points for eligibility updates.

DATA REQUIREMENT:
You must provide real news from 2025 and 2026. 
If you cannot find specific news for this query, summarize the CURRENT 2026 general status of Philippine government social protection (4Ps/TUPAD) based on your internal knowledge. 

DO NOT output a single word. You must provide at least 3 paragraphs.`;
}

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCORS(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query = 'Philippine government subsidy programs 2026' } = req.body ?? {};
  const safeQuery = query.trim().substring(0, 300);

  const payload = {
    contents: [{ role: 'user', parts:[{ text: buildNewsPrompt(safeQuery) }] }],
    generationConfig: {
      maxOutputTokens: MAX_TOKENS,
      temperature: 0.3, // Lower temperature for more factual news
      topP: 0.8,
    },
  };

  // Attempt 1: Vertex AI Grounding + Google Search
  // ... inside handler
  try {
    const { data, grounded } = await callGemini(GROUND_MODEL, payload, true);
    const text = extractText(data);

    // CRITICAL: If the model says "Good" or is too short, force the fallback
    if (text.length < 50) {
       throw new Error("Response too short - likely a placeholder.");
    }

    return res.status(200).json({
      text: text,
      groundingMetadata: extractGrounding(data),
      grounded: grounded, // Use the actual status from the tool
      model: GROUND_MODEL
    });
  } catch (groundErr) {
    // ... Fallback logic
    console.warn(`[subsid-e/news] Grounding failed: ${groundErr.message}. Falling back...`);
  }

  // Fallback: Primary model without search
  try {
    const { data, keyIndex } = await callGemini(MODEL, payload, false);

    return res.status(200).json({
      text:              extractText(data),
      groundingMetadata: null,
      grounded:          false,
      model:             MODEL,
      keyIndex,
    });
  } catch (err) {
    console.error('[subsid-e/news] Critical Error:', err.message);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};