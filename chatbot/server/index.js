import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { chat, clearSession } from './openai.js';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST', 'DELETE'] }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', model: 'gpt-4o-mini', fastapi: process.env.FASTAPI_URL || 'http://localhost:8000' });
});

app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message?.trim())   return res.status(400).json({ error: 'message is required' });
  if (!sessionId)         return res.status(400).json({ error: 'sessionId is required' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  try {
    const response = await chat(sessionId, message.trim());
    res.json({ response, sessionId });
  } catch (err) {
    console.error('[chat error]', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.delete('/api/session/:sessionId', (req, res) => {
  clearSession(req.params.sessionId);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`\n🤖 Alex (OpenAI) running on http://localhost:${PORT}`);
  console.log(`   OPENAI_API_KEY : ${process.env.OPENAI_API_KEY ? '✓' : '✗ MISSING'}`);
  console.log(`   FASTAPI_URL    : ${process.env.FASTAPI_URL || 'http://localhost:8000 (default)'}\n`);
});
