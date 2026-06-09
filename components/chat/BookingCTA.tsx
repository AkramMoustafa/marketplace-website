'use client';

import { Car, ArrowRight } from 'lucide-react';

interface Props {
  onOpen: () => void;
}

export default function BookingCTA({ onOpen }: Props) {
  return (
    <div
      className="my-1 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm"
      style={{ animation: 'alexFadeIn 0.25s ease-out' }}
    >
      {/* Card header */}
      <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-white border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#B22222] flex items-center justify-center shrink-0">
          <Car size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-black text-gray-900 leading-tight">Schedule a Test Drive</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Book in under 30 seconds</p>
        </div>
      </div>

      {/* CTA button */}
      <div className="px-4 py-3">
        <button
          onClick={onOpen}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#B22222] text-white text-sm font-bold hover:bg-[#8B1A1A] active:scale-95 transition-all shadow-sm shadow-[#B22222]/20"
        >
          Schedule Test Drive
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
