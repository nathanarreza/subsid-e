'use strict';

const { VertexAI, HarmCategory, HarmBlockThreshold } = require('@google-cloud/vertexai');

// Clean up the project ID to prevent the "concatenation" bug
const rawProject = process.env.GCP_PROJECT_ID || 'project-1e6f195c-270b-410c-94c';
const project = rawProject.split(' ')[0].trim(); // Takes only the ID, ignores any text after it

const location = 'us-central1';

// Initialize Vertex AI
const vertexAI = new VertexAI({ project: project, location: location });
/**
 * Core Vertex AI Call
 */
async function callGemini(modelName, payload, useGrounding = false) {
  // Use the specific model instance
  const generativeModel = vertexAI.getGenerativeModel({
    model: modelName,
    generationConfig: payload.generationConfig || { maxOutputTokens: 1000, temperature: 0.5 },
  });

  // Correct Tool definition for Vertex AI Search Grounding
  const request = {
    contents: payload.contents,
  };

  if (useGrounding) {
    request.tools = [{ googleSearchRetrieval: {} }];
  }

  const result = await generativeModel.generateContent(request);
  const response = await result.response;
  
  // LOG THE RAW RESPONSE TO YOUR SERVER CONSOLE
  // This is vital to see if Google is rejecting your search request
  console.log("--- RAW AI RESPONSE ---");
  console.log(JSON.stringify(response, null, 2));

  return {
    data: response, 
    model: modelName,
    // Check if grounding metadata actually exists in the response
    grounded: !!(response.candidates?.[0]?.groundingMetadata)
  };
}

async function callGeminiWithOptionalGrounding(model, payload, useGrounding) {
    // Vertex handles tool rejection better, but we'll keep the logic simple
    return callGemini(model, payload, useGrounding);
}

// Helpers to maintain compatibility with your current code
function extractText(response) {
  try {
    return response.candidates[0].content.parts[0].text;
  } catch (e) {
    console.error("Text extraction failed:", e);
    return "Error: AI returned empty content.";
  }
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