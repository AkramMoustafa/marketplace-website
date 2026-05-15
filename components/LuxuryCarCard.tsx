"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Gauge, ArrowRight } from "lucide-react";
import { Car, formatPrice, formatMileage } from "@/lib/data";

interface LuxuryCarCardProps {
  car: Car;
  index?: number;
}

export default function LuxuryCarCard({ car, index = 0 }: LuxuryCarCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col bg-[#141414] rounded-2xl overflow-hidden border border-white/[0.06] hover:border-[#C9A84C]/30 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(0,0,0,0.6)] transition-all duration-400 ease-out cursor-pointer"
    >
      {/* ── Image ── */}
      <Link href={`/inventory/${car.id}`} className="block relative overflow-hidden aspect-[16/11]">
        <Image
          src={car.images[0]}
          alt={car.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Gradient fade to card bg */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent opacity-60" />
        {/* Status badge */}
        <div className="absolute top-4 right-4">
          <span className={`text-[10px] font-sans font-semibold tracking-[0.15em] uppercase px-3 py-1.5 rounded-full backdrop-blur-sm ${
            car.status === "available"
              ? "bg-[#C9A84C] text-black"
              : "bg-black/50 text-white/50 border border-white/15"
          }`}>
            {car.status === "available" ? "Available" : "Sold"}
          </span>
        </div>
      </Link>

      {/* ── Info ── */}
      <div className="flex flex-col gap-3 px-5 pt-4 pb-5 flex-1">
        {/* Stock # */}
        <p className="text-[#C9A84C]/70 text-[10px] font-sans tracking-[0.2em] uppercase">
          #{car.stockNumber}
        </p>

        {/* Title */}
        <Link href={`/inventory/${car.id}`} className="block">
          <h3 className="font-serif text-white text-xl leading-snug group-hover:text-[#C9A84C] transition-colors duration-300 line-clamp-2">
            {car.title}
          </h3>
        </Link>

        {/* Spec line */}
        <p className="text-white/35 text-xs font-sans tracking-wide">
          {car.transmission}&ensp;·&ensp;{car.fuelType}&ensp;·&ensp;{car.color}
        </p>

        {/* Divider */}
        <div className="h-px bg-white/[0.07]" />

        {/* Bottom row */}
        <div className="flex items-end justify-between gap-3 mt-auto">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-white/40 text-xs font-sans">
              <Gauge size={12} />
              <span>{formatMileage(car.mileage)}</span>
            </div>
            <p className="font-serif text-[#C9A84C] text-2xl leading-none">
              {formatPrice(car.price)}
            </p>
          </div>

          <Link
            href={`/inventory/${car.id}`}
            className={`shrink-0 flex items-center gap-1.5 text-[11px] font-sans tracking-[0.12em] uppercase px-4 py-2.5 rounded-lg transition-all duration-300 ${
              car.status === "available"
                ? "bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/25 hover:bg-[#C9A84C] hover:text-black hover:border-[#C9A84C]"
                : "bg-white/5 text-white/25 border border-white/10 pointer-events-none"
            }`}
          >
            {car.status === "available" ? (
              <>View<ArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-0.5" /></>
            ) : "Sold"}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
