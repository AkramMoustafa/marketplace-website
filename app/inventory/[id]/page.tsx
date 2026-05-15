"use client";

import { useState } from "react";
import { use } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Gauge, Settings2, Fuel, Palette,
  MapPin, Phone, Check, ChevronRight
} from "lucide-react";
import { FacebookIcon } from "@/components/icons";
import { cars, formatPrice, formatMileage } from "@/lib/data";

export default function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const car = cars.find((c) => c.id === id);
  if (!car) notFound();

  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="bg-[#0A0A0A] min-h-screen text-white pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-white/25 text-xs font-sans py-6 border-b border-white/[0.07] mb-8">
          <Link href="/" className="hover:text-[#C9A84C] transition-colors">Home</Link>
          <ChevronRight size={11} />
          <Link href="/inventory" className="hover:text-[#C9A84C] transition-colors">Inventory</Link>
          <ChevronRight size={11} />
          <span className="text-white/50">{car.title}</span>
        </div>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 text-white/40 hover:text-[#C9A84C] text-[11px] tracking-[0.18em] uppercase font-sans transition-colors duration-300"
          >
            <ArrowLeft size={13} /> Back to Inventory
          </Link>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

          {/* LEFT — Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main image */}
            <div className="relative aspect-[4/3] overflow-hidden mb-3 border border-white/[0.07]">
              <Image
                src={car.images[activeImage]}
                alt={car.title} fill priority
                className="object-cover transition-all duration-500"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute top-4 left-4">
                <span className={`text-[10px] font-sans font-semibold tracking-[0.15em] uppercase px-3 py-1.5 ${
                  car.status === "available" ? "bg-[#C9A84C] text-black" : "bg-black/70 text-white/50 border border-white/15"
                }`}>
                  {car.status === "available" ? "Available" : "Sold"}
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-2">
              {car.images.slice(0, 4).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative aspect-[4/3] overflow-hidden border-2 transition-all duration-300 ${
                    activeImage === i ? "border-[#C9A84C]" : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <Image src={img} alt={`View ${i + 1}`} fill className="object-cover" sizes="120px" />
                  {activeImage !== i && <div className="absolute inset-0 bg-black/40" />}
                </button>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col"
          >
            {/* Stock badge */}
            <div className="mb-5">
              <span className="inline-flex items-center text-[#C9A84C] text-[10px] tracking-[0.22em] uppercase font-sans border border-[#C9A84C]/35 px-3.5 py-2">
                Stock #{car.stockNumber}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-4xl md:text-5xl text-white leading-tight mb-8">
              {car.title}
            </h1>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3 mb-7">
              {[
                { icon: <Gauge size={15} />,    label: "Mileage",      value: formatMileage(car.mileage) },
                { icon: <Settings2 size={15} />, label: "Transmission", value: car.transmission },
                { icon: <Fuel size={15} />,      label: "Fuel Type",    value: car.fuelType },
                { icon: <Palette size={15} />,   label: "Color",        value: car.color },
              ].map((s) => (
                <div key={s.label} className="flex items-start gap-3 bg-[#111111] border border-white/[0.07] p-4">
                  <span className="text-[#C9A84C] mt-0.5">{s.icon}</span>
                  <div>
                    <p className="text-white/30 text-[10px] font-sans uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-white text-sm font-sans">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Location */}
            <div className="flex items-center gap-2.5 mb-7 text-white/45 text-sm font-sans">
              <MapPin size={14} className="text-[#C9A84C]" />
              {car.location}
            </div>

            <div className="thin-divider mb-7" />

            {/* Price */}
            <div className="mb-8">
              <p className="text-white/25 text-[10px] font-sans uppercase tracking-widest mb-2">Asking Price</p>
              <p className="font-serif text-5xl text-[#C9A84C]">{formatPrice(car.price)}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-5">
              <a
                href="#"
                className="flex items-center justify-center gap-2.5 flex-1 bg-[#1877F2] text-white text-[11px] tracking-[0.12em] uppercase px-5 py-3.5 font-sans hover:bg-[#1565D8] transition-colors duration-300"
              >
                <FacebookIcon size={14} /> Share
              </a>
              <a
                href="tel:#"
                className="flex items-center justify-center gap-2.5 flex-1 bg-[#C9A84C] text-black text-[11px] tracking-[0.12em] uppercase px-5 py-3.5 font-sans font-semibold hover:bg-[#D4B96A] transition-colors duration-300"
              >
                <Phone size={14} /> Call Dealer
              </a>
            </div>

            {/* Location box */}
            <div className="border border-white/[0.08] bg-[#111111] p-5 flex items-start gap-3">
              <MapPin size={16} className="text-[#C9A84C] shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-sans mb-1">{car.location}</p>
                <a href="#" className="text-[#C9A84C] text-[10px] tracking-wider uppercase font-sans hover:underline">
                  Get Directions →
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="border-t border-white/[0.07] pt-12 grid grid-cols-1 lg:grid-cols-3 gap-10"
        >
          {/* Description + Features */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="font-serif text-2xl text-white mb-2">About This Vehicle</h2>
              <div className="thin-divider mb-6" />
              <p className="text-white/50 font-sans text-sm leading-relaxed">{car.description}</p>
            </div>
            <div>
              <h2 className="font-serif text-2xl text-white mb-2">Features & Equipment</h2>
              <div className="thin-divider mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {car.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-white/50 text-sm font-sans">
                    <Check size={13} className="text-[#C9A84C] mt-0.5 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financing */}
          <div>
            <h2 className="font-serif text-2xl text-white mb-2">Financing</h2>
            <div className="thin-divider mb-6" />
            <div className="border border-[#C9A84C]/25 bg-[#C9A84C]/[0.04] p-6">
              <p className="text-[#C9A84C] text-[10px] tracking-[0.2em] uppercase font-sans mb-4">Financing Options</p>
              <p className="text-white/60 font-sans text-sm leading-relaxed italic">{car.financing}</p>
              <div className="thin-divider my-5" />
              <p className="text-white/30 text-xs font-sans leading-relaxed">
                Terms subject to credit approval. Contact our finance team for personalized solutions.
              </p>
              <a
                href="tel:#"
                className="mt-6 block text-center border border-[#C9A84C]/50 text-[#C9A84C] text-[10px] tracking-[0.18em] uppercase px-5 py-3 font-sans hover:bg-[#C9A84C] hover:text-black transition-all duration-300"
              >
                Speak with Finance Team
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
