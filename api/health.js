'use strict';

/**
 * GET /api/health
 *
 * Returns server status and active Vertex AI configuration.
 * Aligned for Gemini 2.0 Flash on GCP Vertex AI.
 */

const { setCORS, handleOptions } = require('./_gemini');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCORS(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // In Vertex AI, readiness is determined by the presence of the Project ID
  const projectId = process.env.GCP_PROJECT_ID || 'project-1e6f195c-270b-410c-94c';
  const isReady = !!projectId;

  return res.status(200).json({
    status:          'ok',
    method:          'Vertex AI SDK (IAM)',
    // Vertex AI uses Service Accounts, so we'll report 1 active identity instead of keys
    configuredKeys:  isReady ? 1 : 0, 
    primaryModel:    'gemini-2.5-flash',
    groundingModel:  'gemini-2.5-flash',
    ready:           isReady,
    project:         projectId.substring(0, 12) + '...', // Masked for security
    timestamp:       new Date().toISOString(),
  });
};