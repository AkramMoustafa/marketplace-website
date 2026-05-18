import Image from 'next/image';
import { MapPin } from 'lucide-react';

// Front-on Charger — high-energy, fills the frame.
// Replace with a road/action shot for production.
import heroImage from '@/assets/charger-2.jpg';

const STATS = [
  { value: '500+',    label: 'Vehicles'       },
  { value: '24hr',    label: 'Financing'      },
  { value: 'Detroit', label: 'Trusted Dealer' },
] as const;

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[460px] lg:h-[560px] bg-slate-900 overflow-hidden">

      {/* ── VEHICLE IMAGE ──────────────────────────────────────────────
          No slow-zoom — static bold presence, not cinematic.
          object-[56%_48%] frames the grille center-right so the car
          bleeds into the content zone without completely hiding it.
      ────────────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt="Premium vehicles at Nova Motors Detroit"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[56%_48%]"
        />
      </div>

      {/* ── SINGLE GRADIENT SCRIM ──────────────────────────────────────
          One lean left-to-right scrim only — car reads clearly,
          not buried under luxury darkness.
      ────────────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-r
        from-slate-900
        via-slate-900/45
        to-slate-900/[0.02]" />

      {/* Mobile: flat blanket so text stays readable */}
      <div className="absolute inset-0 bg-slate-900/55 lg:hidden" />

      {/* Amber heat — energetic, not ambient luxury */}
      <div className="pointer-events-none absolute -bottom-10 left-[28%]
        w-[300px] h-[160px] rounded-full
        bg-amber-500/[0.1] blur-[70px]" />

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      <div className="relative z-10 h-full max-w-7xl mx-auto
        px-6 lg:px-12 flex items-center py-12 lg:py-0">

        <div className="max-w-[580px]">

          {/* Dealer badge — solid, reads instantly */}
          <div
            className="hero-animate inline-flex items-center gap-1.5
              px-3 py-1.5 rounded bg-amber-500 text-black mb-4"
            style={{ animationDelay: '40ms' }}
          >
            <MapPin size={10} strokeWidth={3} className="shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-[2.5px]">
              Detroit, MI · Trusted Dealer
            </span>
          </div>

          {/* Headline — maximum weight, minimum leading */}
          <h1
            className="hero-animate font-sans font-black text-white
              uppercase tracking-tight leading-[0.88]
              text-[3.8rem] lg:text-[5.6rem]"
            style={{ animationDelay: '140ms' }}
          >
            FIND YOUR<br />DREAM RIDE
          </h1>

          {/* Subheadline */}
          <p
            className="hero-animate mt-4 text-slate-300 text-base max-w-[340px] leading-snug"
            style={{ animationDelay: '250ms' }}
          >
            Browse our inventory and drive home today.
          </p>

          {/* CTAs */}
          <div
            className="hero-animate mt-6 flex flex-wrap gap-3"
            style={{ animationDelay: '350ms' }}
          >
            <a
              href="#inventory"
              className="inline-flex items-center
                px-8 py-4 rounded-xl
                bg-amber-500 text-black
                text-sm font-black uppercase tracking-[1.5px]
                hover:bg-amber-400 hover:-translate-y-0.5
                hover:shadow-xl hover:shadow-amber-500/30
                active:translate-y-0 active:shadow-none
                transition-all duration-200"
            >
              SHOP INVENTORY
            </a>

            <a
              href="#pre-approval"
              className="inline-flex items-center
                px-8 py-4 rounded-xl
                border-2 border-white/30 text-white
                text-sm font-black uppercase tracking-[1.5px]
                hover:border-white/55 hover:bg-white/[0.08]
                hover:-translate-y-0.5 active:translate-y-0
                transition-all duration-200"
            >
              GET APPROVED
            </a>
          </div>

          {/* Stats */}
          <div
            className="hero-animate mt-7 pt-5 border-t border-white/[0.12]"
            style={{ animationDelay: '460ms' }}
          >
            <div className="flex items-center gap-5 sm:gap-7">
              {STATS.map(({ value, label }, i) => (
                <div key={label} className="flex items-center gap-5 sm:gap-7">
                  {i > 0 && <div className="h-6 w-px shrink-0 bg-white/[0.12]" />}
                  <div>
                    <p className="text-[1.75rem] font-black text-amber-400 leading-none">
                      {value}
                    </p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[1.5px] text-slate-500">
                      {label}
                    </p>
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
