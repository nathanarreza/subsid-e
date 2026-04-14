'use strict';

/**
 * POST /api/chat
 *
 * Body: {
 *   messages: Array<{ role: 'user'|'model', parts: [{ text: string }] }>,
 *   useGrounding?: boolean   // default true — uses Google Search if model supports it
 * }
 *
 * Response: {
 *   text: string,
 *   groundingMetadata: object | null,
 *   model: string,
 *   keyIndex: number
 * }
 */

const {
  callGeminiWithOptionalGrounding,
  setCORS,
  handleOptions,
  extractText,
  extractGrounding,
} = require('./_gemini');

const MODEL          = process.env.GEMINI_MODEL          || 'gemma-3-1b-it';
const GROUND_MODEL   = process.env.GEMINI_GROUNDING_MODEL || 'gemini-2.0-flash';
const MAX_TOKENS     = parseInt(process.env.CHAT_MAX_TOKENS || '800', 10);

const SYSTEM_TURNS = [
  {
    role: 'user',
    parts: [{
      text: `You are SubsidE Assistant — an expert on Philippine government subsidy and assistance programs.
Your role is to help Filipino citizens (kababayan) find, understand, and apply for government benefits.

Agencies you cover: DSWD, DOLE, DOH, PhilHealth, SSS, GSIS, Pag-IBIG, CHED, DA, DOST, DTI, NCDA, NCIP, LTFRB, PSA, OSCA, Barangay LGUs.

Guidelines:
- Be accurate, practical, and compassionate.
- Use simple Filipino-English mix naturally (e.g., "kababayan", "pamilya", program names in Filipino).
- Always give concrete next steps — office to visit, website, hotline, or documents needed.
- If you are unsure of an amount or date, say so and direct them to the official agency.
- Never fabricate requirements, amounts, or eligibility rules.
- Keep answers focused and actionable. Use bullet points for steps/lists.`,
    }],
  },
  {
    role: 'model',
    parts: [{ text: 'Naiintindihan ko. I\'m ready to help our kababayan navigate Philippine government subsidies and assistance programs. Ano ang maari kitang matulungan?' }],
  },
];

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCORS(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, useGrounding = true } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Validate message shapes
  for (const msg of messages) {
    if (!msg.role || !Array.isArray(msg.parts)) {
      return res.status(400).json({ error: 'Each message must have role and parts array' });
    }
  }

  // Decide which model to use:
  // If grounding requested, use the grounding model (must be Gemini, not Gemma).
  // Otherwise use the primary model.
  const chosenModel = useGrounding ? GROUND_MODEL : MODEL;

  const payload = {
    contents: [...SYSTEM_TURNS, ...messages],
    generationConfig: {
      maxOutputTokens: MAX_TOKENS,
      temperature: 0.45,
      topP: 0.9,
    },
  };

  try {
    const { data, keyIndex, model } = await callGeminiWithOptionalGrounding(
      chosenModel, payload, useGrounding
    );

    return res.status(200).json({
      text:              extractText(data),
      groundingMetadata: extractGrounding(data),
      model,
      keyIndex,
    });
  } catch (err) {
    console.error('[subsid-e/chat]', err.message);
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
};
