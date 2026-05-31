'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const QUICK_REPLIES = [
  { label: 'Schedule Test Drive', icon: '🚗' },
  { label: 'Browse Inventory', icon: '🔍' },
  { label: 'Get Financing', icon: '💰' },
  { label: 'Call Us', icon: '📞' },
];

const WELCOME = "Hey! I'm Alex, your virtual assistant. I can help you schedule a test drive, inquire about a car, check availability, or connect you with our team. What can I help you with?";

const CHATBOT_URL = process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:3001';

let _sessionId: string | null = null;
function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
  return _sessionId;
}

let _msgCounter = 0;
function msgId() {
  return `msg-${++_msgCounter}-${Date.now()}`;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = getSessionId();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnread(0);
    }
  }, [open]);

  useEffect(() => {
    if (open && !hasOpened) {
      setHasOpened(true);
      setMessages([{ id: msgId(), role: 'assistant', content: WELCOME, timestamp: Date.now() }]);
    }
  }, [open, hasOpened]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || typing) return;

    setMessages(prev => [...prev, { id: msgId(), role: 'user', content, timestamp: Date.now() }]);
    setInput('');
    setTyping(true);

    try {
      const res = await fetch(`${CHATBOT_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, sessionId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error || 'Server error');
      }

      const data = await res.json() as { response: string };
      setMessages(prev => [...prev, { id: msgId(), role: 'assistant', content: data.response, timestamp: Date.now() }]);
      if (!open) setUnread(n => n + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => [...prev, {
        id: msgId(), role: 'assistant',
        content: `Sorry, I ran into an issue: ${msg}. Make sure the chatbot server is running on port 3001.`,
        timestamp: Date.now(),
      }]);
    } finally {
      setTyping(false);
    }
  }, [input, typing, sessionId, open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([{ id: msgId(), role: 'assistant', content: WELCOME, timestamp: Date.now() }]);
    setInput('');
    setTyping(false);
    fetch(`${CHATBOT_URL}/api/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
  };

  return (
    <>
      <style>{`
        @keyframes alexFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes alexSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes alexBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
        .alex-widget { animation: alexSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1); }
        .alex-scroll::-webkit-scrollbar { width: 4px; }
        .alex-scroll::-webkit-scrollbar-track { background: transparent; }
        .alex-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>

      {/* Chat panel */}
      {open && (
        <div className="alex-widget fixed bottom-24 right-5 z-[9999] w-[370px] max-w-[calc(100vw-1.25rem)]">
          <div className="flex flex-col bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
               style={{ height: 'min(600px, calc(100vh - 7rem))' }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700/60 shrink-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#FF5500] flex items-center justify-center text-white font-black text-sm">
                  A
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-800" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm leading-tight">Alex</p>
                <p className="text-[11px] text-emerald-400 leading-tight">Online · NOVA Motors Assistant</p>
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
            <div className="alex-scroll flex-1 overflow-y-auto px-4 pt-4 pb-2">
              {messages.map(msg => (
                <Message key={msg.id} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
              ))}
              {typing && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies — only on first open */}
            {messages.length <= 1 && !typing && (
              <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
                {QUICK_REPLIES.map(({ label, icon }) => (
                  <button key={label} onClick={() => sendMessage(label)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-[#FF5500]/50 text-slate-300 hover:text-white text-xs font-medium rounded-full transition-all">
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 border-t border-slate-700/60 bg-slate-800/50 shrink-0">
              <div className="flex items-end gap-2 bg-slate-700/60 rounded-xl px-3 py-2 border border-slate-600/50 focus-within:border-[#FF5500]/60 transition">
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
                  onInput={(e) => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = 'auto';
                    t.style.height = `${Math.min(t.scrollHeight, 96)}px`;
                  }}
                />
                <button onClick={() => sendMessage()} disabled={!input.trim() || typing}
                  className="p-1.5 rounded-lg bg-[#FF5500] text-white hover:bg-[#FF7733] disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0">
                  <Send size={15} />
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-600 mt-1.5">Powered by Alex AI · NOVA Motors</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button onClick={() => setOpen(v => !v)}
        className="fixed bottom-5 right-5 z-[9999] w-14 h-14 rounded-full bg-[#FF5500] hover:bg-[#FF7733] text-white shadow-lg shadow-[#FF5500]/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
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
