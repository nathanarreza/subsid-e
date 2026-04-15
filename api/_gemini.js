'use strict';

const { VertexAI, HarmCategory, HarmBlockThreshold } = require('@google-cloud/vertexai');

// Configure these via Environment Variables in GCP Console
const project = process.env.GCP_PROJECT_ID || 'project-1e6f195c-270b-410c-94c';
const location = process.env.GCP_LOCATION || 'asia-southeast1';

// Initialize Vertex AI
const vertexAI = new VertexAI({ project: project, location: location });

/**
 * Core Vertex AI Call
 */
async function callGemini(modelName, payload, useGrounding = false) {
  // 1. Get the generative model
  const generativeModel = vertexAI.getGenerativeModel({
    model: modelName,
    safetySettings: [{
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    }],
    generationConfig: payload.generationConfig || { maxOutputTokens: 1000, temperature: 0.5 },
  });

  // 2. Add Grounding Tool if requested
  const tools = useGrounding ? [{ googleSearchRetrieval: {} }] : [];

  // 3. Prepare the request
  // Vertex AI expects contents as an array of objects
  const request = {
    contents: payload.contents,
    tools: tools,
  };

  const result = await generativeModel.generateContent(request);
  const response = await result.response;
  
  // Return in a format compatible with your existing extractText/extractGrounding helpers
  return {
    data: response, 
    model: modelName,
    keyIndex: 'VertexAI-Service-Account'
  };
}

async function callGeminiWithOptionalGrounding(model, payload, useGrounding) {
    // Vertex handles tool rejection better, but we'll keep the logic simple
    return callGemini(model, payload, useGrounding);
}

// Helpers to maintain compatibility with your current code
function extractText(response) {
  return response.candidates[0].content.parts[0].text || '';
}

function extractGrounding(response) {
  return response.candidates[0].groundingMetadata || null;
}

// Keep your existing CORS helpers
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function handleOptions(req, res) {
  if (req.method === 'OPTIONS') { setCORS(res); res.status(200).end(); return true; }
  return false;
}

module.exports = {
  callGemini,
  callGeminiWithOptionalGrounding,
  setCORS,
  handleOptions,
  extractText,
  extractGrounding,
};