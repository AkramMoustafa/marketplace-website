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
              ? 'bg-[#FF5500] text-white border-[#FF5500] shadow-sm shadow-[#FF5500]/20'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#FF5500]/50 hover:text-[#FF5500] hover:bg-orange-50',
          ].join(' ')}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
