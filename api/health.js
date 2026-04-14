'use strict';

/**
 * GET /api/health
 *
 * Returns server status, configured key count, and active models.
 * Does NOT expose actual key values.
 */

const { loadKeys, setCORS, handleOptions } = require('./_gemini');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCORS(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keys = loadKeys();

  return res.status(200).json({
    status:          'ok',
    configuredKeys:  keys.length,
    maxKeys:         10,
    primaryModel:    process.env.GEMINI_MODEL            || 'gemma-3-1b-it',
    groundingModel:  process.env.GEMINI_GROUNDING_MODEL  || 'gemini-2.0-flash',
    ready:           keys.length > 0,
    timestamp:       new Date().toISOString(),
  });
};
