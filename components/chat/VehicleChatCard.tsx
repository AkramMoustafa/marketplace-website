'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  onNavigate: () => void;
}



export default function VehicleChatCard({ vehicle, onSchedule, onFinancing, onNavigate }: Props) {
  const [imgError, setImgError] = useState(false);
  const router = useRouter();

  const rawSrc = !imgError && vehicle.images.length > 0 ? vehicle.images[0] : null;
  const imageSrc = rawSrc ? getImageUrl(rawSrc) : PLACEHOLDER;

  const priceDisplay =
    vehicle.price_on_call || vehicle.price === null
      ? 'Call for Price'
      : `$${vehicle.price.toLocaleString()}`;

  const href = `/vehicle-detail?id=${vehicle.id}`;

  const handleNavigate = () => {
    onNavigate();
    router.push(href);
  };

  return (
    <div className="flex-shrink-0 w-[170px] bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image — clickable, closes chat then navigates */}
      <button type="button" onClick={handleNavigate} className="block w-full text-left">
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
      </button>

      {/* Content */}
      <div className="p-2.5">
        <span className="text-[9px] font-black uppercase tracking-wider text-[#B22222] block">
          {vehicle.make}
        </span>
        {/* Title — clickable */}
        <button
          type="button"
          onClick={handleNavigate}
          className="text-[10px] font-black text-gray-900 leading-tight line-clamp-2 mt-0.5 min-h-[26px] text-left w-full hover:text-[#B22222] transition-colors"
        >
          {vehicle.title}
        </button>

        <div className="mt-1.5 flex items-baseline justify-between gap-1">
          <span className="text-xs font-black text-gray-900 truncate">{priceDisplay}</span>
          {vehicle.mileage > 0 && (
            <span className="text-[9px] text-gray-400 shrink-0">
              {vehicle.mileage.toLocaleString()} mi
            </span>
          )}
        </div>

        {/* CTAs */}
        <div className="mt-2 space-y-1.5">
          <button
            type="button"
            onClick={handleNavigate}
            className="flex items-center justify-center w-full py-1.5 bg-gray-900 text-white text-[10px] font-black rounded-lg hover:bg-[#B22222] transition-colors"
          >
            View Vehicle
          </button>
          <button
            type="button"
            onClick={onSchedule}
            className="flex items-center justify-center w-full py-1.5 bg-[#B22222]/10 text-[#B22222] text-[10px] font-black rounded-lg hover:bg-[#B22222] hover:text-white transition-colors border border-[#B22222]/20"
          >
            Test Drive
          </button>
        </div>
      </div>
    </div>
  );
}
