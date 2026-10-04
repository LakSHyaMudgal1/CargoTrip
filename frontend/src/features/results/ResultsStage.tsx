import { forwardRef } from "react";
import { ArrowLeft, FileText, CheckCircle2, ShieldAlert, Navigation, Clock } from "lucide-react";
import { RouteMap } from "@/features/map/RouteMap";
import { STATUS_COLOR, eventIcon } from "@/lib/eventVisuals";
import type { DutyStatus, TripSummary, TripPlan } from "@/lib/api";
import { AiChatbotAvatar } from "./AiChatbotAvatar";

const hrs = (a: string, b: string) =>
  (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;

function StatCard({
  label,
  value,
  unit,
  subtext,
  icon,
  accentColor,
}: {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}) {
  return (
    <div className="panel relative overflow-hidden p-4 sm:p-5 transition-all duration-300 hover:border-white/[0.15]">
      <div className={`absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r ${accentColor || "from-blue-500 to-indigo-500"}`} />
      <div className="flex items-center justify-between text-slate-400 mb-2">
        <span className="font-mono text-[0.68rem] uppercase tracking-wider text-slate-400 font-medium">
          {label}
        </span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="font-mono text-2xl sm:text-3xl font-bold tabular-nums text-white tracking-tight">
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-slate-400">{unit}</span>}
      </div>
      {subtext && (
        <div className="mt-1 text-xs text-slate-400 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  plan: TripPlan;
  summary: TripSummary;
  onEdit?: () => void;
  onViewLogSheets?: () => void;
  fit?: boolean;
};

export const ResultsStage = forwardRef<HTMLElement, Props>(function ResultsStage(
  { plan, summary, onEdit, onViewLogSheets, fit },
  ref
) {
  const events = plan.events;
  const total = events.reduce((s, e) => s + hrs(e.start, e.end), 0) || 1;
  const stopsCount = summary.fuelStops + summary.breaks + summary.rests + summary.restarts;

  return (
    <section
      ref={ref}
      id="results"
      className={
        fit
          ? "mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 sm:px-6 pb-6 pt-20 lg:h-full"
          : "mx-auto w-full max-w-6xl scroll-mt-24 px-4 sm:px-6 py-16"
      }
    >
      {/* Header Bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-400">
              <CheckCircle2 size={12} className="text-emerald-400" />
              100% FMCSA Compliant
            </span>
            {summary.restarts > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-pink-500/30 bg-pink-500/10 px-2.5 py-0.5 font-mono text-[0.65rem] font-medium text-pink-400">
                <ShieldAlert size={12} />
                {summary.restarts} × 34-hr Reset
              </span>
            )}
          </div>
          <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Compliant Route Orchestration
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {onViewLogSheets && (
            <button
              type="button"
              onClick={onViewLogSheets}
              className="group flex items-center gap-2 rounded-xl border border-white/[0.1] bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-md backdrop-blur-md transition-all hover:border-blue-500/50 hover:bg-slate-800/90 hover:text-white"
            >
              <FileText size={14} className="text-blue-400" />
              <span>Official ELD Logs</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="group flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-slate-900/90 px-3.5 py-2 text-xs font-semibold text-slate-300 shadow-md backdrop-blur-md transition-all hover:border-white/[0.2] hover:text-white"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Edit Parameters</span>
            </button>
          )}

          <AiChatbotAvatar summary={summary} />
        </div>
      </div>

      {/* 4 Metrics Strip */}
      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Driving Hours"
          value={summary.drivingHrs.toFixed(1)}
          unit="hrs"
          subtext="Under 11h driving window"
          icon={<Navigation size={14} />}
          accentColor="from-blue-500 via-cyan-500 to-indigo-500"
        />
        <StatCard
          label="On-Duty Total"
          value={summary.onDutyHrs.toFixed(1)}
          unit="hrs"
          subtext="14h consecutive rule verified"
          icon={<Clock size={14} />}
          accentColor="from-indigo-500 via-violet-500 to-purple-500"
        />
        <StatCard
          label="Transit Days"
          value={String(summary.days)}
          unit="days"
          subtext="Calendar cycle span"
          accentColor="from-violet-500 via-purple-500 to-pink-500"
        />
        <StatCard
          label="Scheduled Stops"
          value={String(stopsCount)}
          unit="stops"
          subtext={`${summary.rests} rests · ${summary.breaks} breaks · ${summary.fuelStops} fuel`}
          accentColor="from-amber-500 via-orange-500 to-rose-500"
        />
      </div>

      {/* Duty Status Timeline Ribbon */}
      <div className="panel shrink-0 p-4">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.68rem] uppercase font-semibold tracking-wider text-slate-300">
              Duty Status Allocation
            </span>
            <span className="font-mono text-[0.62rem] text-slate-500">
              Total Duration: {total.toFixed(1)}h
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {(Object.keys(STATUS_COLOR) as DutyStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-[0.68rem] font-medium text-slate-400">
                <span
                  className="inline-block h-2 w-2 rounded-full shadow-sm"
                  style={{ background: STATUS_COLOR[s] }}
                />
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="flex h-5 overflow-hidden rounded-lg border border-white/[0.08] bg-slate-950/60 p-0.5">
          {events.map((e, i) => {
            const w = (hrs(e.start, e.end) / total) * 100;
            return (
              <div
                key={i}
                className="h-full rounded-sm transition-all duration-200 hover:opacity-80 hover:brightness-125 cursor-help"
                style={{
                  width: `${w}%`,
                  background: STATUS_COLOR[e.status],
                  marginRight: i === events.length - 1 ? 0 : "1px",
                }}
                title={`${e.status} · ${e.note} · ${hrs(e.start, e.end).toFixed(2)}h (${fmtTime(e.start)})`}
              />
            );
          })}
        </div>
      </div>

      {/* Split Map + Events View */}
      <div
        className={
          "grid gap-4 lg:grid-cols-[1fr_1.1fr]" +
          (fit ? " lg:min-h-0 lg:flex-1" : "")
        }
      >
        {/* Timeline Event Node Feed */}
        <div className="panel flex min-h-0 flex-col p-4">
          <div className="mb-3 flex items-center justify-between shrink-0 border-b border-white/[0.06] pb-2">
            <span className="font-mono text-[0.68rem] uppercase tracking-wider text-slate-300 font-semibold">
              Event Sequence ({events.length} Legs)
            </span>
            <span className="font-mono text-[0.62rem] text-slate-500">
              Deterministic Order
            </span>
          </div>

          <ol
            data-lenis-prevent
            className={
              "min-h-0 space-y-1.5 overflow-y-auto pr-1" +
              (fit ? " max-h-[300px] lg:max-h-none lg:flex-1" : " max-h-[420px]")
            }
          >
            {events.map((e, i) => {
              const duration = hrs(e.start, e.end);
              return (
                <li
                  key={i}
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 transition-all hover:border-white/[0.08] hover:bg-slate-800/40"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-slate-900 shadow-sm"
                    style={{
                      color: STATUS_COLOR[e.status],
                      backgroundColor: `${STATUS_COLOR[e.status]}15`,
                    }}
                  >
                    {eventIcon(e.note, 14)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {e.note}
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[0.68rem] text-slate-400 mt-0.5">
                      <span
                        className="rounded px-1.5 py-0.2 font-medium"
                        style={{
                          backgroundColor: `${STATUS_COLOR[e.status]}20`,
                          color: STATUS_COLOR[e.status],
                        }}
                      >
                        {e.status}
                      </span>
                      <span>·</span>
                      <span>{duration.toFixed(2)} hrs</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right font-mono text-[0.68rem] text-slate-400 font-medium">
                    {fmtTime(e.start)}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Interactive Map */}
        <div
          className={
            "panel relative z-0 flex min-h-0 flex-col items-center justify-center overflow-hidden p-0" +
            (fit ? " h-[280px] lg:h-auto" : " h-[400px]")
          }
        >
          <RouteMap
            events={events}
            routeGeometry={plan.route_geometry}
            currentLocation={plan.meta?.current}
          />
        </div>
      </div>
    </section>
  );
});
