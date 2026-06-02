'use client';

import { CheckCircle, Car, Calendar, Clock } from 'lucide-react';

interface Props {
  vehicleTitle: string;
  date: Date;
  time: string;
  confirmationId: string;
}

export default function AppointmentSuccessStep({ vehicleTitle, date, time, confirmationId }: Props) {
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="flex flex-col items-center text-center gap-3.5">
      {/* Icon */}
      <div className="relative">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle size={28} className="text-green-500" strokeWidth={1.5} />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF5500] flex items-center justify-center border-2 border-white">
          <Car size={11} className="text-white" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-black text-gray-900">Test Drive Scheduled!</h3>
        <p className="text-[11px] text-gray-400 mt-0.5">We'll see you soon at NOVA Motors.</p>
      </div>

      {/* Details */}
      <div className="w-full bg-gray-50 border border-gray-200 rounded-xl overflow-hidden text-left">
        <div className="px-3 py-2.5 flex items-center gap-2.5 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-[#FF5500]/10 flex items-center justify-center shrink-0">
            <Car size={13} className="text-[#FF5500]" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Vehicle</p>
            <p className="text-xs font-bold text-gray-900 truncate">{vehicleTitle}</p>
          </div>
        </div>

        <div className="px-3 py-2.5 flex items-center gap-2.5 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-[#FF5500]/10 flex items-center justify-center shrink-0">
            <Calendar size={13} className="text-[#FF5500]" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
            <p className="text-xs font-bold text-gray-900">{dateStr}</p>
          </div>
        </div>

        <div className="px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FF5500]/10 flex items-center justify-center shrink-0">
            <Clock size={13} className="text-[#FF5500]" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Time</p>
            <p className="text-xs font-bold text-gray-900">{time}</p>
          </div>
        </div>
      </div>

      {/* Confirmation number */}
      <div className="w-full rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FF7733] p-px">
        <div className="bg-white rounded-[11px] px-4 py-2.5 text-center">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Confirmation #</p>
          <p className="text-lg font-black text-[#FF5500] tracking-widest mt-0.5">{confirmationId}</p>
        </div>
      </div>
    </div>
  );
}
