const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Serve Static Files (The Frontend)
// This tells Express to serve everything in the /public folder
app.use(express.static(path.join(__dirname, 'public')));

// 3. API Routes
try {
    const chatHandler = require('./api/chat');
    const newsHandler = require('./api/news');

    app.post('/api/chat', (req, res) => chatHandler(req, res));
    app.post('/api/news', (req, res) => newsHandler(req, res));
} catch (err) {
    console.error("❌ API Handler Import Error:", err.message);
}

// 4. SPA Fallback (Optional)
// If you refresh on a sub-page, this keeps the app from 404ing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 5. Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Subsid-E running on port ${PORT}`);
});