import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { agentExecutor, getHistory, appendToHistory, clearSession } from './agent.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

const WELCOME_MESSAGE = "Hey! I'm Alex, your virtual assistant. I can help you schedule a test drive, inquire about a car, check availability, or connect you with our team. What can I help you with?";

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', agent: 'Alex', model: 'llama3-70b-8192' });
});

// Welcome message — called when chat is first opened
app.get('/api/welcome', (_req, res) => {
  res.json({ message: WELCOME_MESSAGE });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'message is required' });
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
  }

  try {
    const chatHistory = getHistory(sessionId);

    const result = await agentExecutor.invoke({
      input: message.trim(),
      chat_history: chatHistory,
    });

    const response = result.output;

    appendToHistory(sessionId, message.trim(), response);

    return res.json({ response, sessionId });
  } catch (err) {
    console.error('[chat error]', err.message);
    return res.status(500).json({
      error: 'Something went wrong. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

// Clear session (optional — e.g. on chat close)
app.delete('/api/session/:sessionId', (req, res) => {
  clearSession(req.params.sessionId);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`\n🤖 Alex chatbot server running on http://localhost:${PORT}`);
  console.log(`   GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✓ set' : '✗ MISSING'}\n`);
});
