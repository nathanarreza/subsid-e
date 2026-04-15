const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Import your existing Vercel files exactly as they are!
const chatHandler = require('./api/chat');
const newsHandler = require('./api/news');

// Map the routes
app.post('/api/chat', (req, res) => chatHandler(req, res));
app.post('/api/news', (req, res) => newsHandler(req, res));

// Health check for GCP
app.get('/', (req, res) => {
  res.send('Subsid-E API is running securely on GCP!');
});

// Start the server (Cloud Run provides the PORT environment variable automatically)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});