import React from "react";
import { Check, X, Play, Clock, Navigation, Package, Warehouse } from "lucide-react";
import type { PendingTripParams } from "@/lib/uiActionBus";

interface ConfirmTripCardProps {
  params: PendingTripParams;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export const ConfirmTripCard: React.FC<ConfirmTripCardProps> = ({
  params,
  onConfirm,
  onCancel,
  disabled = false,
}) => {
  return (
    <div className="my-2.5 w-full rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Play size={10} className="fill-blue-600 ml-0.5" />
        </span>
        <h4 className="text-xs font-bold text-slate-800">
          Proposed Dispatch Route
        </h4>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 p-2">
          <Navigation size={13} className="shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1">
            <span className="text-[0.62rem] text-slate-400 font-semibold uppercase block">Origin</span>
            <span className="font-medium text-slate-800 truncate block">{params.current_location}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 p-2">
          <Package size={13} className="shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1">
            <span className="text-[0.62rem] text-slate-400 font-semibold uppercase block">Pickup Facility</span>
            <span className="font-medium text-slate-800 truncate block">{params.pickup_location}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 p-2">
          <Warehouse size={13} className="shrink-0 text-blue-600" />
          <div className="min-w-0 flex-1">
            <span className="text-[0.62rem] text-slate-400 font-semibold uppercase block">Delivery Consignee</span>
            <span className="font-medium text-slate-800 truncate block">{params.dropoff_location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 text-slate-600 pt-1">
          <span className="flex items-center gap-1 text-[0.7rem] text-slate-500">
            <Clock size={12} className="text-amber-500" />
            Prior Cycle Used:
          </span>
          <span className="font-mono font-bold text-slate-900">{params.cycle_used_hrs} hrs</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-2.5">
        <button
          onClick={onConfirm}
          disabled={disabled}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Check size={13} strokeWidth={2.5} />
          <span>Confirm Dispatch</span>
        </button>
        <button
          onClick={onCancel}
          disabled={disabled}
          className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <X size={13} />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
};
