/**
 * embed.jsx — standalone embed entry
 *
 * Build with:  npm run build:embed
 * Embed on any page:
 *   <script src="https://your-cdn.com/alex-chatbot.iife.js"
 *           data-api-url="https://your-server.com"></script>
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatWidget from './components/ChatWidget.jsx';
import './index.css';

(function mount() {
  const container = document.createElement('div');
  container.id = 'alex-chatbot-root';
  document.body.appendChild(container);

  const currentScript = document.currentScript;
  const apiUrl = currentScript?.getAttribute('data-api-url') || '';

  // Inject apiUrl via window so ChatWidget can read it
  window.__ALEX_API_URL__ = apiUrl;

  ReactDOM.createRoot(container).render(<ChatWidget />);
})();
