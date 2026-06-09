import { CheckCircle2 } from 'lucide-react';

interface Props {
  features: string[];
}

export default function VehicleFeatures({ features }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      {features.map(feature => (
        <div
          key={feature}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl
            bg-[#0d1526] border border-white/[0.05]"
        >
          <CheckCircle2 size={14} className="text-[#B22222] shrink-0" />
          <span className="text-sm text-slate-300 font-medium">{feature}</span>
        </div>
      ))}
    </div>
  );
}
