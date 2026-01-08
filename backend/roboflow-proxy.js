// Simple Express proxy to forward requests to Roboflow workflow
// Usage: set ROBOFLOW_API_KEY in backend/.env
// Run: node roboflow-proxy.js

const express = require('express');
const fetch = require('node-fetch'); // node-fetch v2 syntax
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // for dev allow all origins; lock this down in production
app.use(express.json({ limit: '12mb' })); // allow large base64 payloads

const PORT = process.env.PORT || 4000;
const ROBOFLOW_URL = 'https://serverless.roboflow.com/new-workspace-hygt2/workflows/custom-workflow';

app.post('/roboflow', async (req, res) => {
  try {
    const body = req.body || {};
    const apiKey = process.env.ROBOFLOW_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server misconfigured: missing ROBOFLOW_API_KEY' });
    }

    const forwardBody = {
      ...body,
      api_key: apiKey
    };

    const response = await fetch(ROBOFLOW_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forwardBody)
    });

    const json = await response.json();
    res.json(json);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'proxy_error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Roboflow proxy listening on http://localhost:${PORT}/roboflow`);
});