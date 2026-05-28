'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
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
  const detailHref = `/vehicle-detail?id=${car.id}`;

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSlide(i => (i - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSlide(i => (i + 1) % images.length);
  };

  const priceDisplay =
    car.price === 'Call' || car.price === 0
      ? 'Call for Price'
      : `$${Number(car.price).toLocaleString()}`;

  return (
    <div className="group relative [perspective:1200px]">

      {/* ── FLIP WRAPPER ──────────────────────────────────────────────── */}
      <div
className="relative will-change-transform transition-transform duration-700 ease-in-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]"
      >

        {/* ── FRONT ─────────────────────────────────────────────────── */}
        <div className="group [backface-visibility:hidden] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 transition-all duration-300">

          {/* Image carousel */}
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
                    opacity-40 group-hover:opacity-100 transition duration-200">
                  <div className="w-9 h-9 rounded-full bg-black/70 text-white
                    flex items-center justify-center hover:bg-black shadow-md">
                    <ChevronLeft size={20} />
                  </div>
                </button>

                <button onClick={next} aria-label="Next image"
                  className="absolute right-2 top-1/2 z-20 -translate-y-1/2
                    opacity-40 group-hover:opacity-100 transition duration-200">
                  <div className="w-9 h-9 rounded-full bg-black/70 text-white
                    flex items-center justify-center hover:bg-black shadow-md">
                    <ChevronRight size={20} />
                  </div>
                </button>

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSlide(i); }}
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

          {/* Card content */}
          <div className="p-3.5">
            <span className="inline-block mb-1 text-[9px] font-black uppercase tracking-[2px] text-[#FF5500]">
              {car.make}
            </span>

            <Link href={detailHref}>
              <h3 className="text-[13px] font-black uppercase tracking-wide leading-snug
                text-slate-900 min-h-[38px] hover:text-[#FF5500] transition-colors duration-200">
                {car.title}
              </h3>
            </Link>

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

            <div className="mt-2.5 pt-2.5 border-t border-slate-100">
              <span className="leading-none font-black text-slate-900 text-xl">
                {priceDisplay}
              </span>
            </div>

<Link
  href={detailHref}
  className="mt-4 flex items-center justify-center w-full py-3.5 rounded-xl
  bg-slate-900 text-white text-[11px] font-black uppercase tracking-[1.5px]
  hover:bg-[#FF5500] transition-all duration-200"
>
  View Vehicle
</Link>
          </div>
        </div>

        {/* ── BACK ──────────────────────────────────────────────────── */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]
          rounded-xl overflow-hidden bg-slate-900 flex flex-col">

          {/* Dimmed photo header */}
          <div className="relative h-[88px] flex-shrink-0">
            <Image
              src={resolveImageSrc(images[0])}
              alt={car.title}
              fill
              className="object-cover brightness-[0.3]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
            <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
              <p className="text-[9px] font-black uppercase tracking-[2px] text-[#FF5500]">
                {car.make}
              </p>
              <h3 className="text-[13px] font-black uppercase text-white leading-tight line-clamp-1">
                {car.title}
              </h3>
            </div>
          </div>

          {/* Specs + CTA */}
          <div className="flex-1 px-4 py-3 flex flex-col justify-between">

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-[8px] uppercase tracking-[1.5px] text-slate-500 font-bold mb-0.5">Year</p>
                <p className="text-sm font-black text-white">{car.year}</p>
              </div>
              {car.mileage !== undefined && (
                <div>
                  <p className="text-[8px] uppercase tracking-[1.5px] text-slate-500 font-bold mb-0.5">Mileage</p>
                  <p className="text-sm font-black text-white">{car.mileage.toLocaleString()} mi</p>
                </div>
              )}
              {car.color && (
                <div>
                  <p className="text-[8px] uppercase tracking-[1.5px] text-slate-500 font-bold mb-0.5">Color</p>
                  <p className="text-sm font-black text-white capitalize">{car.color}</p>
                </div>
              )}
              {car.stockNumber && (
                <div>
                  <p className="text-[8px] uppercase tracking-[1.5px] text-slate-500 font-bold mb-0.5">Stock #</p>
                  <p className="text-sm font-black text-white">{car.stockNumber}</p>
                </div>
              )}
            </div>

            <div>
              <div className="my-3 h-px bg-slate-700/60" />
              <div className="flex items-center justify-between mb-3">
                <p className="text-[8px] uppercase tracking-[1.5px] text-slate-500 font-bold">Price</p>
                <p className="text-xl font-black text-[#FF5500]">{priceDisplay}</p>
              </div>
              <Link
                href={detailHref}
                className="flex items-center justify-center w-full py-2.5 rounded-lg
                  bg-[#FF5500] text-white text-[10.5px] font-black uppercase tracking-[1.5px]
                  hover:bg-[#e04d00] transition-colors duration-200"
              >
                View Full Details →
              </Link>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
