'use client';

export const DEFAULT_TIME_SLOTS = [
  '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '4:00 PM', '5:00 PM',
];

interface Props {
  value: string | null;
  onChange: (slot: string) => void;
  slots?: string[];
}

export default function TimeSlotPicker({ value, onChange, slots = DEFAULT_TIME_SLOTS }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map(slot => (
        <button
          key={slot}
          type="button"
          onClick={() => onChange(slot)}
          className={[
            'py-2.5 px-1 text-xs font-semibold rounded-xl border transition-all text-center',
            value === slot
              ? 'bg-[#B22222] text-white border-[#B22222] shadow-sm shadow-[#B22222]/20'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#B22222]/50 hover:text-[#B22222] hover:bg-red-50',
          ].join(' ')}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
