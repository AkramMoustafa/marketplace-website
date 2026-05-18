'use client';

import { useState } from 'react';
import CarCard from '@/components/CarCard';
import FilterSidebar from '@/components/FilterSidebar';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import { cars } from '@/lib/data';

const allMakes = Array.from(new Set(cars.map(c => c.make))).sort();
const allYears = Array.from(new Set(cars.map(c => c.year))).sort((a, b) => b - a);

function inPriceRange(price: number | 'Call', rangeId: string): boolean {
  if (typeof price !== 'number') return false;
  if (rangeId === 'under-15k') return price < 15000;
  if (rangeId === '15k-20k') return price >= 15000 && price < 20000;
  if (rangeId === '20k-25k') return price >= 20000 && price < 25000;
  if (rangeId === '25k-plus') return price >= 25000;
  return false;
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);

  const toggleMake = (make: string) =>
    setSelectedMakes(prev =>
      prev.includes(make) ? prev.filter(m => m !== make) : [...prev, make]
    );

  const toggleYear = (year: number) =>
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );

  const togglePriceRange = (range: string) =>
    setSelectedPriceRanges(prev =>
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );

  const clearAll = () => {
    setSelectedMakes([]);
    setSelectedYears([]);
    setSelectedPriceRanges([]);
    setQuery('');
  };

  const filtered = cars.filter(car => {
    if (query && !car.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (selectedMakes.length && !selectedMakes.includes(car.make)) return false;
    if (selectedYears.length && !selectedYears.includes(car.year)) return false;
    if (selectedPriceRanges.length && !selectedPriceRanges.some(r => inPriceRange(car.price, r))) return false;
    return true;
  });

  const activeFilterCount = selectedMakes.length + selectedYears.length + selectedPriceRanges.length;
  const hasActiveFilters = !!query || activeFilterCount > 0;

  return (
    <div className="min-h-screen bg-[#EEF2F7]">

      <Header query={query} onQueryChange={setQuery} />

      {/* HERO */}
      <HeroSection />

      {/* INVENTORY */}
      <main className="w-full px-5 py-8 lg:py-10">

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* SIDEBAR */}
          <FilterSidebar
            makes={allMakes}
            years={allYears}
            filters={{ selectedMakes, selectedYears, selectedPriceRanges }}
            onMakeChange={toggleMake}
            onYearChange={toggleYear}
            onPriceRangeChange={togglePriceRange}
            onClearAll={clearAll}
          />

          {/* INVENTORY CONTENT */}
          <div className="flex-1 min-w-0">

            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">

              <div>
                <h2 className="font-sans font-black uppercase tracking-tight text-slate-900
                  text-4xl lg:text-5xl leading-none">
                  Featured Inventory
                </h2>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="h-[3px] w-12 bg-[#FF5500] rounded-full" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    {filtered.length} vehicle{filtered.length !== 1 ? 's' : ''} available
                    {query && <> · &ldquo;{query}&rdquo;</>}
                  </span>
                </div>
              </div>

            </div>

            {filtered.length > 0 ? (

              <div className="
                grid
                grid-cols-1
                sm:grid-cols-2
                md:grid-cols-3
                xl:grid-cols-4
                gap-2
              ">
                {filtered.map(car => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>

            ) : (

              <div className="py-24 text-center">
                <p className="text-lg text-slate-400">No vehicles found</p>
                <button
                  onClick={clearAll}
                  className="mt-4 text-[#FF5500] hover:underline"
                >
                  Clear filters
                </button>
              </div>

            )}

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="
        mt-12

        bg-slate-950

        text-white

        py-10
      ">

        <div className="text-center">

          <h3 className="
            text-3xl
            font-black

            tracking-[5px]
          ">
            NOVA
          </h3>

          <p className="
            mt-1

            text-xs
            uppercase

            tracking-[7px]

            text-[#FF5500]
          ">
            MOTORS
          </p>

        </div>

      </footer>

    </div>
  );
}