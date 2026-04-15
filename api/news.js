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
const MAX_TOKENS   = parseInt(process.env.NEWS_MAX_TOKENS || '1000', 10);

function buildNewsPrompt(query) {
  const today = new Date().toLocaleDateString('en-US', { 
    timeZone: 'Asia/Manila', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `You are an expert news analyst for the SubsidE portal.
Today's date is ${today}.

TASK: Search for and provide a detailed news briefing about: "${query}" in the Philippines.

FORMAT REQUIREMENTS:
Provide 3-5 news items. For each item:
1. Headline (Factual and clear)
2. Source & Date
3. Summary (2-3 detailed sentences)

FOCUS: DSWD assistance, DOLE TUPAD, PhilHealth updates, or any Philippine government subsidy announcements from 2025-2026.
STYLE: Journalistic, compassionate, and Taglish-friendly.
CRITICAL: Do not just say "Good" or "Okay". Provide the full report based on your search results.`;
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
  try {
    // 🌟 IMPORTANT: In our Vertex _gemini.js, we pass 'true' as the 3rd argument
    // to trigger the correct googleSearchRetrieval tool.
    const { data, keyIndex } = await callGemini(GROUND_MODEL, payload, true);
    
    const text = extractText(data);
    const grounding = extractGrounding(data);

    // If the text is too short (like "Good"), we treat it as a failure and go to fallback
    if (!text || text.length < 10) {
       throw new Error("AI returned insufficient content");
    }

    return res.status(200).json({
      text:              text,
      groundingMetadata: grounding,
      grounded:          !!grounding,
      model:             GROUND_MODEL,
      keyIndex,
    });
  } catch (groundErr) {
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