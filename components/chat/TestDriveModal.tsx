'use client';

import { useState, useEffect } from 'react';
import { X, Car, Calendar as CalIcon, Clock, User, Phone, Mail, FileText, Loader2 } from 'lucide-react';
import CalendarPicker from './CalendarPicker';
import TimeSlotPicker from './TimeSlotPicker';
import BookingConfirmation, { type ConfirmationData } from './BookingConfirmation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface VehicleOption {
  id: string;
  title: string;
  price: string;
  price_on_call: boolean;
}

interface Props {
  onClose: () => void;
  onSuccess: (chatMsg: string) => void;
  currentVehicleId?: string | null;
}

function parseTimeSlot(slot: string): { hours: number; minutes: number } {
  const [time, period] = slot.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return { hours: h, minutes: m };
}

export default function TestDriveModal({ onClose, onSuccess, currentVehicleId }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehicleId, setVehicleId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationData | null>(null);

  // Load vehicle list
  useEffect(() => {
    fetch(`${API}/api/vehicles?status=available&page_size=30`)
      .then(r => r.json())
      .then(data => {
        const items: VehicleOption[] = (data.items ?? []).map((v: Record<string, unknown>) => ({
          id: v.id as string,
          title: v.title as string,
          price: v.price as string,
          price_on_call: v.price_on_call as boolean,
        }));
        setVehicles(items);
        if (currentVehicleId && items.some(v => v.id === currentVehicleId)) {
          setVehicleId(currentVehicleId);
        }
      })
      .catch(() => {})
      .finally(() => setVehiclesLoading(false));
  }, [currentVehicleId]);

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      setError('Please select a date and time for your test drive.');
      return;
    }
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError('Please fill in your name, phone, and email.');
      return;
    }
    setError('');
    setSubmitting(true);

    const { hours, minutes } = parseTimeSlot(selectedTime);
    const apptDate = new Date(selectedDate);
    apptDate.setHours(hours, minutes, 0, 0);

    const notesParts = [
      `Customer: ${name.trim()}`,
      `Email: ${email.trim()}`,
      selectedVehicle ? `Vehicle: ${selectedVehicle.title}` : '',
      notes.trim() ? `Notes: ${notes.trim()}` : '',
    ].filter(Boolean).join(' | ');

    try {
      const res = await fetch(`${API}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId || undefined,
          service_type: 'test_drive',
          appointment_date: apptDate.toISOString(),
          phone: phone.trim(),
          notes: notesParts,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(body.detail ?? 'Booking failed. Please try again.');
      }

      const appt = await res.json() as { id: string };
      const confirmationId = `TD-${appt.id.slice(0, 7).toUpperCase()}`;
      const vehicleTitle = selectedVehicle?.title ?? 'Your selected vehicle';
      const dateStr = selectedDate.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      });

      setConfirmation({ vehicleTitle, date: dateStr, time: selectedTime, confirmationId });

      onSuccess(
        `Test drive confirmed!\n\nConfirmation: ${confirmationId}\nVehicle: ${vehicleTitle}\nDate: ${dateStr} at ${selectedTime}\n\nSee you soon at NOVA Motors!`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!selectedDate && !!selectedTime && name.trim() && phone.trim() && email.trim() && !submitting;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'backdropFadeIn 0.2s ease-out' }}
      />

      <style>{`
        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-body::-webkit-scrollbar { width: 4px; }
        .modal-body::-webkit-scrollbar-track { background: transparent; }
        .modal-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
      `}</style>

      {/* Modal card */}
      <div
        className="relative z-10 w-full sm:w-[480px] mx-0 sm:mx-4 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          maxHeight: 'min(92dvh, 780px)',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Mobile drag handle */}
        <div className="flex sm:hidden justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF5500] flex items-center justify-center shadow-sm shadow-[#FF5500]/30">
              <Car size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">Schedule a Test Drive</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">NOVA Motors · Detroit, MI</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Body */}
        {confirmation ? (
          <div className="modal-body overflow-y-auto flex-1">
            <BookingConfirmation data={confirmation} onClose={onClose} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-body overflow-y-auto flex-1">
            <div className="px-6 py-5 space-y-6">

              {/* ── Vehicle ─────────────────────────────────────── */}
              <section>
                <SectionLabel icon={<Car size={12} />} text="Vehicle" />
                {vehiclesLoading ? (
                  <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
                ) : (
                  <div className="relative">
                    <select
                      value={vehicleId}
                      onChange={e => setVehicleId(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF5500]/60 text-gray-900 bg-white appearance-none cursor-pointer"
                    >
                      <option value="">Select a vehicle…</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.title}
                          {!v.price_on_call ? ` — $${parseFloat(v.price).toLocaleString()}` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                )}
              </section>

              {/* ── Date ────────────────────────────────────────── */}
              <section>
                <SectionLabel icon={<CalIcon size={12} />} text="Select a Date" required />
                <CalendarPicker value={selectedDate} onChange={handleDateChange} minDate={today} />
              </section>

              {/* ── Time ────────────────────────────────────────── */}
              {selectedDate && (
                <section>
                  <SectionLabel icon={<Clock size={12} />} text="Select a Time" required />
                  <TimeSlotPicker value={selectedTime} onChange={setSelectedTime} />
                </section>
              )}

              {/* ── Customer Info ────────────────────────────────── */}
              <section className="space-y-3">
                <SectionLabel icon={<User size={12} />} text="Your Information" />

                <FieldRow>
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Full name *"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF5500]/60 text-gray-900 placeholder-gray-400"
                  />
                </FieldRow>

                <FieldRow>
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="Phone number *"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF5500]/60 text-gray-900 placeholder-gray-400"
                  />
                </FieldRow>

                <FieldRow>
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="Email address *"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF5500]/60 text-gray-900 placeholder-gray-400"
                  />
                </FieldRow>
              </section>

              {/* ── Notes ───────────────────────────────────────── */}
              <section>
                <SectionLabel icon={<FileText size={12} />} text="Notes" note="Optional" />
                <textarea
                  placeholder="Any specific questions or preferences?"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#FF5500]/60 text-gray-900 placeholder-gray-400 resize-none"
                />
              </section>

              {/* ── Booking summary strip ────────────────────────── */}
              {selectedDate && selectedTime && (
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                  <CalIcon size={15} className="text-[#FF5500] shrink-0" />
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}
                    {selectedTime}
                    {selectedVehicle && (
                      <span className="text-gray-500 font-normal"> · {selectedVehicle.title}</span>
                    )}
                  </p>
                </div>
              )}

              {/* ── Error ───────────────────────────────────────── */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              {/* ── Submit ──────────────────────────────────────── */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3.5 rounded-xl bg-[#FF5500] text-white text-sm font-black tracking-wide hover:bg-[#FF7733] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF5500]/20"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Booking…</>
                ) : (
                  'Book Test Drive'
                )}
              </button>

              <p className="text-center text-[11px] text-gray-400 pb-1">
                NOVA Motors · 2940 East 8 Mile · Detroit, MI 48234
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Tiny layout helpers ─────────────────────────────────────────────────────

function SectionLabel({
  icon, text, required, note,
}: {
  icon: React.ReactNode;
  text: string;
  required?: boolean;
  note?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <span className="text-gray-400">{icon}</span>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{text}</span>
      {required && <span className="text-[#FF5500] text-xs">*</span>}
      {note && <span className="text-xs text-gray-400 normal-case ml-1">({note})</span>}
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="relative">{children}</div>;
}
