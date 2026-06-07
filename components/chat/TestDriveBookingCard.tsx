'use client';

import { useState, useEffect } from 'react';
import { Car, X } from 'lucide-react';
import DateSelectionStep from './DateSelectionStep';
import TimeSelectionStep from './TimeSelectionStep';
import ContactInfoStep from './ContactInfoStep';
import AppointmentSuccessStep from './AppointmentSuccessStep';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type BookingStep = 'date' | 'time' | 'contact' | 'success';

const STEPS = ['date', 'time', 'contact'] as const;
type ProgressStep = typeof STEPS[number];
const STEP_LABELS: Record<ProgressStep, string> = { date: 'Date', time: 'Time', contact: 'Info' };

function parseTimeSlot(slot: string): { hours: number; minutes: number } {
  const [time, period] = slot.split(' ');
  const parts = time.split(':').map(Number);
  let h = parts[0];
  const m = parts[1];
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return { hours: h, minutes: m };
}

interface Props {
  vehicleId?: string | null;
  vehicleTitle?: string | null;
  onSuccess: (chatMsg: string) => void;
}

export default function TestDriveBookingCard({ vehicleId, vehicleTitle: vehicleTitleProp, onSuccess }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmationId, setConfirmationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [vehicleTitle, setVehicleTitle] = useState<string | null>(vehicleTitleProp ?? null);

  // Fetch vehicle title if we have an ID but no title
  useEffect(() => {
    if (!vehicleId || vehicleTitle) return;
    fetch(`${API}/api/vehicles/${vehicleId}`)
      .then(r => r.json())
      .then((v: { title?: string }) => setVehicleTitle(v.title ?? null))
      .catch(() => {});
  }, [vehicleId, vehicleTitle]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('contact');
  };

  const handleContactSubmit = async (name: string, phone: string, email: string) => {
    if (!selectedDate || !selectedTime) return;
    setError('');
    setSubmitting(true);

    const { hours, minutes } = parseTimeSlot(selectedTime);
    const apptDate = new Date(selectedDate);
    apptDate.setHours(hours, minutes, 0, 0);

    const notesParts = [
      `Customer: ${name}`,
      `Email: ${email}`,
      vehicleTitle ? `Vehicle: ${vehicleTitle}` : '',
    ].filter(Boolean).join(' | ');

    try {
      const res = await fetch(`${API}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId || undefined,
          service_type: 'test_drive',
          appointment_date: apptDate.toISOString(),
          phone,
          notes: notesParts,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(body.detail ?? 'Booking failed. Please try again.');
      }

      const appt = await res.json() as { id: string };
      const cid = `TD-${appt.id.slice(0, 7).toUpperCase()}`;
      setConfirmationId(cid);
      setStep('success');

      const dateStr = selectedDate.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      });
      onSuccess(
        `Test drive confirmed! 🎉\n\nConfirmation: **${cid}**\nVehicle: ${vehicleTitle ?? 'Selected vehicle'}\nDate: ${dateStr} at ${selectedTime}\n\nWe look forward to seeing you at NOVA Motors!`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (dismissed) return null;

  return (
    <div
      className="my-2 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm"
      style={{ animation: 'alexFadeIn 0.25s ease-out' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-white border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#B22222] flex items-center justify-center shrink-0 shadow-sm shadow-[#B22222]/30">
            <Car size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-gray-900 leading-tight">Schedule Test Drive</p>
            {vehicleTitle && (
              <p className="text-[11px] text-[#B22222] font-semibold truncate mt-0.5">{vehicleTitle}</p>
            )}
          </div>
        </div>
        {step !== 'success' && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition shrink-0 ml-2"
            aria-label="Dismiss"
          >
            <X size={13} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Step progress */}
      {step !== 'success' && (
        <div className="flex items-center gap-0 px-4 py-2 bg-gray-50 border-b border-gray-100">
          {STEPS.map((s, i) => {
            const currentIdx = (STEPS as readonly string[]).indexOf(step);
            const done = currentIdx > i;
            const active = step === s;
            return (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div className={[
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all',
                    active ? 'bg-[#B22222] text-white' :
                      done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400',
                  ].join(' ')}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={[
                    'text-[10px] font-semibold',
                    active ? 'text-gray-800' : done ? 'text-green-600' : 'text-gray-400',
                  ].join(' ')}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={[
                    'w-6 h-px mx-1.5',
                    done ? 'bg-green-300' : 'bg-gray-200',
                  ].join(' ')} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Step content */}
      <div className="p-4">
        {step === 'date' && (
          <DateSelectionStep onSelect={handleDateSelect} />
        )}
        {step === 'time' && selectedDate && (
          <TimeSelectionStep
            date={selectedDate}
            onSelect={handleTimeSelect}
            onBack={() => setStep('date')}
          />
        )}
        {step === 'contact' && selectedDate && selectedTime && (
          <ContactInfoStep
            date={selectedDate}
            time={selectedTime}
            vehicleTitle={vehicleTitle}
            onSubmit={handleContactSubmit}
            onBack={() => setStep('time')}
            submitting={submitting}
            error={error}
          />
        )}
        {step === 'success' && selectedDate && selectedTime && (
          <AppointmentSuccessStep
            vehicleTitle={vehicleTitle ?? 'NOVA Motors Test Drive'}
            date={selectedDate}
            time={selectedTime}
            confirmationId={confirmationId}
          />
        )}
      </div>
    </div>
  );
}
