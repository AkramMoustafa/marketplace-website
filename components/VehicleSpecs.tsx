import Link from 'next/link';
import { Phone, Calendar, DollarSign } from 'lucide-react';
import type { Car } from '@/data/cars';

interface Props {
  car: Car;
}

export default function VehicleSpecs({ car }: Props) {
  const priceFormatted = `$${car.price.toLocaleString()}`;
  const mileageFormatted = `${car.mileage.toLocaleString()} mi`;

  const specRows: [string, string][] = [
    ['Mileage',      mileageFormatted],
    ['VIN',          car.vin],
    ['Transmission', car.transmission],
    ['Drivetrain',   car.drivetrain],
    ['Fuel Type',    car.fuelType],
    ['Body Style',   car.bodyStyle],
    ['Ext. Color',   car.exteriorColor],
    ['Int. Color',   car.interiorColor],
  ];

  return (
    <div className="space-y-4">

      {/* ── Vehicle header card ─────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#0d1526] border border-white/[0.08] overflow-hidden shadow-2xl shadow-black/40">
        <div className="h-1 bg-[#FF5500]" />

        <div className="px-6 py-5 border-b border-white/[0.06]">
          <p className="text-[10px] font-black uppercase tracking-[3px] text-[#FF5500] mb-1">
            {car.year} · {car.make}
          </p>
          <h1 className="text-2xl font-black text-slate-100 leading-tight">
            {car.model}
          </h1>
        </div>

        {/* Price */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-[#FF5500]/[0.04]">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            Asking Price
          </p>
          <p className="text-4xl font-black text-[#FF5500] leading-none">{priceFormatted}</p>
        </div>

        {/* Spec rows */}
        <div className="px-6 py-4 border-b border-white/[0.06] space-y-2.5">
          {specRows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0 pt-px">
                {label}
              </span>
              <span
                className={`text-right font-bold leading-snug ${
                  label === 'VIN'
                    ? 'text-[10px] font-mono break-all text-slate-400'
                    : 'text-sm text-slate-200'
                }`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="px-6 py-5 space-y-2.5">
          <a
            href="tel:+15550000000"
            className="w-full flex items-center justify-center gap-2 py-3.5
              bg-[#FF5500] text-black font-black text-[11px] uppercase tracking-widest
              rounded-xl hover:bg-[#FF7733] transition shadow-lg shadow-[#FF5500]/15"
          >
            <Phone size={13} /> Call Dealership
          </a>

          <a
            href="mailto:sales@novamotors.com?subject=Test Drive Request"
            className="w-full flex items-center justify-center gap-2 py-3.5
              bg-slate-700/50 border border-white/[0.07] text-slate-200
              font-black text-[11px] uppercase tracking-widest rounded-xl
              hover:border-[#FF5500]/40 hover:text-[#FF5500] transition"
          >
            <Calendar size={13} /> Schedule Test Drive
          </a>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-3
              border border-white/[0.05] text-slate-500
              font-black text-[10px] uppercase tracking-widest rounded-xl
              hover:border-slate-600 hover:text-slate-300 transition"
          >
            <DollarSign size={12} /> Apply for Financing
          </Link>
        </div>
      </div>

      {/* ── Finance estimate card ────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#0d1526] border border-white/[0.08] px-6 py-5">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">
          Est. Monthly Payment
        </p>
        <div className="flex items-end gap-1.5 mb-1">
          <span className="text-3xl font-black text-white leading-none">
            ${Math.round(car.price / 60).toLocaleString()}
          </span>
          <span className="text-slate-400 text-sm mb-0.5">/mo</span>
        </div>
        <p className="text-slate-600 text-[10px]">
          Est. based on 60 mo · 6.9% APR · $0 down
        </p>
      </div>
    </div>
  );
}
