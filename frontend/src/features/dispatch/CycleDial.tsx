import { useEffect, useId, useState } from "react";
import { Clock, ShieldCheck, AlertCircle } from "lucide-react";

type Props = {
  value: number;
  onChange: (v: number) => void;
  max?: number;
};

const formatHrs = (n: number) => n.toFixed(1).replace(/\.0$/, "");

export function CycleDial({ value, onChange, max = 70 }: Props) {
  const pct = Math.max(0, Math.min(1, value / max));
  const remaining = Math.max(0, max - value);
  const sliderId = useId();
  const exactId = useId();

  const [draft, setDraft] = useState(() => value.toFixed(1).replace(/\.0$/, ""));

  useEffect(() => {
    setDraft(value.toFixed(1).replace(/\.0$/, ""));
  }, [value]);

  const commitDraft = (raw: string) => {
    const n = parseFloat(raw);
    if (Number.isNaN(n)) {
      setDraft(value.toFixed(1).replace(/\.0$/, ""));
      return;
    }
    const clamped = Math.min(max, Math.max(0, n));
    onChange(clamped);
    setDraft(clamped.toFixed(1).replace(/\.0$/, ""));
  };

  const isCritical = remaining <= 10;
  const isCaution = remaining <= 20 && !isCritical;

  const strokeColor = isCritical ? "#EF4444" : isCaution ? "#F59E0B" : "#2563EB";

  // 270° arc geometry
  const R = 44;
  const CX = 54;
  const CY = 54;
  const START = 135;
  const SWEEP = 270;
  const circ = (SWEEP / 360) * (2 * Math.PI * R);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
      {/* Gauge */}
      <div className="relative h-[108px] w-[108px] shrink-0">
        <svg viewBox="0 0 108 108" className="h-full w-full" aria-hidden="true">
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${circ} ${2 * Math.PI * R}`}
            transform={`rotate(${START} ${CX} ${CY})`}
          />
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${circ * pct} ${2 * Math.PI * R}`}
            transform={`rotate(${START} ${CX} ${CY})`}
            style={{
              transition: "stroke-dasharray 0.3s ease, stroke 0.2s ease",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-0.5">
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
              className="w-12 bg-transparent text-center font-mono text-lg font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 rounded"
            />
            <span className="font-mono text-xs font-semibold text-slate-500">h</span>
          </div>
          <span className="font-mono text-[0.6rem] text-slate-400 font-medium">
            of 70.0h
          </span>
        </div>
      </div>

      {/* Control Area */}
      <div className="flex-1 w-full min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={sliderId} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Clock size={13} className="text-blue-600" />
            <span>Cycle Hours Used (70h/8d)</span>
          </label>
          <span className="font-mono text-xs font-bold text-slate-700">
            {formatHrs(value)} hrs
          </span>
        </div>

        <input
          id={sliderId}
          type="range"
          min={0}
          max={max}
          step={0.5}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          aria-valuetext={`${formatHrs(value)} of ${max} hours used`}
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          {isCritical ? (
            <span className="flex items-center gap-1 text-[0.7rem] font-semibold text-red-600">
              <AlertCircle size={11} />
              <span>{formatHrs(remaining)}h remaining · Critical limit</span>
            </span>
          ) : isCaution ? (
            <span className="flex items-center gap-1 text-[0.7rem] font-semibold text-amber-600">
              <AlertCircle size={11} />
              <span>{formatHrs(remaining)}h remaining · Rest suggested</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[0.7rem] font-medium text-emerald-600">
              <ShieldCheck size={11} />
              <span>{formatHrs(remaining)}h remaining · Compliant</span>
            </span>
          )}

          <div className="flex items-center gap-1 font-mono text-[0.65rem]">
            <button
              type="button"
              onClick={() => onChange(Math.max(0, value - 1))}
              className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              -1h
            </button>
            <button
              type="button"
              onClick={() => onChange(Math.min(max, value + 1))}
              className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              +1h
            </button>
            <button
              type="button"
              onClick={() => onChange(0)}
              className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-slate-400 hover:text-slate-700"
            >
              0h
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
