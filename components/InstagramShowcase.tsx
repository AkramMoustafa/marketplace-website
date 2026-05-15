"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { InstagramIcon } from "@/components/icons";

const posts = [
  { id: 1,  url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80",  likes: 2841 },
  { id: 2,  url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80",  likes: 1932 },
  { id: 3,  url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",  likes: 3204 },
  { id: 4,  url: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=600&q=80",  likes: 4121 },
  { id: 5,  url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",  likes: 1876 },
  { id: 6,  url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80",  likes: 2567 },
  { id: 7,  url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80",  likes: 3892 },
  { id: 8,  url: "https://images.unsplash.com/photo-1574023278400-dfc81d20f4b1?w=600&q=80",  likes: 1654 },
  { id: 9,  url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80",  likes: 2298 },
  { id: 10, url: "https://images.unsplash.com/photo-1617531653332-bd46c16f4d68?w=600&q=80",  likes: 3110 },
  { id: 11, url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&q=80",  likes: 1780 },
  { id: 12, url: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=600&q=80",  likes: 2940 },
  { id: 13, url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80",  likes: 2100 },
  { id: 14, url: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&q=80",  likes: 3560 },
  { id: 15, url: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80",  likes: 1490 },
];

const STEP = 3;

export default function InstagramShowcase() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const tile = el.firstElementChild as HTMLElement | null;
    const w = tile ? tile.offsetWidth + 8 : 220;
    el.scrollBy({ left: dir === "right" ? w * STEP : -w * STEP, behavior: "smooth" });
    setTimeout(sync, 320);
  };

  return (
    <section className="py-20 bg-[#080808] border-y border-[#C9A84C]/10">
      {/* Header */}
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <InstagramIcon size={16} className="text-[#C9A84C]" />
              <span className="text-[#C9A84C] text-[10px] font-sans tracking-[0.25em] uppercase">
                Follow Our Journey
              </span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-white">@luxurymotors</h2>
          </div>

          <div className="flex items-center gap-8">
            {[
              { label: "Followers", value: "48.2K" },
              { label: "Posts",     value: "312"   },
              { label: "Following", value: "180"   },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-serif text-[#C9A84C] text-xl">{s.value}</p>
                <p className="text-white/30 text-[10px] font-sans tracking-widest uppercase mt-1">{s.label}</p>
              </div>
            ))}

            <a
              href="#"
              className="hidden sm:inline-flex items-center gap-2 border border-[#C9A84C]/50 text-[#C9A84C] text-[10px] tracking-[0.18em] uppercase px-5 py-2.5 font-sans hover:bg-[#C9A84C] hover:text-black transition-all duration-300"
            >
              <InstagramIcon size={13} /> Follow
            </a>
          </div>
        </motion.div>
      </div>

      {/* Carousel strip */}
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          disabled={!canLeft}
          className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${
            canLeft
              ? "bg-black/70 border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C] hover:text-black"
              : "bg-black/30 border-white/10 text-white/15 cursor-not-allowed"
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft size={17} />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          disabled={!canRight}
          className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-sm transition-all duration-200 ${
            canRight
              ? "bg-black/70 border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C] hover:text-black"
              : "bg-black/30 border-white/10 text-white/15 cursor-not-allowed"
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight size={17} />
        </button>

        {/* Track */}
        <div
          ref={trackRef}
          onScroll={sync}
          className="flex gap-2 overflow-x-auto scroll-smooth px-6 lg:px-10 pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(i, 7) * 0.04 }}
              className="relative shrink-0 group cursor-pointer overflow-hidden border border-white/[0.06] hover:border-[#C9A84C]/40 transition-colors duration-300"
              style={{ width: "clamp(140px, 15vw, 210px)", aspectRatio: "1" }}
            >
              <Image
                src={post.url}
                alt={`Post ${post.id}`}
                fill
                sizes="210px"
                className="object-cover transition-transform duration-500 group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/55 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-1.5">
                  <Heart size={22} className="text-white fill-white" />
                  <span className="text-white text-xs font-sans font-semibold">
                    {post.likes.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile follow */}
      <div className="sm:hidden text-center mt-8 px-6">
        <a
          href="#"
          className="inline-flex items-center gap-2 border border-[#C9A84C]/50 text-[#C9A84C] text-[10px] tracking-[0.18em] uppercase px-6 py-3 font-sans hover:bg-[#C9A84C] hover:text-black transition-all duration-300"
        >
          <InstagramIcon size={13} /> Follow on Instagram
        </a>
      </div>
    </section>
  );
}
