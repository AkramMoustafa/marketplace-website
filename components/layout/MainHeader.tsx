'use client';

import { Search, Phone, MapPin } from 'lucide-react';

interface MainHeaderProps {
  query?: string;
  onQueryChange?: (value: string) => void;
}

export default function MainHeader({ query = '', onQueryChange }: MainHeaderProps) {
  return (
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

        {/* CENTER — contact block, large screens only */}
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
              onChange={e => onQueryChange?.(e.target.value)}
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
            href="/"
            className="
              shrink-0 px-5 py-2.5 rounded-full
              bg-[#FF5500] text-black
              text-[10.5px] font-black uppercase tracking-[1.5px]
              whitespace-nowrap
              hover:-translate-y-px
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
  );
}
