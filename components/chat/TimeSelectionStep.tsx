'use client';

import { ChevronLeft } from 'lucide-react';
import TimeSlotPicker from './TimeSlotPicker';

interface Props {
  date: Date;
  onSelect: (time: string) => void;
  onBack: () => void;
}

export default function TimeSelectionStep({ date, onSelect, onBack }: Props) {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 mb-3 transition-colors"
      >
        <ChevronLeft size={12} />
        {dateStr}
      </button>
      <p className="text-xs text-gray-500 mb-3">Choose an available time:</p>
      <TimeSlotPicker value={null} onChange={onSelect} />
    </div>
  );
}
