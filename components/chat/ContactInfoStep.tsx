'use client';

import { useState } from 'react';
import { ChevronLeft, User, Phone, Mail, Loader2, Calendar, Clock } from 'lucide-react';

interface Props {
  date: Date;
  time: string;
  vehicleTitle?: string | null;
  onSubmit: (name: string, phone: string, email: string) => void;
  onBack: () => void;
  submitting: boolean;
  error: string;
}

export default function ContactInfoStep({
  date, time, vehicleTitle, onSubmit, onBack, submitting, error,
}: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const canSubmit = name.trim() && phone.trim() && email.trim() && !submitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) onSubmit(name.trim(), phone.trim(), email.trim());
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Summary strip */}
      <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3">
        <span className="flex items-center gap-1 text-[11px] text-gray-700">
          <Calendar size={11} className="text-[#B22222]" />
          {dateStr}
        </span>
        <div className="w-px h-3 bg-red-200" />
        <span className="flex items-center gap-1 text-[11px] text-gray-700">
          <Clock size={11} className="text-[#B22222]" />
          {time}
        </span>
        {vehicleTitle && (
          <>
            <div className="w-px h-3 bg-red-200" />
            <span className="text-[11px] text-gray-500 truncate max-w-[100px]">{vehicleTitle}</span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 mb-3 transition-colors"
      >
        <ChevronLeft size={12} />
        Change time
      </button>

      <p className="text-xs text-gray-500 mb-2.5">Your contact info:</p>

      <div className="space-y-2">
        <div className="relative">
          <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#B22222]/60 text-gray-900 placeholder-gray-400 bg-white"
          />
        </div>

        <div className="relative">
          <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#B22222]/60 text-gray-900 placeholder-gray-400 bg-white"
          />
        </div>

        <div className="relative">
          <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#B22222]/60 text-gray-900 placeholder-gray-400 bg-white"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mt-2.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full mt-3.5 py-2.5 rounded-xl bg-[#B22222] text-white text-sm font-black hover:bg-[#8B1A1A] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#B22222]/20"
      >
        {submitting ? (
          <><Loader2 size={14} className="animate-spin" /> Booking…</>
        ) : (
          'Confirm Test Drive'
        )}
      </button>
    </form>
  );
}
