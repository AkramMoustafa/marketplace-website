'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface Props {
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
}

export default function CalendarPicker({ value, onChange, minDate }: Props) {
  const floor = minDate ?? (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

  const [viewYear, setViewYear] = useState(value?.getFullYear() ?? floor.getFullYear());
  const [viewMonth, setViewMonth] = useState(value?.getMonth() ?? floor.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Can't go back before the month containing minDate
  const canGoPrev = new Date(viewYear, viewMonth - 1, 1) >= new Date(floor.getFullYear(), floor.getMonth(), 1);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < floor;
  };
  const isSelected = (day: number) =>
    value?.getFullYear() === viewYear &&
    value?.getMonth() === viewMonth &&
    value?.getDate() === day;
  const isToday = (day: number) => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return t.getFullYear() === viewYear && t.getMonth() === viewMonth && t.getDate() === day;
  };

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-gray-800 tracking-wide">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 px-3 pt-3">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-bold text-gray-400 pb-2">{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 px-3 pb-3 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const disabled = isDisabled(day);
          const selected = isSelected(day);
          const todayCell = isToday(day);
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(new Date(viewYear, viewMonth, day))}
              className={[
                'w-full aspect-square flex items-center justify-center text-xs font-medium rounded-xl transition-all',
                disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : !selected
                    ? 'text-gray-700 hover:bg-orange-50 hover:text-[#FF5500]'
                    : '',
                selected
                  ? 'bg-[#FF5500] text-white font-bold shadow-sm shadow-[#FF5500]/30'
                  : '',
                todayCell && !selected
                  ? 'ring-2 ring-[#FF5500]/30 text-[#FF5500] font-bold'
                  : '',
              ].filter(Boolean).join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
