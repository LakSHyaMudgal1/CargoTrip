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
    <div className="my-3 w-full rounded-2xl border border-white/[0.12] bg-slate-900/90 p-4 shadow-xl backdrop-blur-xl transition-all">
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
          <Play size={11} className="fill-blue-400 ml-0.5" />
        </span>
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
          Proposed Haul Dispatch
        </h4>
      </div>

      <div className="mt-3 space-y-2.5 text-xs">
        <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-slate-950/50 p-2">
          <Navigation size={14} className="shrink-0 text-cyan-400" />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[0.62rem] uppercase tracking-wider text-slate-500">Origin</div>
            <div className="truncate font-semibold text-white">{params.current_location}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-slate-950/50 p-2">
          <Package size={14} className="shrink-0 text-blue-400" />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[0.62rem] uppercase tracking-wider text-slate-500">Freight Pickup</div>
            <div className="truncate font-semibold text-white">{params.pickup_location}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-slate-950/50 p-2">
          <Warehouse size={14} className="shrink-0 text-violet-400" />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[0.62rem] uppercase tracking-wider text-slate-500">Freight Delivery</div>
            <div className="truncate font-semibold text-white">{params.dropoff_location}</div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-slate-950/50 p-2">
          <div className="flex items-center gap-2">
            <Clock size={14} className="shrink-0 text-amber-400" />
            <span className="font-mono text-[0.68rem] text-slate-400 uppercase tracking-wider">Prior Cycle Hours:</span>
          </div>
          <span className="font-mono text-xs font-bold text-white">{params.cycle_used_hrs} hrs used</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-white/[0.08] pt-3">
        <button
          onClick={onConfirm}
          disabled={disabled}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-glow-sm transition-all hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          <Check size={13} strokeWidth={2.5} />
          <span>Authorize Dispatch</span>
        </button>
        <button
          onClick={onCancel}
          disabled={disabled}
          className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.1] bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <X size={13} />
          <span>Dismiss</span>
        </button>
      </div>
    </div>
  );
};
