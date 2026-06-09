'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

export interface FilterState {
  selectedMakes: string[];
  selectedYears: number[];
  selectedPriceRanges: string[];
}

interface FilterSidebarProps {
  makes: string[];
  years: number[];
  filters: FilterState;
  onMakeChange: (make: string) => void;
  onYearChange: (year: number) => void;
  onPriceRangeChange: (range: string) => void;
  onClearAll: () => void;
}

const PRICE_RANGES = [
  { id: 'under-15k', label: 'Under $15,000' },
  { id: '15k-20k', label: '$15,000 – $20,000' },
  { id: '20k-25k', label: '$20,000 – $25,000' },
  { id: '25k-plus', label: '$25,000+' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-5 border-b border-slate-100 last:border-0">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[2px] text-slate-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded accent-[#B22222] cursor-pointer"
      />
      <span
        className={`text-sm font-semibold transition ${
          checked ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-800'
        }`}
      >
        {label}
      </span>
    </label>
  );
}

function FilterContent(props: FilterSidebarProps) {
  const activeCount =
    props.filters.selectedMakes.length +
    props.filters.selectedYears.length +
    props.filters.selectedPriceRanges.length;

  return (
    <>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <span className="text-xs font-black uppercase tracking-[2px] text-slate-900">
          Filters
        </span>
        {activeCount > 0 && (
          <button
            onClick={props.onClearAll}
            className="text-[10px] font-bold uppercase tracking-wide text-[#B22222] hover:text-[#8B1A1A] transition"
          >
            Clear all
          </button>
        )}
      </div>

      <Section title="Make">
        <div className="flex flex-col gap-1.5">
          {props.makes.map(make => (
            <CheckItem
              key={make}
              label={make}
              checked={props.filters.selectedMakes.includes(make)}
              onChange={() => props.onMakeChange(make)}
            />
          ))}
        </div>
      </Section>

      <Section title="Year">
        <div className="flex flex-col gap-1.5">
          {props.years.map(year => (
            <CheckItem
              key={year}
              label={String(year)}
              checked={props.filters.selectedYears.includes(year)}
              onChange={() => props.onYearChange(year)}
            />
          ))}
        </div>
      </Section>

      <Section title="Price Range">
        <div className="flex flex-col gap-1.5">
          {PRICE_RANGES.map(range => (
            <CheckItem
              key={range.id}
              label={range.label}
              checked={props.filters.selectedPriceRanges.includes(range.id)}
              onChange={() => props.onPriceRangeChange(range.id)}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

export default function FilterSidebar(props: FilterSidebarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCount =
    props.filters.selectedMakes.length +
    props.filters.selectedYears.length +
    props.filters.selectedPriceRanges.length;

  return (
    <>
      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="sticky top-4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <FilterContent {...props} />
        </div>
      </aside>

      {/* Mobile trigger button */}
      <button
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-800 hover:border-[#B22222] transition"
        onClick={() => setDrawerOpen(true)}
      >
        <SlidersHorizontal size={15} className="text-[#B22222]" />
        Filters
        {activeCount > 0 && (
          <span className="ml-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-[#B22222] text-white text-[10px] font-black">
            {activeCount}
          </span>
        )}
      </button>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full bg-white overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-[2px] text-slate-900">
                Filters
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 transition text-slate-500"
              >
                <X size={18} />
              </button>
            </div>
            <FilterContent {...props} />
          </div>
        </div>
      )}
    </>
  );
}
