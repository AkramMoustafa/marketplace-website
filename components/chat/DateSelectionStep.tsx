'use client';

import CalendarPicker from './CalendarPicker';

interface Props {
  onSelect: (date: Date) => void;
}

export default function DateSelectionStep({ onSelect }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">Pick a date for your visit:</p>
      <CalendarPicker value={null} onChange={onSelect} minDate={today} />
    </div>
  );
}
