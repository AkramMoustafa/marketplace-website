"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Shield, CreditCard, Headphones, Truck } from "lucide-react";
import CarCard from "@/components/CarCard";
import InstagramShowcase from "@/components/InstagramShowcase";
import { cars } from "@/lib/data";

const featured = cars.slice(0, 5);

const pillars = [
  {
    icon: <Shield size={26} className="text-[#C9A84C]" />,
    title: "Certified Pre-Owned",
    desc: "Every vehicle passes a rigorous 150-point inspection by factory-trained technicians before receiving our certified seal.",
  },
  {
    icon: <CreditCard size={26} className="text-[#C9A84C]" />,
    title: "Flexible Financing",
    desc: "Tailored packages from our network of premier lenders, with rates from 0% APR for qualified buyers.",
  },
  {
    icon: <Headphones size={26} className="text-[#C9A84C]" />,
    title: "Concierge Service",
    desc: "Your dedicated specialist handles every detail from test drives to delivery so you focus on the joy of ownership.",
  },
  {
    icon: <Truck size={26} className="text-[#C9A84C]" />,
    title: "Nationwide Delivery",
    desc: "We deliver your vehicle anywhere in the continental United States, fully insured, at no additional cost.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-[#0A0A0A]">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1920&q=90"
          alt="Luxury car hero"
          fill priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0A0A0A]" />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[#C9A84C] text-[10px] tracking-[0.35em] uppercase font-sans mb-7"
          >
            Premium Luxury Automobiles
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-6xl sm:text-8xl lg:text-9xl text-white leading-none mb-8"
          >
            Drive the
            <br />
            <span className="text-[#C9A84C]">Extraordinary</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="text-white/50 text-base font-sans max-w-lg mx-auto mb-12 leading-relaxed"
          >
            Curating the world&apos;s most exceptional motorcars — where performance meets artistry, and every detail tells a story.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/inventory"
              className="group flex items-center gap-2.5 bg-[#C9A84C] text-black text-[11px] tracking-[0.18em] uppercase px-8 py-4 font-sans font-semibold hover:bg-[#D4B96A] transition-colors duration-300"
            >
              Explore Inventory
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/about"
              className="border border-white/30 text-white text-[11px] tracking-[0.18em] uppercase px-8 py-4 font-sans hover:border-[#C9A84C]/60 hover:text-[#C9A84C] transition-all duration-300"
            >
              Book a Test Drive
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/25 text-[9px] tracking-[0.3em] uppercase font-sans">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-[#C9A84C]/60 to-transparent animate-pulse" />
        </motion.div>
      </section>

      {/* ── FEATURED VEHICLES ────────────────────────────── */}
      <section className="py-24 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-5"
          >
            <div>
              <p className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-sans mb-3">Handpicked Selection</p>
              <h2 className="font-serif text-4xl md:text-5xl text-white">Featured Vehicles</h2>
            </div>
            <Link
              href="/inventory"
              className="flex items-center gap-2 text-[#C9A84C] text-[11px] tracking-[0.15em] uppercase font-sans hover:gap-3 transition-all duration-300"
            >
              View All Inventory <ArrowRight size={13} />
            </Link>
          </motion.div>

          <div className="thin-divider mb-12" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((car, i) => (
              <CarCard key={car.id} car={car} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTAGRAM ────────────────────────────────────── */}
      <InstagramShowcase />

      {/* ── WHY CHOOSE US ────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-10 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-sans mb-4">The Luxury Motors Difference</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white">Why Choose Us</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {pillars.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-[#111111] border border-white/[0.07] hover:border-[#C9A84C]/30 p-8 hover:-translate-y-1 transition-all duration-400"
              >
                <div className="mb-6">{p.icon}</div>
                <h3 className="font-serif text-xl text-white mb-4 group-hover:text-[#C9A84C] transition-colors duration-300">{p.title}</h3>
                <p className="text-white/35 text-sm font-sans leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────── */}
      <section className="relative py-32 px-6 lg:px-10 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1920&q=80"
          alt="CTA background"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative z-10 text-center max-w-2xl mx-auto"
        >
          <p className="text-[#C9A84C] text-[10px] tracking-[0.35em] uppercase font-sans mb-6">Begin Your Journey</p>
          <h2 className="font-serif text-5xl md:text-6xl text-white mb-6 leading-tight">Your Dream Car Awaits</h2>
          <p className="text-white/45 font-sans mb-12 leading-relaxed">
            Browse our curated collection of the world&apos;s most extraordinary automobiles. Your next chapter starts here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/inventory"
              className="bg-[#C9A84C] text-black text-[11px] tracking-[0.18em] uppercase px-10 py-4 font-sans font-semibold hover:bg-[#D4B96A] transition-colors duration-300"
            >
              Browse Inventory
            </Link>
            <Link
              href="/about"
              className="border border-white/30 text-white text-[11px] tracking-[0.18em] uppercase px-10 py-4 font-sans hover:border-[#C9A84C]/60 hover:text-[#C9A84C] transition-all duration-300"
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
