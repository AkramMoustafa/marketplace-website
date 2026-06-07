'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import CarCard, { type DisplayCar } from '@/components/CarCard';
import SiteHeader from '@/components/layout/SiteHeader';
import HomeFooter from '@/components/HomeFooter';
import * as api from '@/lib/api';
import type { VehicleListItem, TransmissionType, FuelType, VehicleStatus } from '@/lib/types';
import { SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';

function toDisplay(v: VehicleListItem): DisplayCar {
  return {
    id: v.id, title: v.title, make: v.make, year: v.year,
    price: v.price_on_call ? 'Call' : v.price, images: v.images, mileage: v.mileage,
  };
}

const TRANSMISSION_LABELS: Record<TransmissionType, string> = {
  automatic: 'Automatic', manual: 'Manual', cvt: 'CVT', dct: 'Dual-Clutch',
};
const FUEL_LABELS: Record<FuelType, string> = {
  gasoline: 'Gasoline', diesel: 'Diesel', electric: 'Electric',
  hybrid: 'Hybrid', plug_in_hybrid: 'Plug-In Hybrid',
};

/* ─── FilterPanel lives OUTSIDE InventoryPage ─────────────────────────────
   Defining it inside would make React treat it as a new component type on
   every render, unmounting/remounting the inputs and breaking the search.  */
interface FilterPanelProps {
  search: string;
  onSearchChange: (v: string) => void;
  make: string;
  onMakeChange: (v: string) => void;
  yearMin: string;
  onYearMinChange: (v: string) => void;
  yearMax: string;
  onYearMaxChange: (v: string) => void;
  priceMin: string;
  onPriceMinChange: (v: string) => void;
  priceMax: string;
  onPriceMaxChange: (v: string) => void;
  transmission: TransmissionType | '';
  onTransmissionChange: (v: TransmissionType | '') => void;
  fuelType: FuelType | '';
  onFuelTypeChange: (v: FuelType | '') => void;
  status: VehicleStatus | '';
  onStatusChange: (v: VehicleStatus | '') => void;
  hasFilters: boolean;
  onClearAll: () => void;
}

function FilterPanel({
  search, onSearchChange,
  make, onMakeChange,
  yearMin, onYearMinChange,
  yearMax, onYearMaxChange,
  priceMin, onPriceMinChange,
  priceMax, onPriceMaxChange,
  transmission, onTransmissionChange,
  fuelType, onFuelTypeChange,
  status, onStatusChange,
  hasFilters, onClearAll,
}: FilterPanelProps) {
  const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#B22222] bg-white';
  const labelCls = 'text-[10px] font-black uppercase tracking-[2px] text-slate-400 block mb-2';

  return (
    <div className="space-y-5">
      <div>
        <label className={labelCls}>Search</label>
        <input
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Make, model, keyword…"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Make</label>
        <input
          value={make}
          onChange={e => onMakeChange(e.target.value)}
          placeholder="e.g. BMW"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Year</label>
        <div className="flex gap-2">
          <input value={yearMin} onChange={e => onYearMinChange(e.target.value)}
            placeholder="From" type="number" className={inputCls} />
          <input value={yearMax} onChange={e => onYearMaxChange(e.target.value)}
            placeholder="To" type="number" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Price ($)</label>
        <div className="flex gap-2">
          <input value={priceMin} onChange={e => onPriceMinChange(e.target.value)}
            placeholder="Min" type="number" className={inputCls} />
          <input value={priceMax} onChange={e => onPriceMaxChange(e.target.value)}
            placeholder="Max" type="number" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Transmission</label>
        <select value={transmission} onChange={e => onTransmissionChange(e.target.value as TransmissionType | '')}
          className={inputCls}>
          <option value="">Any</option>
          {(Object.entries(TRANSMISSION_LABELS) as [TransmissionType, string][]).map(([k, v]) =>
            <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Fuel Type</label>
        <select value={fuelType} onChange={e => onFuelTypeChange(e.target.value as FuelType | '')}
          className={inputCls}>
          <option value="">Any</option>
          {(Object.entries(FUEL_LABELS) as [FuelType, string][]).map(([k, v]) =>
            <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Status</label>
        <select value={status} onChange={e => onStatusChange(e.target.value as VehicleStatus | '')}
          className={inputCls}>
          <option value="">All</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>
      </div>
      {hasFilters && (
        <button onClick={onClearAll}
          className="w-full py-2 text-[10px] font-black uppercase tracking-[1.5px] text-[#B22222] hover:underline">
          Clear All Filters
        </button>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
export default function InventoryPage() {
  const [vehicles, setVehicles]     = useState<VehicleListItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // ── Pagination
  const [page, setPage] = useState(1);

  // ── Search: separate input value (immediate) from debounced API value
  const [searchInput, setSearchInput]   = useState('');
  const [search, setSearch]             = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Other filters (no debounce needed — dropdowns/number inputs)
  const [make, setMake]               = useState('');
  const [yearMin, setYearMin]         = useState('');
  const [yearMax, setYearMax]         = useState('');
  const [priceMin, setPriceMin]       = useState('');
  const [priceMax, setPriceMax]       = useState('');
  const [transmission, setTransmission] = useState<TransmissionType | ''>('');
  const [fuelType, setFuelType]       = useState<FuelType | ''>('');
  const [status, setStatus]           = useState<VehicleStatus | ''>('available');

  /* Debounce search input → search state */
  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 350);
  }

  /* Reset page when non-search filters change */
  function withPageReset<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1); };
  }

  /* ── Fetch ────────────────────────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: Parameters<typeof api.getVehicles>[0] = { page, page_size: 12 };
      if (search)       filters.search       = search;
      if (make)         filters.make         = make;
      if (yearMin)      filters.year_min     = Number(yearMin);
      if (yearMax)      filters.year_max     = Number(yearMax);
      if (priceMin)     filters.price_min    = Number(priceMin);
      if (priceMax)     filters.price_max    = Number(priceMax);
      if (transmission) filters.transmission = transmission;
      if (fuelType)     filters.fuel_type    = fuelType;
      if (status)       filters.status       = status;

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

  /* ── Clear all ────────────────────────────────────────────────────────── */
  const clearFilters = () => {
    setSearchInput(''); setSearch('');
    setMake(''); setYearMin(''); setYearMax('');
    setPriceMin(''); setPriceMax('');
    setTransmission(''); setFuelType('');
    setStatus('available'); setPage(1);
  };

  const hasFilters = !!(search || make || yearMin || yearMax || priceMin || priceMax || transmission || fuelType);

  /* ── Shared FilterPanel props ─────────────────────────────────────────── */
  const filterProps: FilterPanelProps = {
    search: searchInput,   onSearchChange: handleSearchChange,
    make,                  onMakeChange:          withPageReset(setMake),
    yearMin,               onYearMinChange:       withPageReset(setYearMin),
    yearMax,               onYearMaxChange:       withPageReset(setYearMax),
    priceMin,              onPriceMinChange:      withPageReset(setPriceMin),
    priceMax,              onPriceMaxChange:      withPageReset(setPriceMax),
    transmission,          onTransmissionChange:  withPageReset(setTransmission),
    fuelType,              onFuelTypeChange:      withPageReset(setFuelType),
    status,                onStatusChange:        withPageReset(setStatus),
    hasFilters,            onClearAll:            clearFilters,
  };

  return (
    <div className="min-h-screen bg-[#EEF2F7]">
      <SiteHeader />

      <div className="max-w-7xl mx-auto px-5 py-8 flex gap-6 items-start">

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs font-black uppercase tracking-[2px] text-slate-900 mb-5">Filters</p>
            <FilterPanel {...filterProps} />
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* Header row */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="font-black text-3xl uppercase tracking-tight text-slate-900">Inventory</h1>
              <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-wide">
                {loading ? 'Loading…' : `${total} vehicle${total !== 1 ? 's' : ''}`}
                {search && !loading && <> · &ldquo;{search}&rdquo;</>}
              </p>
            </div>

            {/* Mobile filter button */}
            <button onClick={() => setFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-800">
              <SlidersHorizontal size={14} className="text-[#B22222]" />
              Filters
            </button>
          </div>

          {/* Inline search bar visible on all widths above the grid */}
          <div className="relative mb-6">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by make, model, keyword…"
              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm
                         focus:outline-none focus:border-[#B22222] focus:ring-2 focus:ring-[#B22222]/10
                         shadow-sm placeholder:text-slate-400"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="py-12 text-center">
              <p className="text-red-500 mb-1">{error}</p>
              <p className="text-slate-400 text-xs">Make sure the backend is running on port 8000.</p>
            </div>
          )}

          {/* Skeleton */}
          {loading && !error && (
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
          )}

          {/* Grid */}
          {!loading && !error && vehicles.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map(v => <CarCard key={v.id} car={toDisplay(v)} />)}
              </div>

              {pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:border-[#B22222] disabled:opacity-40 transition">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold border transition ${
                        p === page
                          ? 'bg-[#B22222] text-white border-[#B22222]'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-[#B22222]'
                      }`}>
                      {p}
                    </button>
                  ))}
                  <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:border-[#B22222] disabled:opacity-40 transition">
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!loading && !error && vehicles.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-lg text-slate-400">No vehicles found</p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-4 text-[#B22222] hover:underline text-sm">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
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
            <div className="p-5">
              <FilterPanel {...filterProps} />
            </div>
          </div>
        </div>
      )}

      <HomeFooter />
    </div>
  );
}
