import { useEffect, useId, useState } from "react";
import { Clock, ShieldCheck, AlertCircle } from "lucide-react";

type Props = {
  value: number;
  onChange: (v: number) => void;
  max?: number;
};

const formatHrs = (n: number) => n.toFixed(2).replace(/\.00$/, "");

export function CycleDial({ value, onChange, max = 70 }: Props) {
  const pct = Math.max(0, Math.min(1, value / max));
  const remaining = Math.max(0, max - value);
  const sliderId = useId();
  const exactId = useId();

  const [draft, setDraft] = useState(() => value.toFixed(2).replace(/\.00$/, ""));

  useEffect(() => {
    setDraft(value.toFixed(2).replace(/\.00$/, ""));
  }, [value]);

  const commitDraft = (raw: string) => {
    const n = parseFloat(raw);
    if (Number.isNaN(n)) {
      setDraft(value.toFixed(2).replace(/\.00$/, ""));
      return;
    }
    const clamped = Math.min(max, Math.max(0, n));
    onChange(clamped);
    setDraft(clamped.toFixed(2).replace(/\.00$/, ""));
  };

  // 270° arc gauge geometry
  const R = 50;
  const CX = 60;
  const CY = 60;
  const START = 135; // deg
  const SWEEP = 270; // deg
  const circ = (SWEEP / 360) * (2 * Math.PI * R);

  // Smart threshold styling
  const isCritical = remaining <= 10;
  const isCaution = remaining <= 20 && !isCritical;
  
  const strokeColor = isCritical 
    ? "#F43F5E" 
    : isCaution 
      ? "#F59E0B" 
      : "#3B82F6";

  const glowShadow = isCritical
    ? "rgba(244, 63, 94, 0.4)"
    : isCaution
      ? "rgba(245, 158, 11, 0.4)"
      : "rgba(59, 130, 246, 0.45)";

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
      {/* Circular Gauge */}
      <div className="relative h-[126px] w-[126px] shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="cycleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={glowShadow} />
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${circ} ${2 * Math.PI * R}`}
            transform={`rotate(${START} ${CX} ${CY})`}
          />

          {/* Active progress stroke */}
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={isCritical || isCaution ? strokeColor : "url(#cycleGradient)"}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${circ * pct} ${2 * Math.PI * R}`}
            transform={`rotate(${START} ${CX} ${CY})`}
            filter="url(#gaugeGlow)"
            style={{
              transition: "stroke-dasharray 0.4s cubic-bezier(0.16,1,0.3,1), stroke 0.3s",
            }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
          <label htmlFor={exactId} className="sr-only">
            Cycle hours used — type an exact value
          </label>
          <div className="flex items-baseline justify-center">
            <input
              id={exactId}
              type="text"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={(e) => commitDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className="w-14 rounded bg-transparent text-center font-mono text-xl font-bold tabular-nums text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <span className="font-mono text-xs font-semibold text-slate-400">h</span>
          </div>
          <span className="font-mono text-[0.58rem] uppercase tracking-wider text-slate-500">
            of 70.0h
          </span>
        </div>
      </div>

      {/* Slider & Telemetry Information */}
      <div className="flex-1 w-full min-w-0">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor={sliderId} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Clock size={13} className="text-blue-400" />
            <span>Cycle Used (70h / 8-Day)</span>
          </label>
          <span className="font-mono text-xs font-semibold text-slate-400">
            {formatHrs(value)} / {max} hrs
          </span>
        </div>

        <input
          id={sliderId}
          type="range"
          min={0}
          max={max}
          step={0.25}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="haulr-range w-full"
          aria-valuetext={`${formatHrs(value)} of ${max} hours used`}
        />

        {/* Quick Stepper Pills & Remaining Hours Readout */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {isCritical ? (
              <span className="flex items-center gap-1 text-[0.7rem] font-medium text-rose-400">
                <AlertCircle size={12} />
                <span>{formatHrs(remaining)}h left · Restart likely</span>
              </span>
            ) : isCaution ? (
              <span className="flex items-center gap-1 text-[0.7rem] font-medium text-amber-400">
                <AlertCircle size={12} />
                <span>{formatHrs(remaining)}h remaining in cycle</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[0.7rem] font-medium text-blue-400">
                <ShieldCheck size={12} />
                <span>{formatHrs(remaining)}h remaining · Safe buffer</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChange(Math.max(0, value - 1))}
              className="rounded border border-white/[0.08] bg-slate-800/80 px-1.5 py-0.5 font-mono text-[0.65rem] text-slate-300 hover:border-blue-500/40 hover:text-white transition-colors"
              title="Decrease 1 hour"
            >
              -1h
            </button>
            <button
              type="button"
              onClick={() => onChange(Math.min(max, value + 1))}
              className="rounded border border-white/[0.08] bg-slate-800/80 px-1.5 py-0.5 font-mono text-[0.65rem] text-slate-300 hover:border-blue-500/40 hover:text-white transition-colors"
              title="Increase 1 hour"
            >
              +1h
            </button>
            <button
              type="button"
              onClick={() => onChange(0)}
              className="rounded border border-white/[0.08] bg-slate-800/80 px-1.5 py-0.5 font-mono text-[0.65rem] text-slate-400 hover:text-white transition-colors"
              title="Reset to 0h"
            >
              0h
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
