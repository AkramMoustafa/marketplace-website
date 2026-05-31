'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import BookingCTA from './BookingCTA';
import TestDriveModal from './TestDriveModal';
import VehicleCarousel from './VehicleCarousel';
import type { VehicleData } from './VehicleChatCard';

// Marker Alex emits when test-drive scheduling intent is detected
const BOOKING_MARKER = '[SCHEDULE_MODAL]';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  showBookingCTA: boolean;
  timestamp: number;
  vehicles?: VehicleData[];
}

const QUICK_REPLIES = [
  { label: 'Schedule Test Drive' },
  { label: 'Browse Inventory' },
  { label: 'Get Financing' },
  { label: 'Call Us' },
];

const WELCOME = "Hey! I'm Alex, your virtual assistant. I can help you schedule a test drive, inquire about a car, check availability, or connect you with our team. What can I help you with?";

const CHATBOT_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

function makeMessage(
  role: ChatMessage['role'],
  rawContent: string,
  vehicles?: VehicleData[],
): ChatMessage {
  const hasMarker = rawContent.includes(BOOKING_MARKER);
  const content = rawContent.replace(BOOKING_MARKER, '').trim();
  return { id: msgId(), role, content, showBookingCTA: hasMarker, timestamp: Date.now(), vehicles };
}

export default function ChatWidget() {
  const pathname = usePathname();

  // Extract vehicle ID if the user is on a vehicle detail page
  const currentVehicleId = useMemo(() => {
    const m = pathname?.match(/\/(?:inventory|car)\/([a-f0-9-]{36})/i);
    return m ? m[1] : null;
  }, [pathname]);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [unread, setUnread] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
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
      setMessages([makeMessage('assistant', WELCOME)]);
    }
  }, [open, hasOpened]);

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || typing) return;

    setMessages(prev => [...prev, makeMessage('user', content)]);
    setInput('');
    setTyping(true);

    try {
      const res = await fetch(`${CHATBOT_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, sessionId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        throw new Error(err.error ?? err.detail ?? 'Server error');
      }

      const data = await res.json() as { response: string; vehicles?: VehicleData[] };
      const msg = makeMessage('assistant', data.response, data.vehicles ?? undefined);
      setMessages(prev => [...prev, msg]);
      if (!open) setUnread(n => n + 1);

      // If Alex signalled the booking modal, open it immediately
      if (msg.showBookingCTA) setModalOpen(true);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : 'Unknown error';
      setMessages(prev => [...prev, makeMessage('assistant',
        `Sorry, I ran into an issue: ${errorText}.`)]);
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
    setMessages([makeMessage('assistant', WELCOME)]);
    setInput('');
    setTyping(false);
    fetch(`${CHATBOT_URL}/api/chat/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleQuickReply = (label: string) => {
    if (label === 'Schedule Test Drive') {
      setModalOpen(true);
    } else {
      sendMessage(label);
    }
  };

  const handleCardSchedule = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setModalOpen(true);
  };

  const handleCardFinancing = (vehicleTitle: string) => {
    sendMessage(`I'd like financing information for the ${vehicleTitle}`);
  };

  const handleModalSuccess = (chatMsg: string) => {
    setModalOpen(false);
    setSelectedVehicleId(null);
    setMessages(prev => [...prev, makeMessage('assistant', chatMsg)]);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedVehicleId(null);
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
        .alex-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>

      {/* Full-screen booking modal */}
      {modalOpen && (
        <TestDriveModal
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          currentVehicleId={selectedVehicleId ?? currentVehicleId}
        />
      )}

      {/* Chat panel */}
      {open && (
        <div className="alex-widget fixed bottom-24 right-5 z-[9999] w-[370px] max-w-[calc(100vw-1.25rem)]">
          <div
            className="flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
            style={{ height: 'min(600px, calc(100vh - 7rem))' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#FF5500] flex items-center justify-center text-white font-black text-sm">
                  A
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 text-sm leading-tight">Alex</p>
                <p className="text-[11px] text-emerald-500 leading-tight">Online · NOVA Motors Assistant</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetChat}
                  title="New conversation"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="Close chat"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="alex-scroll flex-1 overflow-y-auto px-4 pt-4 pb-2">
              {messages.map(msg => (
                <div key={msg.id}>
                  {/* Only show the text bubble if there's text content */}
                  {msg.content && (
                    <Message role={msg.role} content={msg.content} timestamp={msg.timestamp} />
                  )}
                  {/* Vehicle cards carousel for inventory search results */}
                  {msg.vehicles && msg.vehicles.length > 0 && msg.role === 'assistant' && (
                    <VehicleCarousel
                      vehicles={msg.vehicles}
                      onSchedule={handleCardSchedule}
                      onFinancing={handleCardFinancing}
                    />
                  )}
                  {/* Booking CTA card rendered for messages that carried the marker */}
                  {msg.showBookingCTA && msg.role === 'assistant' && (
                    <BookingCTA onOpen={() => setModalOpen(true)} />
                  )}
                </div>
              ))}
              {typing && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies — only on first message */}
            {messages.length <= 1 && !typing && (
              <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
                {QUICK_REPLIES.map(({ label }) => (
                  <button
                    key={label}
                    onClick={() => handleQuickReply(label)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-[#FF5500]/50 text-gray-600 hover:text-gray-900 text-xs font-medium rounded-full transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 py-3 border-t border-gray-200 bg-gray-50 shrink-0">
              <div className="flex items-end gap-2 bg-white rounded-xl px-3 py-2 border border-gray-300 focus-within:border-[#FF5500]/60 transition">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  rows={1}
                  disabled={typing}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none max-h-24 leading-relaxed py-0.5 disabled:opacity-50"
                  style={{ minHeight: '1.25rem' }}
                  onInput={(e) => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = 'auto';
                    t.style.height = `${Math.min(t.scrollHeight, 96)}px`;
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || typing}
                  className="p-1.5 rounded-lg bg-[#FF5500] text-white hover:bg-[#FF7733] disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
                >
                  <Send size={15} />
                </button>
              </div>
              <p className="text-center text-[10px] text-gray-400 mt-1.5">Powered by Alex AI · NOVA Motors</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-5 right-5 z-[9999] w-14 h-14 rounded-full bg-[#FF5500] hover:bg-[#FF7733] text-white shadow-lg shadow-[#FF5500]/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
