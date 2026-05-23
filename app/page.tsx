'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import CarCard, { type DisplayCar } from '@/components/CarCard';
import FilterSidebar from '@/components/FilterSidebar';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import CarFinder from '@/components/CarFinder';
import * as api from '@/lib/api';
import type { VehicleListItem, VehicleFilters } from '@/lib/types';
import InstagramShowcase from '@/components/InstagramShowcase';

function toDisplayCar(v: VehicleListItem): DisplayCar {
  return {
    id: v.id,
    title: v.title,
    make: v.make,
    year: v.year,
    price: v.price_on_call ? 'Call' : v.price,
    images: v.images,
    mileage: v.mileage,
    color: v.color,
  };
}

function inPriceRange(price: string, rangeId: string): boolean {
  const p = parseFloat(price);
  if (isNaN(p)) return false;
  if (rangeId === 'under-15k') return p < 15000;
  if (rangeId === '15k-20k') return p >= 15000 && p < 20000;
  if (rangeId === '20k-25k') return p >= 20000 && p < 25000;
  if (rangeId === '25k-plus') return p >= 25000;
  return false;
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [selectedMakes, setSelectedMakes] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [isFinderOpen, setIsFinderOpen] = useState(false);

  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allMakes, setAllMakes] = useState<string[]>([]);
  const [allYears, setAllYears] = useState<number[]>([]);
  const allMakesPopulated = useRef(false);

  const fetchVehicles = useCallback(async (opts: {
    search?: string;
    makes?: string[];
    years?: number[];
    priceRanges?: string[];
  } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const filters: VehicleFilters = { page_size: 50 };
      if (opts.search) filters.search = opts.search;
      if (opts.makes?.length === 1) filters.make = opts.makes[0];
      if (opts.years?.length === 1) filters.year_min = opts.years[0];

      const data = await api.getVehicles(filters);

      // Populate sidebar options once from an unfiltered fetch
      if (!allMakesPopulated.current && !opts.search && !opts.makes?.length && !opts.years?.length) {
        const makes = Array.from(new Set(data.items.map(v => v.make))).sort();
        const years = Array.from(new Set(data.items.map(v => v.year))).sort((a, b) => b - a);
        setAllMakes(makes);
        setAllYears(years);
        allMakesPopulated.current = true;
      }

      // Client-side multi-select filtering (API handles search/single make/year)
      let items = data.items;
      if (opts.makes && opts.makes.length > 1) {
        items = items.filter(v => opts.makes!.includes(v.make));
      }
      if (opts.years && opts.years.length > 1) {
        items = items.filter(v => opts.years!.includes(v.year));
      }
      if (opts.priceRanges?.length) {
        items = items.filter(v => opts.priceRanges!.some(r => inPriceRange(v.price, r)));
      }

      setVehicles(items);
      setTotal(items.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search, immediate for filter changes
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchVehicles({ search: query, makes: selectedMakes, years: selectedYears, priceRanges: selectedPriceRanges });
    }, query ? 350 : 0);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, selectedMakes, selectedYears, selectedPriceRanges, fetchVehicles]);

  const toggleMake = (make: string) =>
    setSelectedMakes(prev => prev.includes(make) ? prev.filter(m => m !== make) : [...prev, make]);
  const toggleYear = (year: number) =>
    setSelectedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  const togglePriceRange = (range: string) =>
    setSelectedPriceRanges(prev => prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]);
  const clearAll = () => {
    setSelectedMakes([]);
    setSelectedYears([]);
    setSelectedPriceRanges([]);
    setQuery('');
  };

  return (
    <div className="min-h-screen bg-[#EEF2F7]">

      <Header query={query} onQueryChange={setQuery} />

      <HeroSection onOpenFinder={() => setIsFinderOpen(true)} />

      <CarFinder isOpen={isFinderOpen} onClose={() => setIsFinderOpen(false)} />

      <main className="w-full px-5 py-8 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          <FilterSidebar
            makes={allMakes}
            years={allYears}
            filters={{ selectedMakes, selectedYears, selectedPriceRanges }}
            onMakeChange={toggleMake}
            onYearChange={toggleYear}
            onPriceRangeChange={togglePriceRange}
            onClearAll={clearAll}
          />

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
                    {loading ? 'Loading…' : `${total} vehicle${total !== 1 ? 's' : ''} available`}
                    {query && !loading && <> · &ldquo;{query}&rdquo;</>}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="py-8 text-center">
                <p className="text-red-500 text-sm">{error}</p>
                <p className="mt-1 text-slate-400 text-xs">Make sure the backend is running on port 8000.</p>
              </div>
            )}

            {loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
                    <div className="aspect-[4/2.85] bg-slate-200" />
                    <div className="p-3.5 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                      <div className="h-4 bg-slate-200 rounded w-4/5" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-8 bg-slate-200 rounded mt-3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && vehicles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                {vehicles.map(v => (
                  <CarCard key={v.id} car={toDisplayCar(v)} />
                ))}
              </div>
            )}

            {!loading && !error && vehicles.length === 0 && (
              <div className="py-24 text-center">
                <p className="text-lg text-slate-400">No vehicles found</p>
                <button onClick={clearAll} className="mt-4 text-[#FF5500] hover:underline">
                  Clear filters
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
      <InstagramShowcase />

      <footer className="mt-12 bg-slate-950 text-white py-10">
        <div className="text-center">
          <h3 className="text-3xl font-black tracking-[5px]">NOVA</h3>
          <p className="mt-1 text-xs uppercase tracking-[7px] text-[#FF5500]">MOTORS</p>
        </div>
      </footer>

    </div>
  );
}
