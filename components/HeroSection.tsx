import Image from 'next/image';
import { Car, CreditCard, MapPin } from 'lucide-react';

// TODO: Replace with a cinematic road/action vehicle photo.
// Using best available inventory asset as placeholder.
import heroImage from '@/assets/xt4-1.jpg';

const STATS = [
  { Icon: Car,        value: '500+',   label: 'Vehicles'       },
  { Icon: CreditCard, value: 'Easy',   label: 'Financing'      },
  { Icon: MapPin,     value: 'Detroit', label: 'Trusted Dealer' },
] as const;

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[520px] lg:h-[670px] bg-slate-950 overflow-hidden">

      {/* ── VEHICLE IMAGE ─────────────────────────────────────────────────
          Slow auto-zoom (9 s, once) adds cinematic life to the still photo.
          object-[62%_center] shifts the frame so the car's front grille
          sits in the center-right, bleeding slightly into the content zone.
      ─────────────────────────────────────────────────────────────────── */}
      <div className="hero-zoom absolute inset-0">
        <Image
          src={heroImage}
          alt="Nova Motors — Premium Vehicles, Detroit MI"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center]"
        />
      </div>

      {/* ── GRADIENT LAYERS (order matters) ───────────────────────────── */}

      {/* 1. Left scrim — primary text protection, car bleeds into text zone */}
      <div className="absolute inset-0 bg-gradient-to-r
        from-slate-950
        via-slate-950/72
        to-slate-950/10" />

      {/* 2. Top vignette */}
      <div className="absolute inset-0 bg-gradient-to-b
        from-slate-950/55
        via-transparent
        to-transparent" />

      {/* 3. Bottom vignette — eases into inventory section */}
      <div className="absolute inset-0 bg-gradient-to-t
        from-slate-950/85
        via-slate-950/25
        to-transparent" />

      {/* 4. Mobile: extra blanket so text is always readable */}
      <div className="absolute inset-0 bg-slate-950/50 lg:hidden" />

      {/* ── AMBIENT GLOWS ─────────────────────────────────────────────── */}

      {/* Warm amber — bottom-right, adds dealership warmth */}
      <div className="pointer-events-none absolute -bottom-28 right-[6%]
        h-[380px] w-[620px] rounded-full
        bg-amber-500/[0.07] blur-[140px]" />

      {/* Cool blue-navy — top-left, counterbalances warm, adds depth */}
      <div className="pointer-events-none absolute -left-20 -top-20
        h-[480px] w-[520px] rounded-full
        bg-blue-900/[0.28] blur-[110px]" />

      {/* ── GRAIN TEXTURE (micro-detail, very subtle) ─────────────────── */}
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.18]" />

      {/* ── CONTENT ───────────────────────────────────────────────────── */}
      <div className="relative z-10 h-full max-w-7xl mx-auto
        px-6 lg:px-12 flex items-center py-24 lg:py-0">

        <div className="max-w-[540px]">

          {/* Badge */}
          <div
            className="hero-animate inline-flex items-center gap-2.5
              rounded-full border border-amber-500/30 bg-amber-500/[0.08]
              px-3.5 py-1.5 mb-7"
            style={{ animationDelay: '60ms' }}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            <span className="text-[9px] font-black uppercase tracking-[3.5px] text-amber-400">
              Detroit&apos;s Premier Dealership
            </span>
          </div>

          {/* Headline */}
          <h1
            className="hero-animate font-serif font-bold text-white
              text-[3.1rem] lg:text-[4.1rem]
              leading-[1.06] tracking-tight"
            style={{ animationDelay: '190ms' }}
          >
            Find Your<br />Dream Ride
          </h1>

          {/* Subheadline */}
          <p
            className="hero-animate mt-5 max-w-[380px]
              text-[15px] lg:text-base text-slate-400 leading-relaxed"
            style={{ animationDelay: '310ms' }}
          >
            Premium inventory. Financing solutions.
            <br className="hidden sm:block" />
            Ready to drive today.
          </p>

          {/* CTAs */}
          <div
            className="hero-animate mt-8 flex flex-wrap gap-3"
            style={{ animationDelay: '430ms' }}
          >
            <a
              href="#inventory"
              className="inline-flex items-center
                px-7 py-3.5 rounded-lg
                bg-amber-500 text-black
                text-[11px] font-black uppercase tracking-[1.5px]
                hover:bg-amber-400 hover:-translate-y-0.5
                hover:shadow-xl hover:shadow-amber-500/25
                active:translate-y-0 active:shadow-none
                transition-all duration-200"
            >
              Browse Inventory
            </a>

            <a
              href="#pre-approval"
              className="inline-flex items-center
                px-7 py-3.5 rounded-lg
                border border-white/20 bg-white/[0.05] backdrop-blur-sm
                text-[11px] font-bold uppercase tracking-[1.5px] text-white/90
                hover:border-white/40 hover:bg-white/10
                hover:-translate-y-0.5 active:translate-y-0
                transition-all duration-200"
            >
              Get Pre-Approved
            </a>
          </div>

          {/* Stats row */}
          <div
            className="hero-animate mt-10 pt-8 border-t border-white/[0.1]"
            style={{ animationDelay: '560ms' }}
          >
            <div className="flex items-center gap-7 sm:gap-10">
              {STATS.map(({ Icon, value, label }, i) => (
                <div key={label} className="flex items-center gap-7 sm:gap-10">

                  {i > 0 && (
                    <div className="h-8 w-px shrink-0 bg-white/[0.1]" />
                  )}

                  <div className="flex items-start gap-2.5">
                    <Icon
                      size={14}
                      className="mt-1 shrink-0 text-amber-500"
                      strokeWidth={2.5}
                    />
                    <div>
                      <p className="text-[1.3rem] font-black text-white leading-none">
                        {value}
                      </p>
                      <p className="mt-1 text-[9px] font-semibold uppercase
                        tracking-[1.5px] text-slate-500">
                        {label}
                      </p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </section>
  );
}
