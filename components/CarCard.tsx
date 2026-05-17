'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Car } from '@/lib/data';

export default function CarCard({ car }: { car: Car }) {
  const [slide, setSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  const openLightbox = () => {
    setLightboxOpen(true);
    // small tick so the fade-in transition fires after mount
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  };

  const closeLightbox = useCallback(() => {
    setVisible(false);
    setTimeout(() => setLightboxOpen(false), 300);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, closeLightbox]);

  const prev = () =>
    setSlide(i => (i - 1 + car.images.length) % car.images.length);

  const next = () =>
    setSlide(i => (i + 1) % car.images.length);

  const priceDisplay =
    car.price === 'Call'
      ? 'Call'
      : `$${car.price.toLocaleString()}`;

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">

      {/* Red accent bar — grows in from left on hover */}
      <div className="absolute top-0 left-0 h-1 w-0 group-hover:w-full bg-red-600 transition-all duration-500 z-30" />

      {/* IMAGE AREA */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
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
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ))}

        {/* Dark gradient overlay — fades in on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none" />

        {/* LEFT ARROW — hidden until hover */}
        <button
          onClick={prev}
          aria-label="Previous image"
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300"
        >
          <div className="w-9 h-9 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all duration-200 shadow-lg">
            <ChevronLeft size={18} />
          </div>
        </button>

        {/* RIGHT ARROW — hidden until hover */}
        <button
          onClick={next}
          aria-label="Next image"
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300"
        >
          <div className="w-9 h-9 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all duration-200 shadow-lg">
            <ChevronRight size={18} />
          </div>
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {car.images.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`transition-all duration-200 rounded-full ${
                i === slide
                  ? 'w-4 h-2 bg-red-600'
                  : 'w-2 h-2 bg-white/70 hover:bg-white'
              }`}
            />
          ))}
        </div>

        {/* IMAGE COUNT */}
        <div className="absolute bottom-2 right-2 z-20 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
          {slide + 1} / {car.images.length}
        </div>
      </div>

      {/* CONTENT — clicking here opens the lightbox */}
      <div className="p-4 cursor-pointer" onClick={openLightbox}>
        {/* TITLE */}
        <h3 className="text-[14px] font-extrabold uppercase leading-snug text-gray-900 group-hover:text-red-600 transition-colors duration-300">
          {car.name}
        </h3>

        {/* STOCK */}
        <p className="mt-1.5 text-xs text-gray-500 tracking-wide">
          Stock #: <span className="font-semibold text-gray-700">{car.stockNumber}</span>
        </p>

        {/* Divider */}
        <div className="my-3 h-px bg-gray-100 group-hover:bg-red-100 transition-colors duration-300" />

        {/* PRICE */}
        <div className="flex items-end justify-between">
          <span
            className={`text-3xl font-extrabold leading-none transition-colors duration-300 ${
              car.price === 'Call' ? 'text-gray-800' : 'text-red-600'
            }`}
          >
            {priceDisplay}
          </span>
          {car.price !== 'Call' && (
            <span className="text-[10px] text-gray-400 mb-1">+ tax &amp; fees</span>
          )}
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeLightbox}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className={`relative z-10 w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
              visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative aspect-[16/9] bg-black">
              <Image
                src={car.images[0]}
                alt={car.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
            </div>

            {/* Footer strip */}
            <div className="bg-white px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-sm uppercase text-gray-900">{car.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Stock #: {car.stockNumber}</p>
              </div>
              <span
                className={`text-2xl font-extrabold ${
                  car.price === 'Call' ? 'text-gray-800' : 'text-red-600'
                }`}
              >
                {priceDisplay}
              </span>
            </div>

            {/* Close button */}
            <button
              onClick={closeLightbox}
              aria-label="Close"
              className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors duration-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}