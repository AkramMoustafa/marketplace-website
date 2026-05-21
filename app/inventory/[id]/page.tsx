'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getVehicle, getReviews, bookAppointment, getImageUrl } from '@/lib/api';
import type { Vehicle, Review } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Star, Calendar, DollarSign, ArrowLeft, Fuel, Gauge, Zap, Palette } from 'lucide-react';

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjU2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjU2MCIgZmlsbD0iI2YxZjVmOSIvPjx0ZXh0IHg9IjQwMCIgeT0iMjkwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIzMiIgZmlsbD0iI2NiZDVlMSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={14}
          className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
      ))}
    </div>
  );
}

function AppointmentModal({ vehicleId, onClose }: { vehicleId: string; onClose: () => void }) {
  const [serviceType, setServiceType] = useState('test_drive');
  const [date, setDate] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await bookAppointment({ vehicle_id: vehicleId, service_type: serviceType, appointment_date: date, phone, notes });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        {success ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✓</div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Appointment Booked!</h3>
            <p className="text-slate-500 text-sm mb-4">We&apos;ll confirm your appointment shortly.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-[#FF5500] text-black font-black text-sm rounded-lg">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900">Book Appointment</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Service Type</label>
                <select value={serviceType} onChange={e => setServiceType(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#FF5500]">
                  <option value="test_drive">Test Drive</option>
                  <option value="general_inspection">General Inspection</option>
                  <option value="oil_change">Oil Change</option>
                  <option value="brake_service">Brake Service</option>
                  <option value="engine_diagnostic">Engine Diagnostic</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Preferred Date & Time</label>
                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#FF5500]" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="(555) 000-0000"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#FF5500]" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Any specific requests…"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#FF5500] resize-none" />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-slate-900 text-white font-black text-sm uppercase tracking-wide rounded-lg hover:bg-[#FF5500] hover:text-black transition disabled:opacity-60">
                {loading ? 'Booking…' : 'Confirm Appointment'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [apptOpen, setApptOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getVehicle(id),
      getReviews(id),
    ]).then(([v, r]) => {
      setVehicle(v);
      setReviews(r.items);
    }).catch(e => {
      setError(e instanceof Error ? e.message : 'Vehicle not found');
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-[#FF5500] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center gap-4 text-slate-300">
        <p className="text-lg">{error || 'Vehicle not found'}</p>
        <Link href="/" className="text-[#FF5500] hover:underline">← Back to Inventory</Link>
      </div>
    );
  }

  const images = vehicle.images.length > 0 ? vehicle.images : [null];
  const priceDisplay = vehicle.price_on_call
    ? 'Call for Price'
    : `$${parseFloat(vehicle.price).toLocaleString()}`;

  const specItems = [
    { label: 'Year', value: String(vehicle.year), Icon: Calendar },
    { label: 'Mileage', value: `${vehicle.mileage.toLocaleString()} mi`, Icon: Gauge },
    { label: 'Transmission', value: vehicle.transmission.charAt(0).toUpperCase() + vehicle.transmission.slice(1), Icon: Zap },
    { label: 'Fuel', value: vehicle.fuel_type.replace('_', ' '), Icon: Fuel },
    ...(vehicle.color ? [{ label: 'Color', value: vehicle.color, Icon: Palette }] : []),
    ...(vehicle.body_type ? [{ label: 'Body', value: vehicle.body_type, Icon: Calendar }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0a0f1e]/92 backdrop-blur-md border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2 no-underline">
          <span className="text-white font-black text-base tracking-[4px]">NOVA</span>
          <span className="text-[#FF5500] text-[9px] font-black tracking-[5px] uppercase">MOTORS</span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition">
          <ArrowLeft size={14} /> Back to Inventory
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-5 py-10">

        {/* Hero: gallery + details */}
        <div className="flex flex-col lg:flex-row gap-10 mb-14">

          {/* Gallery */}
          <div className="lg:w-[55%] shrink-0">
            <div className="rounded-xl overflow-hidden mb-3 bg-slate-800 border border-white/[0.06] aspect-[4/3] relative">
              {images[activeImg] ? (
                <Image
                  src={getImageUrl(images[activeImg]!)}
                  alt={`${vehicle.title} ${activeImg + 1}`}
                  fill className="object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={PLACEHOLDER} alt="No image" className="w-full h-full object-cover" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`relative shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition ${
                      i === activeImg ? 'border-[#FF5500]' : 'border-transparent opacity-60 hover:opacity-90'
                    }`}>
                    <Image src={getImageUrl(src!)} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1">
            <span className={`inline-block mb-3 px-3 py-1 text-[10px] font-black uppercase tracking-[2px] rounded-full ${
              vehicle.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : vehicle.status === 'sold' ? 'bg-red-500/10 text-red-400 border border-red-500/30'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              {vehicle.status}
            </span>

            <h1 className="text-3xl font-black text-slate-100 leading-tight mb-2">{vehicle.title}</h1>
            <p className="text-slate-400 text-sm mb-6 font-mono">VIN: {vehicle.vin}</p>

            <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-[#FF5500]/8 border border-[#FF5500]/25">
              <span className="text-slate-400 text-xs uppercase tracking-wide">Price</span>
              <div className="w-px h-5 bg-white/10" />
              <span className="text-3xl font-black text-[#FF5500]">{priceDisplay}</span>
            </div>

            {vehicle.description && (
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{vehicle.description}</p>
            )}

            <div className="flex flex-col gap-3">
              {user ? (
                <button onClick={() => setApptOpen(true)}
                  className="flex items-center justify-center gap-2 py-3.5 bg-[#FF5500] text-black font-black text-sm uppercase tracking-wide rounded-xl hover:bg-[#FF7733] transition">
                  <Calendar size={16} /> Schedule Test Drive
                </button>
              ) : (
                <Link href="/login"
                  className="flex items-center justify-center gap-2 py-3.5 bg-[#FF5500] text-black font-black text-sm uppercase tracking-wide rounded-xl hover:bg-[#FF7733] transition">
                  <Calendar size={16} /> Login to Schedule
                </Link>
              )}
              {user ? (
                <Link href={`/financing?vehicle=${vehicle.id}`}
                  className="flex items-center justify-center gap-2 py-3.5 border border-slate-600 text-slate-200 font-black text-sm uppercase tracking-wide rounded-xl hover:border-[#FF5500] hover:text-[#FF5500] transition">
                  <DollarSign size={16} /> Apply for Financing
                </Link>
              ) : (
                <Link href="/login"
                  className="flex items-center justify-center gap-2 py-3.5 border border-slate-600 text-slate-400 font-black text-sm uppercase tracking-wide rounded-xl hover:border-slate-400 transition">
                  <DollarSign size={16} /> Login to Apply for Financing
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Specs */}
        <section className="mb-14">
          <SectionTitle>Vehicle Specs</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {specItems.map(({ label, value, Icon }) => (
              <div key={label} className="p-4 rounded-xl bg-slate-800/60 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} className="text-[#FF5500]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
                </div>
                <p className="font-bold text-slate-200">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mb-14">
            <SectionTitle>Customer Reviews</SectionTitle>
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="p-5 rounded-xl bg-slate-800/60 border border-white/[0.06]">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <StarRating rating={r.rating} />
                    <span className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="font-bold text-slate-200 mb-1">{r.title}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{r.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      <footer className="mt-12 border-t border-white/[0.05] py-10 text-center bg-[#020817]">
        <p className="text-xl font-black tracking-[5px] text-white">NOVA</p>
        <p className="text-[9px] font-black tracking-[7px] text-[#FF5500] uppercase mt-1">MOTORS</p>
      </footer>

      {apptOpen && <AppointmentModal vehicleId={vehicle.id} onClose={() => setApptOpen(false)} />}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-5">
      <h2 className="text-xl font-black text-slate-100 whitespace-nowrap">{children}</h2>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}
