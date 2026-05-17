'use client';

import { useState } from 'react';
import { Search, Phone, MapPin } from 'lucide-react';
import CarCard from '@/components/CarCard';
import { cars } from '@/lib/data';

const NAV_LINKS = [
  'HOME',
  'INVENTORY',
  'FINANCING',
  'GET PRE-QUALIFIED',
  'SELL/TRADE',
  'SERVICE',
  'CONTACT US',
  'REVIEWS',
  'Español',
];

export default function HomePage() {
  const [query, setQuery] = useState('');

  const filtered = cars.filter(car =>
    car.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center gap-4">

          {/* Logo */}
          <div className="flex-shrink-0">
            <span
              className="logo-cursive text-5xl text-red-600 leading-none select-none"
              style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
            >
              Empire Auto
            </span>
          </div>

          {/* Address + Phone */}
          <div className="flex flex-col items-center md:items-start gap-1 flex-1 md:pl-8">
            <div className="flex items-center gap-1.5 text-gray-600 text-sm">
              <MapPin size={14} className="text-red-600 shrink-0" />
              <span>2940 EAST 8 MILE DETROIT, MI 48234</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700 font-semibold text-sm">
              <Phone size={14} className="text-red-600 shrink-0" />
              <a href="tel:3132517447" className="hover:text-red-600 transition-colors">
                (313) 251-7447
              </a>
            </div>
          </div>

          {/* Search bar */}
          <div className="w-full md:w-72">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search inventory…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── NAV BAR ────────────────────────────────────────── */}
      <nav className="bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex flex-wrap items-center">
            {NAV_LINKS.map((link, i) => (
              <li key={link}>
                <a
                  href="#"
                  className={`block px-3 py-3 text-xs font-semibold tracking-wide whitespace-nowrap transition-colors ${
                    i === 0
                      ? 'text-white bg-red-600 hover:bg-red-700'
                      : 'text-gray-200 hover:text-red-400'
                  }`}
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── INVENTORY SECTION ──────────────────────────────── */}
     <main className="w-full px-6 py-10">

        {/* Section heading */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
            Our Inventory
          </h2>
          <div className="mt-2 h-1 w-16 bg-red-600 rounded" />
        </div>

        {/* Results count */}
        {query && (
          <p className="text-sm text-gray-500 mb-4">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{query}&quot;
          </p>
        )}

        {/* Grid */}
        {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
          {filtered.map(car => (
            <CarCard key={car.id} car={car} />
          ))}
</div>
        ) : (
          <div className="py-20 text-center text-gray-400">
            <p className="text-lg">No vehicles match &quot;{query}&quot;</p>
            <button
              onClick={() => setQuery('')}
              className="mt-3 text-red-600 text-sm hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-black text-white mt-16 py-8 px-4 text-center">
        <p
          className="logo-cursive text-3xl text-red-500 mb-2"
          style={{ fontFamily: "'Dancing Script', 'Brush Script MT', cursive" }}
        >
          Empire Auto
        </p>
        <p className="text-gray-400 text-sm">2940 East 8 Mile Detroit, MI 48234</p>
        <p className="text-gray-400 text-sm mt-1">
          <a href="tel:3132517447" className="hover:text-red-400 transition-colors">(313) 251-7447</a>
        </p>
        <p className="text-gray-600 text-xs mt-4">
          &copy; {new Date().getFullYear()} Empire Auto. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
