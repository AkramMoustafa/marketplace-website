'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Phone, Menu, X, ChevronRight } from 'lucide-react';

const NAV = [
  { label: 'Home',      href: '/'         },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Contact',   href: '/contact'   },
  { label: 'Reviews',   href: '/reviews'   },
];

interface PremiumHeaderProps {
  query?: string;
  onQueryChange?: (value: string) => void;
}

export default function PremiumHeader({ query = '', onQueryChange }: PremiumHeaderProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when it opens
  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">

        {/* ── Main bar ─────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center h-[68px] gap-8">

            {/* Logo — wordmark, left */}
            <Link href="/" className="shrink-0 flex flex-col leading-none group mr-4 lg:mr-0">
              <span className="text-[1.25rem] font-black tracking-[6px] text-gray-900 group-hover:text-gray-600 transition-colors duration-200">
                NOVA
              </span>
              <span className="text-[7px] tracking-[4px] text-gray-400 font-semibold mt-[4px]">
                MOTORS
              </span>
            </Link>

            {/* Nav links — centered on large screens */}
            <nav className="hidden lg:flex flex-1 justify-center items-center gap-9">
              {NAV.map(({ label, href }) => {
                const active =
                  pathname === href ||
                  (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative group text-[11px] font-semibold tracking-[1.2px] uppercase transition-colors duration-200 ${
                      active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-800'
                    }`}
                  >
                    {label}
                    {/* Sliding underline */}
                    <span
                      className={`absolute -bottom-[22px] left-0 h-[2px] bg-gray-900 transition-all duration-300 ease-out ${
                        active ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                      aria-hidden
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Right-side actions */}
            <div className="flex items-center gap-3 ml-auto lg:ml-0">

              {/* Phone — visible from xl up */}
              <a
                href="tel:3132517447"
                className="hidden xl:flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors duration-200 whitespace-nowrap"
              >
                <Phone size={12} className="shrink-0" />
                (313) 251-7447
              </a>

              {/* Vertical divider */}
              <span className="hidden xl:block w-px h-4 bg-gray-200" aria-hidden />

              {/* Search icon toggle */}
              <button
                onClick={() => setSearchOpen(s => !s)}
                aria-label={searchOpen ? 'Close search' : 'Search vehicles'}
                className={`flex items-center justify-center w-8 h-8 transition-colors duration-200 ${
                  searchOpen ? 'text-gray-900' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {searchOpen ? <X size={17} /> : <Search size={17} />}
              </button>

              {/* Primary CTA — square, dark */}
              <Link
                href="/inventory"
                className="hidden sm:inline-flex items-center px-5 py-2.5 bg-gray-900 text-white text-[10px] font-bold tracking-[1.5px] uppercase hover:bg-gray-700 transition-colors duration-200 whitespace-nowrap"
              >
                View Inventory
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(s => !s)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                className="lg:hidden flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-900 transition-colors"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* ── Search bar — animates in below main bar ─────────────── */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              searchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="pb-3 pt-1">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by make, model, or keyword…"
                  value={query}
                  onChange={e => onQueryChange?.(e.target.value)}
                  className="
                    w-full pl-11 pr-4 py-3
                    bg-gray-50 border border-gray-200
                    text-sm text-gray-900 placeholder:text-gray-400
                    focus:outline-none focus:bg-white focus:border-gray-400
                    transition-all duration-200
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile menu — fixed overlay below header ─────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ top: 68 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel */}
          <div className="relative bg-white w-full shadow-xl">

            {/* Nav links */}
            <nav className="px-6">
              {NAV.map(({ label, href }) => {
                const active =
                  pathname === href ||
                  (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between py-4 border-b border-gray-100 text-sm font-semibold tracking-wide transition-colors ${
                      active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {label}
                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                  </Link>
                );
              })}
            </nav>

            {/* Bottom contact + CTA */}
            <div className="px-6 py-5 space-y-3">
              <a
                href="tel:3132517447"
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <Phone size={14} className="shrink-0" />
                (313) 251-7447
              </a>
              <Link
                href="/inventory"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-full py-3 bg-gray-900 text-white text-[10px] font-bold tracking-[2px] uppercase hover:bg-gray-700 transition-colors"
              >
                View Inventory
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
