require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());

app.use(cors({ origin: origins }));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many attempts, try later' } }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inquiries', require('./routes/inquiries'));

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on port ${port}`));
