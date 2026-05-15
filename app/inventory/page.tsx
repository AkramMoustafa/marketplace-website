"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, X, ChevronDown, ChevronUp,
  RotateCcw, ArrowUpDown, Check
} from "lucide-react";
import LuxuryCarCard from "@/components/LuxuryCarCard";
import { cars } from "@/lib/data";

// ── Constants ─────────────────────────────────────────────────────────────────
const PRICE_MIN = 100_000;
const PRICE_MAX = 400_000;
const YEAR_MIN  = 2021;
const YEAR_MAX  = 2025;

const ALL_BRANDS = Array.from(new Set(cars.map((c) => c.brand))).sort();
const ALL_TRANSMISSIONS = ["Automatic", "Manual"] as const;
const ALL_FUELS = ["Gasoline", "Diesel", "Hybrid", "Electric"] as const;

const SORT_OPTIONS = [
  { value: "featured",   label: "Featured" },
  { value: "price-asc",  label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "year-desc",  label: "Newest First" },
  { value: "mile-asc",   label: "Lowest Mileage" },
] as const;

type SortKey = typeof SORT_OPTIONS[number]["value"];

interface Filters {
  search:       string;
  minPrice:     number;
  maxPrice:     number;
  minYear:      number;
  maxYear:      number;
  brand:        string;
  model:        string;
  transmission: string;
  fuels:        Set<string>;
  status:       "all" | "available" | "sold";
}

const DEFAULT_FILTERS: Filters = {
  search:       "",
  minPrice:     PRICE_MIN,
  maxPrice:     PRICE_MAX,
  minYear:      YEAR_MIN,
  maxYear:      YEAR_MAX,
  brand:        "",
  model:        "",
  transmission: "",
  fuels:        new Set<string>(),
  status:       "all",
};

// ── Dual range slider ─────────────────────────────────────────────────────────
function DualSlider({
  min, max, step = 1,
  minVal, maxVal,
  onMinChange, onMaxChange,
  format,
}: {
  min: number; max: number; step?: number;
  minVal: number; maxVal: number;
  onMinChange: (v: number) => void;
  onMaxChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const range = max - min;
  const minPct = ((minVal - min) / range) * 100;
  const maxPct = ((maxVal - min) / range) * 100;
  // bring min thumb to front when it's near the right end
  const minZ = minVal > max - range * 0.06 ? 5 : 3;

  return (
    <div className="select-none">
      <div className="flex justify-between mb-4 text-xs font-sans">
        <span className="text-[#C9A84C] font-medium">{format(minVal)}</span>
        <span className="text-[#C9A84C] font-medium">{format(maxVal)}</span>
      </div>
      <div className="relative h-1.5 mx-2 my-3">
        {/* Track */}
        <div className="absolute inset-0 rounded-full bg-white/10" />
        {/* Fill */}
        <div
          className="absolute top-0 h-full rounded-full bg-[#C9A84C]"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        {/* Min thumb */}
        <input
          type="range" min={min} max={max} step={step} value={minVal}
          className="dual-thumb"
          style={{ zIndex: minZ }}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v < maxVal - step) onMinChange(v);
          }}
        />
        {/* Max thumb */}
        <input
          type="range" min={min} max={max} step={step} value={maxVal}
          className="dual-thumb"
          style={{ zIndex: 4 }}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v > minVal + step) onMaxChange(v);
          }}
        />
      </div>
    </div>
  );
}

// ── Collapsible sidebar section ───────────────────────────────────────────────
function FilterSection({
  title, children, defaultOpen = true, badge,
}: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.07]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="flex items-center gap-2 text-xs font-sans font-semibold tracking-[0.15em] uppercase text-white/60 group-hover:text-white/90 transition-colors">
          {title}
          {badge ? (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#C9A84C] text-black text-[9px] font-bold leading-none">
              {badge}
            </span>
          ) : null}
        </span>
        {open
          ? <ChevronUp size={14} className="text-white/30 shrink-0" />
          : <ChevronDown size={14} className="text-white/30 shrink-0" />
        }
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Pill toggle button ────────────────────────────────────────────────────────
function Pill({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-sans tracking-wide transition-all duration-200 ${
        active
          ? "bg-[#C9A84C] text-black font-semibold"
          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
      }`}
    >
      {children}
    </button>
  );
}

// ── Sidebar filter panel ──────────────────────────────────────────────────────
function FilterPanel({
  filters, onChange, onReset, activeCount,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  activeCount: number;
}) {
  const modelsForBrand = useMemo(
    () => filters.brand
      ? Array.from(new Set(cars.filter((c) => c.brand === filters.brand).map((c) => c.model))).sort()
      : [],
    [filters.brand],
  );

  const toggleFuel = (fuel: string) => {
    const next = new Set(filters.fuels);
    next.has(fuel) ? next.delete(fuel) : next.add(fuel);
    onChange({ fuels: next });
  };

  const selectCls = "w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 text-white/80 text-sm font-sans px-3 py-2.5 rounded-lg outline-none transition-colors appearance-none cursor-pointer";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-1 py-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-[#C9A84C]" />
          <span className="text-white font-serif text-lg">Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#C9A84C] text-black text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-[10px] font-sans tracking-wider uppercase text-white/40 hover:text-[#C9A84C] transition-colors"
          >
            <RotateCcw size={11} /> Reset
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 pr-1" style={{ scrollbarWidth: "none" }}>
        {/* Search */}
        <FilterSection title="Search">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Brand, model, keyword…"
              value={filters.search}
              onChange={(e) => onChange({ search: e.target.value })}
              className="w-full bg-white/5 border border-white/10 focus:border-[#C9A84C]/50 text-white placeholder-white/25 text-sm font-sans pl-9 pr-3 py-2.5 rounded-lg outline-none transition-colors"
            />
          </div>
        </FilterSection>

        {/* Price */}
        <FilterSection title="Price Range">
          <DualSlider
            min={PRICE_MIN} max={PRICE_MAX} step={5_000}
            minVal={filters.minPrice} maxVal={filters.maxPrice}
            onMinChange={(v) => onChange({ minPrice: v })}
            onMaxChange={(v) => onChange({ maxPrice: v })}
            format={(v) =>
              v >= 1_000_000
                ? `$${(v / 1_000_000).toFixed(1)}M`
                : `$${(v / 1_000).toFixed(0)}K`
            }
          />
        </FilterSection>

        {/* Year */}
        <FilterSection title="Year">
          <DualSlider
            min={YEAR_MIN} max={YEAR_MAX} step={1}
            minVal={filters.minYear} maxVal={filters.maxYear}
            onMinChange={(v) => onChange({ minYear: v })}
            onMaxChange={(v) => onChange({ maxYear: v })}
            format={(v) => String(v)}
          />
        </FilterSection>

        {/* Make */}
        <FilterSection title="Make">
          <div className="relative">
            <select
              value={filters.brand}
              onChange={(e) => onChange({ brand: e.target.value, model: "" })}
              className={selectCls}
            >
              <option value="">All Makes</option>
              {ALL_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
          </div>
        </FilterSection>

        {/* Model */}
        <FilterSection title="Model">
          <div className="relative">
            <select
              value={filters.model}
              onChange={(e) => onChange({ model: e.target.value })}
              disabled={!filters.brand}
              className={`${selectCls} disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              <option value="">All Models</option>
              {modelsForBrand.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
          </div>
        </FilterSection>

        {/* Transmission */}
        <FilterSection title="Transmission">
          <div className="flex flex-wrap gap-2">
            <Pill active={!filters.transmission} onClick={() => onChange({ transmission: "" })}>All</Pill>
            {ALL_TRANSMISSIONS.map((t) => (
              <Pill key={t} active={filters.transmission === t} onClick={() => onChange({ transmission: t })}>
                {t}
              </Pill>
            ))}
          </div>
        </FilterSection>

        {/* Fuel type */}
        <FilterSection title="Fuel Type">
          <div className="flex flex-col gap-2">
            {ALL_FUELS.map((fuel) => {
              const checked = filters.fuels.has(fuel);
              return (
                <button
                  key={fuel}
                  onClick={() => toggleFuel(fuel)}
                  className="flex items-center gap-3 text-sm font-sans text-white/60 hover:text-white/90 transition-colors"
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-200 ${
                    checked ? "bg-[#C9A84C] border-[#C9A84C]" : "border-white/20 bg-white/5"
                  }`}>
                    {checked && <Check size={10} className="text-black" strokeWidth={3} />}
                  </span>
                  {fuel}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Status */}
        <FilterSection title="Availability" defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            <Pill active={filters.status === "all"} onClick={() => onChange({ status: "all" })}>All</Pill>
            <Pill active={filters.status === "available"} onClick={() => onChange({ status: "available" })}>Available</Pill>
            <Pill active={filters.status === "sold"} onClick={() => onChange({ status: "sold" })}>Sold</Pill>
          </div>
        </FilterSection>
      </div>
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-[#141414] rounded-2xl overflow-hidden border border-white/[0.06] animate-pulse">
      <div className="aspect-[16/11] bg-white/[0.06]" />
      <div className="px-5 pt-4 pb-5 space-y-3">
        <div className="h-2.5 w-16 bg-white/[0.08] rounded" />
        <div className="h-5 w-3/4 bg-white/[0.08] rounded" />
        <div className="h-2.5 w-1/2 bg-white/[0.06] rounded" />
        <div className="h-px bg-white/[0.06]" />
        <div className="flex items-end justify-between">
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 bg-white/[0.06] rounded" />
            <div className="h-7 w-24 bg-white/[0.08] rounded" />
          </div>
          <div className="h-8 w-16 bg-white/[0.06] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Sort dropdown ─────────────────────────────────────────────────────────────
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.value === value)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-sans text-white/60 hover:text-white/90 border border-white/10 hover:border-white/20 px-3.5 py-2 rounded-lg transition-all duration-200 bg-white/[0.03]"
      >
        <ArrowUpDown size={12} />
        {current.label}
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1.5 z-20 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[180px]"
            >
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value as SortKey); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-sans transition-colors duration-150 flex items-center gap-2 ${
                    value === opt.value
                      ? "text-[#C9A84C] bg-[#C9A84C]/10"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {value === opt.value && <Check size={10} className="text-[#C9A84C]" />}
                  <span className={value === opt.value ? "" : "ml-3.5"}>{opt.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>("featured");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Brief synthetic loading so skeleton shows
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const onChange = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const onReset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // Active filter count
  const activeCount = useMemo(() => {
    let n = 0;
    if (filters.search)                        n++;
    if (filters.minPrice > PRICE_MIN)          n++;
    if (filters.maxPrice < PRICE_MAX)          n++;
    if (filters.minYear > YEAR_MIN)            n++;
    if (filters.maxYear < YEAR_MAX)            n++;
    if (filters.brand)                         n++;
    if (filters.model)                         n++;
    if (filters.transmission)                  n++;
    if (filters.fuels.size)                    n += filters.fuels.size;
    if (filters.status !== "all")              n++;
    return n;
  }, [filters]);

  // Filtered + sorted list
  const results = useMemo(() => {
    const q = filters.search.toLowerCase();
    let list = cars.filter((car) => {
      if (q && !car.title.toLowerCase().includes(q) && !car.brand.toLowerCase().includes(q) && !car.model.toLowerCase().includes(q)) return false;
      if (car.price < filters.minPrice || car.price > filters.maxPrice) return false;
      if (car.year  < filters.minYear  || car.year  > filters.maxYear)  return false;
      if (filters.brand && car.brand !== filters.brand)                  return false;
      if (filters.model && car.model !== filters.model)                  return false;
      if (filters.transmission && car.transmission !== filters.transmission) return false;
      if (filters.fuels.size && !filters.fuels.has(car.fuelType))       return false;
      if (filters.status !== "all" && car.status !== filters.status)     return false;
      return true;
    });

    switch (sort) {
      case "price-asc":  list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "year-desc":  list = [...list].sort((a, b) => b.year  - a.year);  break;
      case "mile-asc":   list = [...list].sort((a, b) => a.mileage - b.mileage); break;
    }
    return list;
  }, [filters, sort]);

  return (
    <div className="bg-[#0A0A0A] min-h-screen text-white">
      {/* ── Page hero ── */}
      <div className="pt-28 pb-10 px-6 lg:px-10 border-b border-white/[0.06] bg-gradient-to-b from-[#111111] to-[#0A0A0A]">
        <div className="max-w-screen-2xl mx-auto">
          <p className="text-[#C9A84C] text-[10px] font-sans tracking-[0.3em] uppercase mb-3">
            Curated Collection
          </p>
          <h1 className="font-serif text-5xl md:text-6xl text-white">Our Inventory</h1>
        </div>
      </div>

      {/* ── Mobile filter button ── */}
      <div className="lg:hidden sticky top-16 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 text-sm font-sans text-white/70 border border-white/15 hover:border-[#C9A84C]/40 px-4 py-2.5 rounded-xl transition-all duration-200 bg-white/[0.03]"
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#C9A84C] text-black text-[10px] font-bold ml-1">
              {activeCount}
            </span>
          )}
        </button>
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      {/* ── Layout ── */}
      <div className="max-w-screen-2xl mx-auto flex">

        {/* ── Sidebar — desktop ── */}
        <aside className="hidden lg:block w-72 xl:w-80 shrink-0 border-r border-white/[0.06]">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto px-6 py-2"
            style={{ scrollbarWidth: "none" }}>
            <FilterPanel filters={filters} onChange={onChange} onReset={onReset} activeCount={activeCount} />
          </div>
        </aside>

        {/* ── Mobile filter drawer ── */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/70 z-40 lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                key="drawer"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 320 }}
                className="fixed left-0 top-0 bottom-0 w-80 bg-[#0F0F0F] z-50 lg:hidden flex flex-col border-r border-white/[0.08]"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                  <span className="font-serif text-white text-lg">Filters</span>
                  <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white transition-colors p-1">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-2">
                  <FilterPanel filters={filters} onChange={onChange} onReset={onReset} activeCount={activeCount} />
                </div>
                <div className="p-5 border-t border-white/[0.07]">
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="w-full bg-[#C9A84C] text-black font-sans font-semibold text-sm py-3 rounded-xl hover:bg-[#D4B96A] transition-colors"
                  >
                    Show {results.length} Result{results.length !== 1 ? "s" : ""}
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 px-6 lg:px-8 xl:px-10 py-8">

          {/* Results bar — desktop sort + count */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <p className="text-white/40 text-sm font-sans">
              <span className="text-white font-medium">{results.length}</span>
              {" "}vehicle{results.length !== 1 ? "s" : ""} found
            </p>
            <SortDropdown value={sort} onChange={setSort} />
          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-wrap gap-2 mb-6"
            >
              {filters.search && (
                <Chip label={`"${filters.search}"`} onRemove={() => onChange({ search: "" })} />
              )}
              {filters.brand && (
                <Chip label={filters.brand} onRemove={() => onChange({ brand: "", model: "" })} />
              )}
              {filters.model && (
                <Chip label={filters.model} onRemove={() => onChange({ model: "" })} />
              )}
              {filters.transmission && (
                <Chip label={filters.transmission} onRemove={() => onChange({ transmission: "" })} />
              )}
              {Array.from(filters.fuels).map((f) => (
                <Chip key={f} label={f} onRemove={() => {
                  const next = new Set(filters.fuels); next.delete(f); onChange({ fuels: next });
                }} />
              ))}
              {filters.status !== "all" && (
                <Chip label={filters.status} onRemove={() => onChange({ status: "all" })} />
              )}
              {(filters.minPrice > PRICE_MIN || filters.maxPrice < PRICE_MAX) && (
                <Chip
                  label={`$${filters.minPrice / 1000}K – $${filters.maxPrice / 1000}K`}
                  onRemove={() => onChange({ minPrice: PRICE_MIN, maxPrice: PRICE_MAX })}
                />
              )}
              {(filters.minYear > YEAR_MIN || filters.maxYear < YEAR_MAX) && (
                <Chip
                  label={`${filters.minYear} – ${filters.maxYear}`}
                  onRemove={() => onChange({ minYear: YEAR_MIN, maxYear: YEAR_MAX })}
                />
              )}
            </motion.div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <EmptyState onReset={onReset} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {results.map((car, i) => (
                <LuxuryCarCard key={car.id} car={car} index={i} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────────────
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-sans px-3 py-1.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors">
        <X size={10} strokeWidth={2.5} />
      </button>
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-32 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mb-6">
        <Search size={22} className="text-white/25" />
      </div>
      <h3 className="font-serif text-2xl text-white mb-2">No Vehicles Found</h3>
      <p className="text-white/35 font-sans text-sm mb-8 max-w-xs">
        Try adjusting your filters or broadening your search criteria.
      </p>
      <button
        onClick={onReset}
        className="flex items-center gap-2 bg-[#C9A84C] text-black text-sm font-sans font-semibold px-6 py-3 rounded-xl hover:bg-[#D4B96A] transition-colors"
      >
        <RotateCcw size={14} /> Reset All Filters
      </button>
    </motion.div>
  );
}
