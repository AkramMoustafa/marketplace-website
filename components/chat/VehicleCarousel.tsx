'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VehicleChatCard, { type VehicleData } from './VehicleChatCard';

interface Props {
  vehicles: VehicleData[];
  onSchedule: (vehicleId: string, vehicleTitle: string) => void;
  onFinancing: (vehicleTitle: string) => void;
  onNavigate: () => void;
}

export default function VehicleCarousel({ vehicles, onSchedule, onFinancing, onNavigate }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 220 : -220, behavior: 'smooth' });
  };

  if (!vehicles.length) {
    return (
      <div className="my-2 px-3 py-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
        <p className="text-xs text-gray-500 mb-2">
          No vehicles found matching your criteria.
        </p>
        <Link
          href="/inventory"
          className="text-xs font-bold text-[#B22222] hover:underline"
        >
          Browse All Inventory →
        </Link>
      </div>
    );
  }

  return (
    <div className="my-2 relative group/carousel -mx-1">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto pb-1 px-1"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {vehicles.map(v => (
          <div key={v.id} style={{ scrollSnapAlign: 'start' }}>
            <VehicleChatCard
              vehicle={v}
              onSchedule={() => onSchedule(v.id, v.title)}
              onFinancing={() => onFinancing(v.title)}
              onNavigate={onNavigate}
            />
          </div>
        ))}
      </div>

      {/* Desktop nav arrows */}
      {vehicles.length > 1 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute -left-2 top-[45%] -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
            aria-label="Scroll left"
          >
            <ChevronLeft size={12} className="text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute -right-2 top-[45%] -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
            aria-label="Scroll right"
          >
            <ChevronRight size={12} className="text-gray-600" />
          </button>
        </>
      )}

      {vehicles.length > 1 && (
        <p className="text-[9px] text-gray-400 text-center mt-1">
          Swipe to see more ›
        </p>
      )}
    </div>
  );
}
