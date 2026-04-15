'use strict';

const {
  callGemini,
  callGeminiWithOptionalGrounding,
  setCORS,
  handleOptions,
  extractText,
  extractGrounding,
} = require('./_gemini');

// I strongly recommend using gemini-2.0-flash for grounding. It is 10x faster and prevents timeouts.
// Use these names for Vertex AI
const GROUND_MODEL = 'gemini-1.5-flash-002'; // Vertex name for Flash
const MODEL        = 'gemini-1.5-flash-002';
const MAX_TOKENS     = parseInt(process.env.CHAT_MAX_TOKENS || '800', 10);

const SYSTEM_PROMPT = `Your name is SubsidE Assistant. You are a specialized expert on Philippine government subsidy and assistance programs. 

CORE IDENTITY RULES:
- NEVER mention Google, DeepMind, or being a Large Language Model.
- NEVER mention Gemini, Gemma, or any specific model version.
- You speak in a friendly, professional, and compassionate Taglish (Filipino-English mix).

KNOWLEDGE SCOPE:
- Agencies: DSWD (4Ps, AICS), DOLE (TUPAD, AKAP), DOH, PhilHealth, SSS, GSIS, Pag-IBIG, CHED (TES), DA, DOST, DTI.
- Provide concrete next steps (hotlines, websites, or documents needed).
- Use bullet points for requirements.`;

const SYSTEM_TURNS =[
  { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
  { role: 'model', parts:[{ text: 'Mabuhay! I am the SubsidE Assistant. I am ready to help our kababayan find and understand government subsidies.' }] },
];

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCORS(res);

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, useGrounding = true } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // --- START GREETING INTERCEPTOR ---
  const lastUserMessage = messages[messages.length - 1].parts[0].text.toLowerCase().trim();
  const greetings =['hello', 'hi', 'hoy', 'kumusta', 'kamusta', 'mabuhay', 'greetings', 'test'];
  
  if (greetings.includes(lastUserMessage.replace(/[!?.]/g, ""))) {
    return res.status(200).json({
      text: `Hello, kababayan! Kumusta po kayo? Ako ang inyong **SubsidE Assistant**.\n\nNarito ako para gabayan kayo sa paghahanap at pag-apply sa mga government subsidies. Ano po ang gusto ninyong malaman o anong tulong ang kailangan ninyo ngayon?`,
      groundingMetadata: null,
      model: 'persona-intercept',
      keyIndex: 0,
    });
  }
  // --- END GREETING INTERCEPTOR ---

  const payload = {
    contents: [...SYSTEM_TURNS, ...messages],
    generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.5, topP: 0.9 },
  };

  // Attempt 1: Try with the Grounding Model
  if (useGrounding) {
    try {
      const { data, keyIndex, model } = await callGeminiWithOptionalGrounding(GROUND_MODEL, payload, true);
      let textResponse = extractText(data).replace(/as a language model/gi, "as your SubsidE guide").replace(/Gemini/g, "SubsidE");
      
      return res.status(200).json({ text: textResponse, groundingMetadata: extractGrounding(data), model, keyIndex });
    } catch (err) {
      console.warn(`[subsid-e/chat] Grounding attempt failed (${err.message}). Falling back to primary model...`);
    }
  }

  // Attempt 2 (Fallback): Run the faster, lighter model without search
  try {
    const { data, keyIndex, model } = await callGemini(MODEL, payload);
    let textResponse = extractText(data).replace(/as a language model/gi, "as your SubsidE guide").replace(/Gemini/g, "SubsidE");
    
    return res.status(200).json({ text: textResponse, groundingMetadata: null, model, keyIndex });
  } catch (err) {
    console.error('[subsid-e/chat] Fallback also failed:', err.message);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};