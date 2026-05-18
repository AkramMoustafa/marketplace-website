'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Car } from '@/lib/data';

export default function CarCard({ car }: { car: Car }) {
  const [slide, setSlide] = useState(0);

  const prev = () =>
    setSlide(i => (i - 1 + car.images.length) % car.images.length);

  const next = () =>
    setSlide(i => (i + 1) % car.images.length);

  const priceDisplay =
    car.price === 'Call'
      ? 'Call for Price'
      : `$${Number(car.price).toLocaleString()}`;

  return (
    <div className="
      group relative bg-white rounded-xl overflow-hidden
      border border-slate-200 shadow-sm
      hover:-translate-y-1 hover:shadow-lg hover:border-slate-300
      transition-all duration-300
    ">

      {/* ── IMAGE ──────────────────────────────────────────────────── */}
      <div className="relative aspect-[4/2.85] overflow-hidden bg-slate-100">

        {car.images.map((src, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-300 ${
              i === slide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Image
              src={src}
              alt={`${car.name} image ${i + 1}`}
              fill
              priority={i === 0}
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
          </div>
        ))}

        {/* Year badge — top left */}
        <div className="absolute top-2 left-2 z-20
          px-2 py-1 rounded bg-slate-900/85 backdrop-blur-[2px]
          text-white text-[10px] font-black tracking-wide">
          {car.year}
        </div>

        {/* Prev */}
        <button
          onClick={prev}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2
            opacity-0 group-hover:opacity-100 transition duration-200"
        >
          <div className="w-7 h-7 rounded-full bg-black/70 text-white
            flex items-center justify-center hover:bg-black shadow-md">
            <ChevronLeft size={14} />
          </div>
        </button>

        {/* Next */}
        <button
          onClick={next}
          aria-label="Next image"
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2
            opacity-0 group-hover:opacity-100 transition duration-200"
        >
          <div className="w-7 h-7 rounded-full bg-black/70 text-white
            flex items-center justify-center hover:bg-black shadow-md">
            <ChevronRight size={14} />
          </div>
        </button>

        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {car.images.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`rounded-full transition-all duration-200 ${
                i === slide ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Photo counter */}
        <div className="absolute bottom-2 right-2 z-20
          bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded-full">
          {slide + 1}/{car.images.length}
        </div>

      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <div className="p-3.5">

        {/* Make badge */}
        <span className="inline-block mb-1 text-[9px] font-black uppercase
          tracking-[2px] text-amber-600">
          {car.make}
        </span>

        {/* Vehicle name */}
        <h3 className="text-[13px] font-black uppercase tracking-wide leading-snug
          text-slate-900 min-h-[38px]">
          {car.name}
        </h3>

        {/* Stock number */}
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Stock #{car.stockNumber}
        </p>

        {/* Price row */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2">
          <span className={`leading-none font-black text-slate-900 ${
            car.price === 'Call' ? 'text-lg' : 'text-xl'
          }`}>
            {priceDisplay}
          </span>
        </div>

        {/* CTA */}
        <a
          href="#"
          className="mt-3 flex items-center justify-center w-full py-2.5 rounded-lg
            bg-slate-900 text-white text-[10.5px] font-black uppercase tracking-[1.5px]
            hover:bg-amber-500 hover:text-black
            transition-colors duration-200"
        >
          View Details
        </a>

      </div>

    </div>
  );
}
