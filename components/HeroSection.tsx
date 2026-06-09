'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

import heroImage from '@/assets/charger-2.jpg';

const SLIDES = [
  { image: heroImage, alt: 'Nova Motors Inventory' },
  { image: heroImage, alt: 'Nova Motors Inventory' },
  { image: heroImage, alt: 'Nova Motors Inventory' },
] as const;

export default function HeroSection({ onOpenFinder }: { onOpenFinder?: () => void }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative h-[560px] overflow-hidden bg-black">

      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full">
        <div className="w-full h-full px-4 lg:px-10">
          <div className="h-full flex justify-end items-center pr-8 lg:pr-16">
            <div className="w-[300px] lg:w-[340px] mr-4 lg:mr-8">
              <div className="bg-white/95 backdrop-blur-md p-6 lg:p-8 rounded-md shadow-2xl">

                <div className="uppercase text-black/70 tracking-[4px] text-xs font-semibold mb-4">
                  Detroit • Premium Pre-Owned Inventory
                </div>

                <h1 className="text-black font-black uppercase tracking-[-0.03em] leading-[0.95] text-2xl lg:text-4xl">
                  FIND YOUR
                  <br />
                  NEXT VEHICLE
                </h1>

                <p className="mt-4 text-black/70 text-sm lg:text-base leading-relaxed">
                  Browse hundreds of vehicles, explore detailed listings,
                  compare options, and connect directly with our team.
                </p>

                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    onClick={onOpenFinder}
                    className="inline-flex items-center justify-center px-8 py-3 bg-[#B22222] text-white text-sm font-bold uppercase tracking-[2px] hover:bg-[#8B1A1A] transition-all duration-200"
                  >
                    Find Your Dream Car
                  </button>
                  <a
                    href="/inventory"
                    className="inline-flex items-center justify-center px-8 py-2.5 border border-black/20 text-black/70 text-xs font-semibold uppercase tracking-[1.5px] hover:bg-black/5 transition-all duration-200"
                  >
                    View Inventory
                  </a>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}