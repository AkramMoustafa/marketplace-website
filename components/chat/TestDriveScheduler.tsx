'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar, Clock, User, Phone, CheckCircle } from 'lucide-react';

const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

function parseTime(slot: string): { hours: number; minutes: number } {
  const [time, period] = slot.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
}

interface Props {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function TestDriveScheduler({ onClose, onSuccess }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const isSelected = (day: number) =>
    selectedDate?.getFullYear() === viewYear &&
    selectedDate?.getMonth() === viewMonth &&
    selectedDate?.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !phone.trim()) {
      setError('Please pick a date, time, and enter your phone number.');
      return;
    }
    setError('');
    setSubmitting(true);

    const { hours, minutes } = parseTime(selectedTime);
    const apptDate = new Date(selectedDate);
    apptDate.setHours(hours, minutes, 0, 0);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: 'test_drive',
          appointment_date: apptDate.toISOString(),
          phone: phone.trim(),
          notes: [name.trim() ? `Name: ${name.trim()}` : '', notes.trim()].filter(Boolean).join(' — ') || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(body.detail || 'Booking failed');
      }

      const dateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      onSuccess(
        `Your test drive is confirmed! 🎉\n\n📅 ${dateStr}\n🕐 ${selectedTime}\n📞 ${phone.trim()}\n\nOur team will reach out to confirm. See you soon!`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 pt-4 pb-3 gap-4">

      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-black text-gray-900 text-sm">Schedule a Test Drive</p>
          <p className="text-xs text-gray-400 mt-0.5">Pick a date and time that works for you</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
          <X size={15} />
        </button>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
          <button onClick={prevMonth} className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition">
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-bold text-gray-800 tracking-wide">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition">
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 px-2 pt-2">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 pb-1">{d}</div>
          ))}
        </div>

        {/* Date grid */}
        <div className="grid grid-cols-7 px-2 pb-2 gap-y-0.5">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const disabled = isDisabled(day);
            const selected = isSelected(day);
            const todayCell = isToday(day);
            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => { setSelectedDate(new Date(viewYear, viewMonth, day)); setSelectedTime(null); }}
                className={`
                  w-full aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all
                  ${disabled ? 'text-gray-300 cursor-not-allowed' : ''}
                  ${!disabled && !selected ? 'text-gray-700 hover:bg-orange-50 hover:text-[#FF5500]' : ''}
                  ${selected ? 'bg-[#FF5500] text-white font-bold shadow-sm' : ''}
                  ${todayCell && !selected ? 'ring-1 ring-[#FF5500]/40 text-[#FF5500] font-bold' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock size={11} /> Available Times
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {TIME_SLOTS.map(slot => (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className={`
                  py-1.5 px-1 text-[11px] font-semibold rounded-lg border transition-all text-center
                  ${selectedTime === slot
                    ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#FF5500]/50 hover:text-[#FF5500] hover:bg-orange-50'
                  }
                `}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inputs */}
      {selectedDate && selectedTime && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <User size={11} /> Your Details
          </p>

          <div className="relative">
            <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF5500]/60 text-gray-800 placeholder-gray-400"
            />
          </div>

          <div className="relative">
            <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="tel"
              placeholder="Phone number *"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF5500]/60 text-gray-800 placeholder-gray-400"
            />
          </div>

          <textarea
            placeholder="Any notes? (vehicle interest, questions…)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#FF5500]/60 text-gray-800 placeholder-gray-400 resize-none"
          />
        </div>
      )}

      {/* Selected summary */}
      {selectedDate && selectedTime && (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
          <Calendar size={13} className="text-[#FF5500] shrink-0" />
          <p className="text-[11px] text-gray-700 font-medium">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {selectedTime}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Actions */}
      <button
        onClick={handleSubmit}
        disabled={!selectedDate || !selectedTime || !phone.trim() || submitting}
        className="w-full py-2.5 rounded-xl bg-[#FF5500] text-white text-sm font-black tracking-wide hover:bg-[#FF7733] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <span className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
        ) : (
          <><CheckCircle size={15} /> Confirm Booking</>
        )}
      </button>
    </div>
  );
}
