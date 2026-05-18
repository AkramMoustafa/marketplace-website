'use client';

import { Search, Phone, MapPin } from 'lucide-react';

interface HeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
}

const NAV_LINKS = [
  'HOME', 'INVENTORY', 'FINANCING', 'PRE-APPROVAL',
  'TRADE-IN', 'SERVICE', 'CONTACT', 'REVIEWS', 'ESPAÑOL',
];

/* ─── Brand SVG icons ──────────────────────────────────────────────────── */

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

const SOCIALS = [
  { label: 'Facebook',  Icon: FacebookIcon  },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'X',         Icon: XIcon         },
] as const;

/* ─── Component ────────────────────────────────────────────────────────── */

export default function Header({ query, onQueryChange }: HeaderProps) {
  return (
    <>

      {/* ── TOP STRIP ─────────────────────────────────────────────────── */}
      <div className="bg-slate-950 border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-1.5 flex items-center justify-between">

          {/* Location + phone */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5">
              <MapPin size={10} className="text-[#FF5500] shrink-0" />
              <span className="text-[10px] text-slate-400 tracking-wide">
                2940 East 8 Mile, Detroit MI 48234
              </span>
            </div>

            {/* Divider */}
            <span className="hidden sm:block h-3 w-px bg-white/[0.12]" />

            <div className="flex items-center gap-1.5">
              <Phone size={10} className="text-[#FF5500] shrink-0" />
              <a
                href="tel:3132517447"
                className="text-[10px] text-slate-400 hover:text-white transition-colors duration-200"
              >
                (313) 251-7447
              </a>
            </div>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-[8px] font-bold uppercase tracking-[2.5px] text-slate-600">
              Follow Us
            </span>
            <div className="flex items-center gap-3.5">
              {SOCIALS.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="text-slate-500 hover:text-slate-200 hover:scale-110 transition-all duration-200"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── MAIN HEADER ───────────────────────────────────────────────── */}
      <header className="bg-white">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-4 flex flex-col lg:flex-row items-center gap-4 lg:gap-8">

          {/* LOGO — amber left accent bar anchors the mark */}
          <div className="flex items-stretch gap-4 shrink-0">
            <div className="w-[4px] self-stretch bg-[#FF5500] rounded-full" />
            <div>
              <div className="text-[3.5rem] font-black tracking-[5px] text-slate-900 leading-none">
                NOVA
              </div>
              <div className="text-[9px] font-black tracking-[10px] text-[#FF5500] mt-1.5 ml-[1px]">
                MOTORS
              </div>
            </div>
          </div>

          {/* CENTER — contact block, visible on large screens only */}
          <div className="hidden lg:flex flex-1 flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs tracking-wide">
              <MapPin size={12} className="text-[#FF5500] shrink-0" />
              <span>2940 East 8 Mile Road, Detroit, MI 48234</span>
            </div>
            <a
              href="tel:3132517447"
              className="flex items-center gap-2 text-[1.1rem] font-bold text-slate-800 hover:text-[#FF5500] transition-colors duration-200 tracking-wide"
            >
              <Phone size={14} className="text-[#FF5500] shrink-0" />
              (313) 251-7447
            </a>
          </div>

          {/* RIGHT — search + CTA */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto">

            {/* Search — rounded pill with soft shadow */}
            <div className="relative flex-1 lg:w-52 xl:w-60">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search vehicles…"
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-2.5 rounded-full
                  border border-slate-200 bg-slate-50
                  text-sm text-slate-700 placeholder:text-slate-400
                  shadow-sm
                  focus:outline-none focus:border-[#FF5500]
                  focus:ring-2 focus:ring-[#FF5500]/20 focus:bg-white
                  transition-all duration-200
                "
              />
            </div>

            {/* View Inventory CTA */}
            <a
              href="#inventory"
              className="
                shrink-0 px-5 py-2.5 rounded-full
                bg-[#FF5500] text-black
                text-[10.5px] font-black uppercase tracking-[1.5px]
                whitespace-nowrap
                hover:bg-[#FF5500] hover:-translate-y-px
                hover:shadow-md hover:shadow-[#FF5500]/20
                active:translate-y-0 active:shadow-none
                transition-all duration-200
              "
            >
              View Inventory
            </a>

          </div>

        </div>

        {/* Subtle amber rule — separates header from nav */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#FF5500]/35 to-transparent" />
      </header>

      {/* ── NAVBAR ────────────────────────────────────────────────────── */}
      <nav className="bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex flex-wrap items-center">
            {NAV_LINKS.map((link, i) => {
              const active = i === 0;
              return (
                <li key={link} className="relative">
                  <a
                    href="#"
                    className={`
                      relative group block px-4 py-[14px]
                      text-xs font-bold tracking-[1px]
                      transition-colors duration-200
                      ${active ? 'text-[#FF5500]' : 'text-slate-300 hover:text-[#FF5500]'}
                    `}
                  >
                    {/* Active: very soft amber tint behind text */}
                    {active && (
                      <span className="absolute inset-0 bg-[#FF5500]/[0.07]" aria-hidden />
                    )}

                    <span className="relative z-10">{link}</span>

                    {/* Bottom accent line:
                        active = always full width
                        hover  = slides in from left (w-0 → w-full) */}
                    <span
                      className={`
                        absolute bottom-0 left-0 h-[2px] rounded-full bg-[#FF5500]
                        transition-all duration-300 ease-out
                        ${active ? 'w-full' : 'w-0 group-hover:w-full'}
                      `}
                      aria-hidden
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

    </>
  );
}
