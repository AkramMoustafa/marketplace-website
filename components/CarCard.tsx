'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { StaticImageData } from 'next/image';
import { getImageUrl } from '@/lib/api';

export interface DisplayCar {
  id: string;
  title: string;
  make: string;
  year: number;
  price: number | string;
  images: (string | StaticImageData)[];
  stockNumber?: string;
  color?: string | null;
  mileage?: number;
}

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjU2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjU2MCIgZmlsbD0iI2YxZjVmOSIvPjx0ZXh0IHg9IjQwMCIgeT0iMjkwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIzMiIgZmlsbD0iI2NiZDVlMSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

function resolveImageSrc(src: string | StaticImageData): string | StaticImageData {
  if (typeof src === 'string' && src.startsWith('/uploads/')) {
    return getImageUrl(src);
  }
  return src;
}

export default function CarCard({ car }: { car: DisplayCar }) {
  const [slide, setSlide] = useState(0);

  const images = car.images.length > 0 ? car.images : [PLACEHOLDER];
  const prev = () => setSlide(i => (i - 1 + images.length) % images.length);
  const next = () => setSlide(i => (i + 1) % images.length);

  const priceDisplay =
    car.price === 'Call' || car.price === 0
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

        {images.map((src, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-300 ${
              i === slide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Image
              src={resolveImageSrc(src)}
              alt={`${car.title} image ${i + 1}`}
              fill
              priority={i === 0}
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
          </div>
        ))}

        {/* Year badge */}
        <div className="absolute top-2 left-2 z-20
          px-2 py-1 rounded bg-slate-900/85 backdrop-blur-[2px]
          text-white text-[10px] font-black tracking-wide">
          {car.year}
        </div>

        {images.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous image"
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2
                opacity-0 group-hover:opacity-100 transition duration-200">
              <div className="w-7 h-7 rounded-full bg-black/70 text-white
                flex items-center justify-center hover:bg-black shadow-md">
                <ChevronLeft size={14} />
              </div>
            </button>

            <button onClick={next} aria-label="Next image"
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2
                opacity-0 group-hover:opacity-100 transition duration-200">
              <div className="w-7 h-7 rounded-full bg-black/70 text-white
                flex items-center justify-center hover:bg-black shadow-md">
                <ChevronRight size={14} />
              </div>
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === slide ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>

            <div className="absolute bottom-2 right-2 z-20
              bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded-full">
              {slide + 1}/{images.length}
            </div>
          </>
        )}
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <div className="p-3.5">

        <span className="inline-block mb-1 text-[9px] font-black uppercase
          tracking-[2px] text-[#FF5500]">
          {car.make}
        </span>

        <h3 className="text-[13px] font-black uppercase tracking-wide leading-snug
          text-slate-900 min-h-[38px]">
          {car.title}
        </h3>

        {car.stockNumber && (
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Stock #{car.stockNumber}
          </p>
        )}
        {car.mileage !== undefined && !car.stockNumber && (
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {car.mileage.toLocaleString()} mi
          </p>
        )}

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-end justify-between gap-2">
          <span className="leading-none font-black text-slate-900 text-xl">
            {priceDisplay}
          </span>
        </div>

        <Link
          href={`/inventory/${car.id}`}
          className="mt-3 flex items-center justify-center w-full py-2.5 rounded-lg
            bg-slate-900 text-white text-[10.5px] font-black uppercase tracking-[1.5px]
            hover:bg-[#FF5500] hover:text-black
            transition-colors duration-200"
        >
          View Details
        </Link>

      </div>

    </div>
  );
}
