'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  carName: string;
}

// Shown when no real images are uploaded yet
const PHOTO_LABELS = ['Front View', 'Rear View', 'Interior', 'Side View', 'Engine Bay'];
const THUMB_GRADIENTS = [
  'from-slate-600 to-slate-800',
  'from-zinc-700  to-slate-900',
  'from-slate-700 to-zinc-800',
  'from-slate-800 to-slate-900',
  'from-zinc-600  to-slate-800',
];

export default function VehicleGallery({ images, carName }: Props) {
  const [active, setActive] = useState(0);

  const hasImages   = images.length > 0;
  const totalSlides = hasImages ? images.length : PHOTO_LABELS.length;
  const prev = () => setActive(i => (i - 1 + totalSlides) % totalSlides);
  const next = () => setActive(i => (i + 1) % totalSlides);

  const thumbItems: string[] = hasImages ? images : PHOTO_LABELS;

  return (
    <div>
      {/* ── Main image ──────────────────────────────────────────────── */}
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-3 border border-white/[0.06] bg-slate-800/50 shadow-lg">
        {hasImages ? (
          <Image
            src={images[active]}
            alt={`${carName} — photo ${active + 1}`}
            fill
            className="object-cover transition-opacity duration-300"
            priority
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${THUMB_GRADIENTS[active % THUMB_GRADIENTS.length]} transition-all duration-500`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
              <p className="text-slate-400 text-sm font-medium">{carName}</p>
              <p className="text-slate-600 text-xs mt-1">{PHOTO_LABELS[active]}</p>
            </div>
          </div>
        )}

        {/* Counter */}
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-black/65 backdrop-blur-sm text-white text-xs font-bold rounded-lg">
          {active + 1} / {totalSlides}
        </div>

        {/* Arrows */}
        <button
          onClick={prev}
          aria-label="Previous photo"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10
            w-10 h-10 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10
            text-white flex items-center justify-center
            hover:bg-[#FF5500] hover:border-[#FF5500] hover:text-black transition"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={next}
          aria-label="Next photo"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10
            w-10 h-10 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10
            text-white flex items-center justify-center
            hover:bg-[#FF5500] hover:border-[#FF5500] hover:text-black transition"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Thumbnail strip ─────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {thumbItems.map((item, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`View photo ${i + 1}`}
            className={`relative shrink-0 w-[70px] h-[52px] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
              i === active
                ? 'border-[#FF5500] ring-2 ring-[#FF5500]/20 opacity-100'
                : 'border-white/10 opacity-45 hover:opacity-70'
            }`}
          >
            {hasImages ? (
              <Image src={item} alt="" fill className="object-cover" />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${THUMB_GRADIENTS[i % THUMB_GRADIENTS.length]}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[7px] text-slate-500 font-bold text-center leading-tight px-0.5">
                    {item}
                  </span>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
