import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import Message from './Message.jsx';
import TypingIndicator from './TypingIndicator.jsx';

const QUICK_REPLIES = [
  { label: 'Schedule Test Drive', icon: '🚗' },
  { label: 'Browse Inventory', icon: '🔍' },
  { label: 'Get Financing', icon: '💰' },
  { label: 'Call Us', icon: '📞' },
];

const WELCOME = "Hey! I'm Alex, your virtual assistant. I can help you schedule a test drive, inquire about a car, check availability, or connect you with our team. What can I help you with?";

const API_URL = import.meta.env.VITE_API_URL || '';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [sessionId] = useState(() => uuid());
  const [hasOpened, setHasOpened] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnread(0);
    }
  }, [open]);

  // Load welcome message on first open
  useEffect(() => {
    if (open && !hasOpened) {
      setHasOpened(true);
      setMessages([{ id: uuid(), role: 'assistant', content: WELCOME, timestamp: Date.now() }]);
    }
  }, [open, hasOpened]);

  const sendMessage = useCallback(async (text) => {
    const content = text ?? input.trim();
    if (!content || typing) return;

    const userMsg = { id: uuid(), role: 'user', content, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, sessionId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Server error');
      }

      const data = await res.json();
      const botMsg = { id: uuid(), role: 'assistant', content: data.response, timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);

      if (!open) setUnread(n => n + 1);
    } catch (err) {
      const errMsg = {
        id: uuid(),
        role: 'assistant',
        content: `Sorry, I ran into an issue: ${err.message}. Please try again.`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setTyping(false);
    }
  }, [input, typing, sessionId, open]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([{ id: uuid(), role: 'assistant', content: WELCOME, timestamp: Date.now() }]);
    setInput('');
    setTyping(false);
    // Clear server-side session
    fetch(`${API_URL}/api/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[370px] max-w-[calc(100vw-1.25rem)] animate-slideUp">
          <div className="flex flex-col bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
               style={{ height: 'min(600px, calc(100vh - 7rem))' }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700/60 shrink-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#B22222] flex items-center justify-center text-white font-black text-sm">
                  A
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-800" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm leading-tight">Alex</p>
                <p className="text-[11px] text-emerald-400 leading-tight">Online · Dealership Assistant</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={resetChat} title="New conversation"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
                  <RotateCcw size={14} />
                </button>
                <button onClick={() => setOpen(false)} title="Close chat"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto chat-scroll px-4 pt-4 pb-2">
              {messages.map(msg => (
                <Message key={msg.id} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
              ))}
              {typing && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies — shown when no user messages yet */}
            {messages.length <= 1 && !typing && (
              <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
                {QUICK_REPLIES.map(({ label, icon }) => (
                  <button key={label}
                    onClick={() => sendMessage(label)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-[#B22222]/50 text-slate-300 hover:text-white text-xs font-medium rounded-full transition-all">
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 border-t border-slate-700/60 bg-slate-800/50 shrink-0">
              <div className="flex items-end gap-2 bg-slate-700/60 rounded-xl px-3 py-2 border border-slate-600/50 focus-within:border-[#B22222]/60 transition">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  rows={1}
                  disabled={typing}
                  className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none max-h-24 leading-relaxed py-0.5 disabled:opacity-50"
                  style={{ minHeight: '1.25rem' }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || typing}
                  className="p-1.5 rounded-lg bg-[#B22222] text-white hover:bg-[#8B1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0">
                  <Send size={15} />
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-600 mt-1.5">Powered by Alex AI · NOVA Motors</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[#B22222] hover:bg-[#8B1A1A] text-white shadow-lg shadow-[#B22222]/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-900">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
