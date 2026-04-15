const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Serve Static Files (The Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// 3. API Routes with Async Handling
try {
    // Note: Ensure your chat.js and news.js use 'module.exports = async function...'
    const chatHandler = require('./api/chat');
    const newsHandler = require('./api/news');

    // We wrap these in an async block to properly handle Vertex AI promises
    app.post('/api/chat', async (req, res) => {
        try {
            await chatHandler(req, res);
        } catch (err) {
            console.error("❌ Chat Route Error:", err);
            if (!res.headersSent) {
                res.status(500).json({ error: "AI Assistant is currently unavailable." });
            }
        }
    });

    app.post('/api/news', async (req, res) => {
        try {
            await newsHandler(req, res);
        } catch (err) {
            console.error("❌ News Route Error:", err);
            if (!res.headersSent) {
                res.status(500).json({ error: "Could not fetch latest news." });
            }
        }
    });

} catch (err) {
    console.error("❌ CRITICAL: API Handler Import Error:", err.message);
}

// 4. SPA Fallback
// This must come AFTER the API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add this inside your server.js (before the app.get('*') route)
app.get('/api/health', (req, res) => {
  res.json({
    ready: true,
    method: 'Vertex AI SDK',
    primaryModel: 'Gemini 2.0 Flash',
    groundingModel: 'Google Search'
  });
});

// 5. Start Server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Subsid-E running on port ${PORT}`);
    console.log(`🚀 Environment: ${process.env.NODE_ENV || 'production'}`);
});

// 6. Increase Timeout
// Vertex AI with Google Search grounding can take 20-30 seconds.
// This prevents Express from closing the connection too early.
server.timeout = 120000;