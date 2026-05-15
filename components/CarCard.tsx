"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Gauge, Settings2, ArrowRight, MapPin } from "lucide-react";
import { Car, formatPrice, formatMileage } from "@/lib/data";

interface CarCardProps {
  car: Car;
  index?: number;
  showLocation?: boolean;
}

export default function CarCard({ car, index = 0, showLocation = false }: CarCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col bg-[#111111] border border-white/[0.07] hover:border-[#C9A84C]/35 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,.55)] transition-all duration-400 overflow-hidden"
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[16/10]">
        <Image
          src={car.images[0]}
          alt={car.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/60 via-transparent to-transparent" />
        {/* Status */}
        <div className="absolute top-3.5 left-3.5">
          <span className={`text-[10px] font-sans font-semibold tracking-[0.15em] uppercase px-3 py-1.5 ${
            car.status === "available"
              ? "bg-[#C9A84C] text-black"
              : "bg-black/60 text-white/50 border border-white/15"
          }`}>
            {car.status === "available" ? "Available" : "Sold"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 gap-3.5 px-5 pt-4 pb-5">
        {/* Stock # */}
        <p className="text-[#C9A84C]/70 text-[10px] font-sans tracking-[0.22em] uppercase">
          #{car.stockNumber}
        </p>

        {/* Title */}
        <h3 className="font-serif text-white text-[1.15rem] leading-snug group-hover:text-[#C9A84C] transition-colors duration-300">
          {car.title}
        </h3>

        {/* Specs */}
        <div className="flex items-center gap-4 text-white/40 text-xs font-sans">
          <span className="flex items-center gap-1.5">
            <Gauge size={12} className="text-[#C9A84C]/60" />
            {formatMileage(car.mileage)}
          </span>
          <span className="text-white/15">·</span>
          <span className="flex items-center gap-1.5">
            <Settings2 size={12} className="text-[#C9A84C]/60" />
            {car.transmission}
          </span>
          <span className="text-white/15">·</span>
          <span>{car.fuelType}</span>
        </div>

        {/* Location */}
        {showLocation && (
          <div className="flex items-center gap-1.5 text-white/30 text-xs font-sans">
            <MapPin size={11} className="text-[#C9A84C]/50 shrink-0" />
            {car.location}
          </div>
        )}

        <div className="thin-divider" />

        {/* Price + CTA */}
        <div className="flex items-end justify-between mt-auto gap-3">
          <div>
            <p className="text-white/25 text-[10px] font-sans tracking-widest uppercase mb-1">Asking Price</p>
            <p className="font-serif text-[#C9A84C] text-2xl leading-none">{formatPrice(car.price)}</p>
          </div>
          <Link
            href={`/inventory/${car.id}`}
            className="flex items-center gap-1.5 shrink-0 text-[10px] tracking-[0.15em] uppercase font-sans border border-[#C9A84C]/40 text-[#C9A84C] px-4 py-2.5 hover:bg-[#C9A84C] hover:text-black hover:border-[#C9A84C] transition-all duration-300 group/btn"
          >
            View
            <ArrowRight size={11} className="transition-transform duration-300 group-hover/btn:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
