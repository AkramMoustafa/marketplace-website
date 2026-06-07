import Link from 'next/link';
import type { Car } from '@/data/cars';

interface Props {
  cars: Car[];
}

// One distinct gradient per related card slot
const SLOT_GRADIENTS = [
  'from-slate-600 via-slate-700 to-slate-900',
  'from-zinc-700  via-slate-700 to-slate-900',
  'from-slate-700 via-zinc-800  to-slate-900',
];

export default function RelatedInventory({ cars }: Props) {
  if (cars.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cars.map((car, idx) => {
        const hasImage = car.images.length > 0;
        const gradient = SLOT_GRADIENTS[idx % SLOT_GRADIENTS.length];

        return (
          <div
            key={car.id}
            className="rounded-2xl bg-[#0d1526] border border-white/[0.07] overflow-hidden
              hover:border-[#B22222]/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            {/* Image / placeholder */}
            <div className={`relative aspect-[16/10] ${hasImage ? '' : `bg-gradient-to-br ${gradient}`}`}>
              {hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={car.images[0]}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center select-none">
                  <p className="text-slate-500 text-xs font-medium">
                    {car.year} {car.make}
                  </p>
                </div>
              )}

              {/* Make badge */}
              <div className="absolute top-2.5 left-2.5 px-2 py-[3px] bg-[#B22222] text-black text-[8px] font-black uppercase rounded shadow-sm">
                {car.make}
              </div>
            </div>

            {/* Card body */}
            <div className="px-4 py-4">
              <p className="text-[9px] font-black uppercase tracking-[3px] text-[#B22222] mb-0.5">
                {car.year} · {car.make}
              </p>
              <p className="text-base font-black text-slate-100 mb-2 leading-snug">
                {car.model}
              </p>

              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xl font-black text-slate-100">
                  ${car.price.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {car.mileage.toLocaleString()} mi
                </span>
              </div>

              <Link
                href={`/inventory/${car.id}`}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl
                  bg-slate-700/50 border border-white/[0.06] text-slate-300
                  font-black text-[10px] uppercase tracking-wide
                  hover:bg-[#B22222] hover:border-[#B22222] hover:text-black
                  transition-all duration-150"
              >
                View Details →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
