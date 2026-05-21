'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import CarCard, { type DisplayCar } from '@/components/CarCard';
import * as api from '@/lib/api';
import type { VehicleListItem, TransmissionType, FuelType, VehicleStatus } from '@/lib/types';
import { SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';

function toDisplay(v: VehicleListItem): DisplayCar {
  return { id: v.id, title: v.title, make: v.make, year: v.year, price: v.price_on_call ? 'Call' : v.price, images: v.images, mileage: v.mileage };
}

const TRANSMISSION_LABELS: Record<TransmissionType, string> = {
  automatic: 'Automatic', manual: 'Manual', cvt: 'CVT', dct: 'Dual-Clutch',
};
const FUEL_LABELS: Record<FuelType, string> = {
  gasoline: 'Gasoline', diesel: 'Diesel', electric: 'Electric',
  hybrid: 'Hybrid', plug_in_hybrid: 'Plug-In Hybrid',
};

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [make, setMake] = useState('');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [transmission, setTransmission] = useState<TransmissionType | ''>('');
  const [fuelType, setFuelType] = useState<FuelType | ''>('');
  const [status, setStatus] = useState<VehicleStatus | ''>('available');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Parameters<typeof api.getVehicles>[0] = { page, page_size: 12 };
      if (search) filters.search = search;
      if (make) filters.make = make;
      if (yearMin) filters.year_min = Number(yearMin);
      if (yearMax) filters.year_max = Number(yearMax);
      if (priceMin) filters.price_min = Number(priceMin);
      if (priceMax) filters.price_max = Number(priceMax);
      if (transmission) filters.transmission = transmission;
      if (fuelType) filters.fuel_type = fuelType;
      if (status) filters.status = status;

      const data = await api.getVehicles(filters);
      setVehicles(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, search, make, yearMin, yearMax, priceMin, priceMax, transmission, fuelType, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clearFilters = () => {
    setSearch(''); setMake(''); setYearMin(''); setYearMax('');
    setPriceMin(''); setPriceMax(''); setTransmission(''); setFuelType(''); setStatus('available'); setPage(1);
  };

  const hasFilters = !!(search || make || yearMin || yearMax || priceMin || priceMax || transmission || fuelType);

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 block mb-2">Search</label>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Make, model, keyword…"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5500]" />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 block mb-2">Make</label>
        <input value={make} onChange={e => { setMake(e.target.value); setPage(1); }}
          placeholder="e.g. BMW"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5500]" />
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 block mb-2">Year</label>
        <div className="flex gap-2">
          <input value={yearMin} onChange={e => { setYearMin(e.target.value); setPage(1); }}
            placeholder="From" type="number"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5500]" />
          <input value={yearMax} onChange={e => { setYearMax(e.target.value); setPage(1); }}
            placeholder="To" type="number"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5500]" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 block mb-2">Price ($)</label>
        <div className="flex gap-2">
          <input value={priceMin} onChange={e => { setPriceMin(e.target.value); setPage(1); }}
            placeholder="Min" type="number"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5500]" />
          <input value={priceMax} onChange={e => { setPriceMax(e.target.value); setPage(1); }}
            placeholder="Max" type="number"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5500]" />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 block mb-2">Transmission</label>
        <select value={transmission} onChange={e => { setTransmission(e.target.value as TransmissionType | ''); setPage(1); }}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5500]">
          <option value="">Any</option>
          {(Object.entries(TRANSMISSION_LABELS) as [TransmissionType, string][]).map(([k, v]) =>
            <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 block mb-2">Fuel Type</label>
        <select value={fuelType} onChange={e => { setFuelType(e.target.value as FuelType | ''); setPage(1); }}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5500]">
          <option value="">Any</option>
          {(Object.entries(FUEL_LABELS) as [FuelType, string][]).map(([k, v]) =>
            <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-black uppercase tracking-[2px] text-slate-400 block mb-2">Status</label>
        <select value={status} onChange={e => { setStatus(e.target.value as VehicleStatus | ''); setPage(1); }}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF5500]">
          <option value="">All</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>
      </div>
      {hasFilters && (
        <button onClick={clearFilters}
          className="w-full py-2 text-[10px] font-black uppercase tracking-[1.5px] text-[#FF5500] hover:underline">
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EEF2F7]">

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-stretch gap-3 shrink-0">
            <div className="w-[3px] self-stretch bg-[#FF5500] rounded-full" />
            <div>
              <div className="text-2xl font-black tracking-[4px] text-slate-900 leading-none">NOVA</div>
              <div className="text-[8px] font-black tracking-[8px] text-[#FF5500] mt-1">MOTORS</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Link href="/" className="hover:text-[#FF5500] transition">Home</Link>
            <Link href="/inventory" className="text-[#FF5500]">Inventory</Link>
            <Link href="/login" className="hover:text-[#FF5500] transition">Login</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 py-8 flex gap-6 items-start">

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs font-black uppercase tracking-[2px] text-slate-900 mb-5">Filters</p>
            <FilterPanel />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="font-black text-3xl uppercase tracking-tight text-slate-900">Inventory</h1>
              <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-wide">
                {loading ? 'Loading…' : `${total} vehicles`}
              </p>
            </div>

            {/* Mobile filter button */}
            <button onClick={() => setFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-800">
              <SlidersHorizontal size={14} className="text-[#FF5500]" />
              Filters
            </button>
          </div>

          {error && (
            <div className="py-12 text-center">
              <p className="text-red-500 mb-1">{error}</p>
              <p className="text-slate-400 text-xs">Make sure the backend is running on port 8000.</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
                  <div className="aspect-[4/2.85] bg-slate-200" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-4/5" />
                    <div className="h-8 bg-slate-200 rounded mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : vehicles.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map(v => <CarCard key={v.id} car={toDisplay(v)} />)}
              </div>

              {pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:border-[#FF5500] disabled:opacity-40 transition">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold border transition ${
                        p === page
                          ? 'bg-[#FF5500] text-white border-[#FF5500]'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-[#FF5500]'
                      }`}>
                      {p}
                    </button>
                  ))}
                  <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:border-[#FF5500] disabled:opacity-40 transition">
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center">
              <p className="text-lg text-slate-400">No vehicles found</p>
              <button onClick={clearFilters} className="mt-4 text-[#FF5500] hover:underline text-sm">
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
          <div className="relative z-10 w-80 max-w-[90vw] h-full bg-white overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-[2px] text-slate-900">Filters</span>
              <button onClick={() => setFiltersOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
                <X size={18} />
              </button>
            </div>
            <div className="p-5"><FilterPanel /></div>
          </div>
        </div>
      )}
    </div>
  );
}
