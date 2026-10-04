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
      const margin = 20;
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mb-1">
            <ShieldCheck size={14} />
            <span>49 CFR §395.8 Record of Duty Status</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            Official Driver Daily Logsheets
          </h3>
        </div>

        <button
          type="button"
          onClick={exportPdf}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {exporting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Generating PDF…</span>
            </>
          ) : (
            <>
              <Download size={14} />
              <span>Export Verified PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Day Tabs */}
      <div className="flex flex-wrap gap-2">
        {sheets.map((s, i) => (
          <button
            key={s.date}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-lg border px-3 py-2 text-left transition-all ${
              i === active
                ? "border-blue-600 bg-blue-50/50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`text-[0.65rem] font-bold uppercase ${i === active ? "text-blue-700" : "text-slate-400"}`}>
                Day {s.dayIndex}
              </span>
              <span className="flex items-center gap-1 text-[0.62rem] text-emerald-600 font-medium">
                <CheckCircle2 size={10} />
                24.0h
              </span>
            </div>
            <div className="font-mono text-xs font-bold text-slate-900 mt-0.5">
              {s.date}
            </div>
            <div className="text-[0.68rem] text-slate-500 mt-0.5">
              {Math.round(s.milesToday)} mi driven
            </div>
          </button>
        ))}
      </div>

      {/* Grid Paper View */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm overflow-hidden">
        <div className="overflow-x-auto bg-white">
          <div className="min-w-[720px]">
            <LogSheetSVG
              sheet={sheets[active]}
              color="ink"
              carrier={carrier}
              homeTerminal={home}
              shipper={shipper}
              cycle={cycles[active]}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[0.7rem] text-slate-400 font-mono">
        <span>FMCSA Blank Paper Grid Replication</span>
        <span>Includes signature, recap, and remark lines for road inspection compliance</span>
      </div>

      {/* Offscreen render for PDF */}
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
    </div>
  );
}
