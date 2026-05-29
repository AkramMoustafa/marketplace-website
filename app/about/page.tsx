"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { Star, MapPin, Phone, Mail, Clock } from "lucide-react";

const stats = [
  { value: 25, suffix: "+", label: "Years of Excellence" },
  { value: 2400, suffix: "+", label: "Cars Sold" },
  { value: 1800, suffix: "+", label: "Happy Clients" },
  { value: 12, suffix: "", label: "Industry Awards" },
];

const testimonials = [
  {
    name: "Alexandra Whitmore", location: "New York, NY", rating: 5,
    quote: "Purchasing my Rolls-Royce Ghost through Luxury Motors was the most seamless automotive experience of my life. The team treated me like family from first call to delivery.",
  },
  {
    name: "James Harrington", location: "Los Angeles, CA", rating: 5,
    quote: "I've bought six cars from Luxury Motors over the years. Their curation is unmatched — they only stock vehicles that are genuinely extraordinary. My Porsche 911 Turbo S is flawless.",
  },
  {
    name: "Sophia Chen", location: "Chicago, IL", rating: 5,
    quote: "The concierge service is real, not just marketing. My specialist handled everything — inspection, insurance, delivery — all while I was traveling abroad.",
  },
  // we will need real, so we have to add google reviews api call here  
];

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + inc, target);
      setCount(Math.floor(cur));
      if (cur >= target) clearInterval(t);
    }, 1800 / steps);
    return () => clearInterval(t);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function AboutPage() {
  return (
    <div className="bg-[#0A0A0A] min-h-screen text-white">

      {/* Hero */}
      <section className="relative pt-44 pb-28 px-6 lg:px-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111] to-[#0A0A0A]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-44 bg-gradient-to-b from-[#C9A84C]/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[#C9A84C] text-[10px] tracking-[0.35em] uppercase font-sans mb-5"
          >
            Est. 1998 · New York
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-6xl md:text-8xl text-white"
          >
            Our Story
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="thin-divider max-w-xs mx-auto mt-10"
          />
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative aspect-[4/3] overflow-hidden border border-white/[0.06]">
              <Image
                src="https://images.unsplash.com/photo-1631295387526-d4c27d934e77?w=1200&q=80"
                alt="Our showroom" fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 w-28 h-28 border border-[#C9A84C]/20 -z-10" />
            <div className="absolute -top-4 -left-4 w-20 h-20 border border-[#C9A84C]/15 -z-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
          >
            <p className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-sans mb-5">A Legacy of Excellence</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-8 leading-tight">
              Where Passion Meets<br /><span className="text-[#C9A84C]">Perfection</span>
            </h2>
            <div className="space-y-5 text-white/45 font-sans text-sm leading-relaxed">
              <p>
                Founded in 1998 by automotive connoisseur Edward Harrington, Luxury Motors began as a single-room gallery on Park Avenue with a singular vision: to create the world&apos;s most discerning automotive marketplace.
              </p>
              <p>
                Over two and a half decades we have curated thousands of the world&apos;s most extraordinary automobiles — from the understated elegance of a Rolls-Royce Ghost to the visceral excitement of a Ferrari Roma — always guided by an unwavering commitment to authenticity.
              </p>
              <p>
                Today, with showrooms in New York, Beverly Hills, and Miami, we serve clients across the globe who trust us to find not just a car, but the right car.
              </p>
            </div>
            <div className="thin-divider my-8" />
            <p className="text-[#C9A84C] font-serif italic text-xl leading-relaxed">
              &ldquo;Excellence is not a feature — it is our standard.&rdquo;
            </p>
            <p className="text-white/30 text-xs font-sans mt-2">— Edward Harrington, Founder</p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 lg:px-10 bg-[#080808] border-y border-[#C9A84C]/10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-10">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-serif text-5xl md:text-6xl text-[#C9A84C] mb-3">
                <Counter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-white/35 text-[10px] tracking-[0.2em] uppercase font-sans">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-sans mb-4">Client Voices</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white">What Our Clients Say</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col bg-[#111111] border border-white/[0.07] hover:border-[#C9A84C]/25 p-8 transition-all duration-400"
              >
                <div className="flex gap-0.5 mb-6">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={13} className="text-[#C9A84C] fill-[#C9A84C]" />
                  ))}
                </div>
                <p className="text-white/55 font-sans text-sm leading-relaxed italic flex-1 mb-8">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="thin-divider mb-6" />
                <p className="text-white font-serif text-lg">{t.name}</p>
                <p className="text-white/30 text-xs font-sans tracking-wide mt-1">{t.location}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 px-6 lg:px-10 bg-[#080808] border-t border-[#C9A84C]/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-[#C9A84C] text-[10px] tracking-[0.3em] uppercase font-sans mb-4">Find Us</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white">Location & Contact</h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              {[
                { icon: <MapPin size={16} className="text-[#C9A84C]" />, label: "Address", value: "425 Park Avenue, New York, NY 10022" },
                { icon: <Phone size={16} className="text-[#C9A84C]" />, label: "Phone", value: "+1 (212) 555-0199" },
                { icon: <Mail size={16} className="text-[#C9A84C]" />, label: "Email", value: "hello@luxurymotors.com" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-5 bg-[#111111] border border-white/[0.07] p-5">
                  <span className="mt-0.5 shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-white/30 text-[10px] font-sans uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="text-white font-sans text-sm">{item.value}</p>
                  </div>
                </div>
              ))}

              {/* Hours */}
              <div className="flex items-start gap-5 bg-[#111111] border border-white/[0.07] p-5">
                <Clock size={16} className="text-[#C9A84C] mt-0.5 shrink-0" />
                <div className="w-full">
                  <p className="text-white/30 text-[10px] font-sans uppercase tracking-widest mb-4">Hours</p>
                  <div className="space-y-2.5">
                    {[
                      ["Monday – Friday", "9:00 AM – 7:00 PM"],
                      ["Saturday", "10:00 AM – 6:00 PM"],
                      ["Sunday", "By Appointment Only"],
                    ].map(([day, hrs]) => (
                      <div key={day} className="flex justify-between text-sm font-sans">
                        <span className="text-white/45">{day}</span>
                        <span className="text-[#C9A84C]">{hrs}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
              className="h-72 lg:h-auto min-h-[320px] border border-white/[0.07] overflow-hidden"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215573291842!2d-73.97123492421054!3d40.75986287138795!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c258e37aede5ed%3A0x9bd5b51975e2d9c4!2sPark%20Ave%2C%20New%20York%2C%20NY!5e0!3m2!1sen!2sus!4v1716000000000!5m2!1sen!2sus"
                width="100%" height="100%"
                style={{ border: 0, filter: "grayscale(100%) invert(90%) contrast(80%) brightness(0.4)" }}
                allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Luxury Motors Location"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
