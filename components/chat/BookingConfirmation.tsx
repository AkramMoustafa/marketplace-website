'use client';

import { CheckCircle, Car, Calendar, Clock, X } from 'lucide-react';

export interface ConfirmationData {
  vehicleTitle: string;
  date: string;
  time: string;
  confirmationId: string;
}

interface Props {
  data: ConfirmationData;
  onClose: () => void;
}

export default function BookingConfirmation({ data, onClose }: Props) {
  return (
    <div className="flex flex-col items-center text-center px-8 py-8 gap-5">
      {/* Success icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle size={40} className="text-green-500" strokeWidth={1.5} />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#B22222] flex items-center justify-center border-2 border-white">
          <Car size={14} className="text-white" />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-black text-gray-900">Test Drive Scheduled!</h3>
        <p className="text-gray-400 text-sm mt-1">We'll see you soon at NOVA Motors.</p>
      </div>

      {/* Details card */}
      <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden text-left">
        <div className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-200">
          <div className="w-9 h-9 rounded-xl bg-[#B22222]/10 flex items-center justify-center shrink-0">
            <Car size={16} className="text-[#B22222]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vehicle</p>
            <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{data.vehicleTitle}</p>
          </div>
        </div>

        <div className="px-5 py-3.5 flex items-center gap-3 border-b border-gray-200">
          <div className="w-9 h-9 rounded-xl bg-[#B22222]/10 flex items-center justify-center shrink-0">
            <Calendar size={16} className="text-[#B22222]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{data.date}</p>
          </div>
        </div>

        <div className="px-5 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#B22222]/10 flex items-center justify-center shrink-0">
            <Clock size={16} className="text-[#B22222]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{data.time}</p>
          </div>
        </div>
      </div>

      {/* Confirmation number */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-[#B22222] to-[#8B1A1A] p-px">
        <div className="bg-white rounded-[15px] px-5 py-3.5 text-center">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Confirmation #</p>
          <p className="text-2xl font-black text-[#B22222] tracking-widest mt-1">{data.confirmationId}</p>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-700 active:scale-95 transition-all"
      >
        Done
      </button>
    </div>
  );
}
