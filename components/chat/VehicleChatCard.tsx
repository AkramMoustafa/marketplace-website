'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, DollarSign } from 'lucide-react';
import { getImageUrl } from '@/lib/api';

export interface VehicleData {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number | null;
  price_on_call: boolean;
  mileage: number;
  images: string[];
  stock_number?: string | null;
  color?: string | null;
  body_type?: string | null;
}

const PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI2YxZjVmOSIvPjx0ZXh0IHg9IjIwMCIgeT0iMTMwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iI2NiZDVlMSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';

interface Props {
  vehicle: VehicleData;
  onSchedule: () => void;
  onFinancing: () => void;
}

export default function VehicleChatCard({ vehicle, onSchedule, onFinancing }: Props) {
  const [imgError, setImgError] = useState(false);

  const rawSrc = !imgError && vehicle.images.length > 0 ? vehicle.images[0] : null;
  const imageSrc = rawSrc ? getImageUrl(rawSrc) : PLACEHOLDER;

  const priceDisplay =
    vehicle.price_on_call || vehicle.price === null
      ? 'Call for Price'
      : `$${vehicle.price.toLocaleString()}`;

  return (
    <div className="flex-shrink-0 w-[210px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
        <Image
          src={imageSrc}
          alt={vehicle.title}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized={imageSrc === PLACEHOLDER}
        />
        <div className="absolute top-1.5 left-1.5 bg-gray-900/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
          {vehicle.year}
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5">
        <span className="text-[9px] font-black uppercase tracking-wider text-[#FF5500] block">
          {vehicle.make}
        </span>
        <p className="text-[11px] font-black text-gray-900 leading-tight line-clamp-2 mt-0.5 min-h-[26px]">
          {vehicle.title}
        </p>

        <div className="mt-1.5 flex items-baseline justify-between gap-1">
          <span className="text-sm font-black text-gray-900 truncate">{priceDisplay}</span>
          {vehicle.mileage > 0 && (
            <span className="text-[9px] text-gray-400 shrink-0">
              {vehicle.mileage.toLocaleString()} mi
            </span>
          )}
        </div>

        {/* CTAs */}
        <div className="mt-2 space-y-1.5">
          <Link
            href={`/inventory/${vehicle.id}`}
            className="flex items-center justify-center w-full py-1.5 bg-gray-900 text-white text-[10px] font-black rounded-lg hover:bg-[#FF5500] transition-colors"
          >
            View Vehicle
          </Link>
          <button
            onClick={onSchedule}
            className="flex items-center justify-center gap-1 w-full py-1.5 bg-[#FF5500] text-white text-[10px] font-black rounded-lg hover:bg-[#FF7733] transition-colors"
          >
            <Calendar size={10} />
            Test Drive
          </button>
          <button
            onClick={onFinancing}
            className="flex items-center justify-center gap-1 w-full py-1.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-200 transition-colors"
          >
            <DollarSign size={10} />
            Get Financing
          </button>
        </div>
      </div>
    </div>
  );
}
