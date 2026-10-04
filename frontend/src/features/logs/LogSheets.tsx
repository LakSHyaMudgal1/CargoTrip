import { useMemo, useRef, useState } from "react";
import { Download, FileText, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { TripPlan } from "@/lib/api";
import { buildDaySheets, SHEET, type DaySheet } from "./logSheet";
import { LogSheetSVG, type CycleContext } from "./LogSheetSVG";

function useCycleContexts(sheets: DaySheet[], priorCycle: number): CycleContext[] {
  return useMemo(() => {
    let running = 0;
    return sheets.map((s) => {
      running += s.totals.driving + s.totals.onDuty;
      return { priorCycle, cumulativeOnDutyThroughDay: running };
    });
  }, [sheets, priorCycle]);
}

export function LogSheets({ plan }: { plan: TripPlan }) {
  const sheets = useMemo(() => buildDaySheets(plan), [plan]);
  const priorCycle = plan.meta?.cycle_used_hrs ?? 0;
  const cycles = useCycleContexts(sheets, priorCycle);

  const [active, setActive] = useState(0);
  const [exporting, setExporting] = useState(false);
  const exportRefs = useRef<(SVGSVGElement | null)[]>([]);

  const carrier = "HAULR Logistics LLC";
  const home = plan.meta?.current ? `Home Terminal — ${plan.meta.current}` : undefined;
  const shipper =
    plan.meta?.pickup && plan.meta?.dropoff
      ? `General Freight · ${plan.meta.pickup} → ${plan.meta.dropoff}`
      : undefined;

  if (sheets.length === 0) return null;

  async function exportPdf() {
    setExporting(true);
    try {
      const [{ jsPDF }, svg2pdfMod] = await Promise.all([
        import("jspdf"),
        import("svg2pdf.js"),
      ]);
      const svg2pdf = (svg2pdfMod as any).svg2pdf ?? (svg2pdfMod as any).default;

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 22;
      const w = pageW - margin * 2;
      const h = (SHEET.h / SHEET.w) * w;

      for (let i = 0; i < exportRefs.current.length; i++) {
        const svg = exportRefs.current[i];
        if (!svg) continue;
        if (i > 0) doc.addPage();
        await svg2pdf(svg, doc, { x: margin, y: margin, width: w, height: h });
      }
      doc.save(`haulr-eld-logs-${plan.trip_id ?? "trip"}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("Could not generate the PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16 pt-4">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-blue-400">
              <ShieldCheck size={12} />
              49 CFR §395.8 Record of Duty Status
            </span>
          </div>
          <h2 className="mt-1.5 flex items-center gap-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            <FileText size={22} className="text-blue-400" />
            Official Daily Logsheets
          </h2>
        </div>

        <button
          type="button"
          onClick={exportPdf}
          disabled={exporting}
          className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-glow-sm transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-glow-combo active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {exporting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Generating Vector PDF…</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>Download Official Logs (PDF)</span>
            </>
          )}
        </button>
      </div>

      {/* Day Tabs */}
      <div className="mb-4 flex flex-wrap gap-2.5">
        {sheets.map((s, i) => (
          <button
            key={s.date}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-xl border p-3 text-left transition-all ${
              i === active
                ? "border-blue-500/60 bg-blue-500/10 text-white shadow-glow-sm"
                : "border-white/[0.08] bg-slate-900/60 text-slate-400 hover:border-white/[0.15] hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[0.65rem] uppercase tracking-wider text-slate-500 font-semibold">
                Day {s.dayIndex}
              </span>
              <span className="flex items-center gap-1 font-mono text-[0.62rem] text-emerald-400 font-medium">
                <CheckCircle2 size={10} />
                24.0h
              </span>
            </div>
            <div className="font-mono text-sm font-bold tabular-nums text-white mt-0.5">
              {s.date}
            </div>
            <div className="font-mono text-[0.68rem] text-slate-400 mt-0.5">
              {Math.round(s.milesToday)} mi driven
            </div>
          </button>
        ))}
      </div>

      {/* Active Log Grid Display Frame */}
      <div className="panel overflow-hidden p-3 sm:p-4 border border-white/[0.1] bg-slate-950/80 shadow-2xl">
        <div className="overflow-x-auto rounded-xl bg-white p-2 shadow-inner">
          <div className="min-w-[740px]">
            <LogSheetSVG
              sheet={sheets[active]}
              color="green"
              carrier={carrier}
              homeTerminal={home}
              shipper={shipper}
              cycle={cycles[active]}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-1">
        <span>FMCSA Standard 24h Grid Representation</span>
        <span>Every change of duty status annotated with location & remark per 49 CFR §395.8</span>
      </div>

      {/* Offscreen ink render for PDF export */}
      <div aria-hidden className="pointer-events-none fixed left-[-99999px] top-0 w-[1200px]">
        {sheets.map((s, i) => (
          <LogSheetSVG
            key={s.date}
            ref={(el) => {
              exportRefs.current[i] = el;
            }}
            sheet={s}
            color="ink"
            carrier={carrier}
            homeTerminal={home}
            shipper={shipper}
            cycle={cycles[i]}
          />
        ))}
      </div>
    </section>
  );
}
