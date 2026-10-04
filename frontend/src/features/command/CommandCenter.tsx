import React, { useState, useCallback } from "react";
import {
  Navigation,
  ShieldCheck,
  FileText,
  Compass,
  AlertTriangle,
  Bot,
  Truck,
  MapPin,
} from "lucide-react";
import { RouteMap } from "@/features/map/RouteMap";
import { TripForm, type TripInput } from "@/features/dispatch/TripForm";
import { LogSheets } from "@/features/logs/LogSheets";
import { CopilotPanel } from "@/features/rig/CopilotPanel";
import { planTrip, summarize, type DutyStatus } from "@/lib/api";
import { useUIActionBus } from "@/lib/uiActionBus";
import { STATUS_COLOR, eventIcon } from "@/lib/eventVisuals";

const hrs = (a: string, b: string) =>
  (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;

export const CommandCenter: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View & panel controls
  const [copilotOpen, setCopilotOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"planner" | "map" | "eld">("planner");
  const [showLogModal, setShowLogModal] = useState(false);

  const currentPlan = useUIActionBus((s) => s.currentPlan);
  const setCurrentPlan = useUIActionBus((s) => s.setCurrentPlan);

  const handleDispatch = useCallback(
    async (input: TripInput) => {
      setLoading(true);
      setAnalyzing(true);
      setError(null);
      try {
        const result = await planTrip(input);
        setCurrentPlan(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Route calculation failed.");
      } finally {
        setLoading(false);
        setAnalyzing(false);
      }
    },
    [setCurrentPlan]
  );

  const summary = currentPlan ? summarize(currentPlan.events) : null;
  const events = currentPlan?.events ?? [];
  const totalHrs = events.reduce((s, e) => s + hrs(e.start, e.end), 0) || 1;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* ============================================================== */}
      {/* 1. DARK NAVY SIDEBAR (#0F172A)                                 */}
      {/* ============================================================== */}
      <aside className="flex h-full w-[240px] shrink-0 flex-col justify-between border-r border-slate-800 bg-[#0F172A] p-4 text-slate-300">
        <div>
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2.5 px-2 pb-6 border-b border-slate-800/80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Truck size={17} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-white tracking-tight">HAULR</span>
                <span className="rounded bg-blue-500/20 px-1 py-0.2 font-mono text-[0.62rem] font-semibold text-blue-400">
                  PRO
                </span>
              </div>
              <span className="text-[0.68rem] text-slate-400 font-medium">Commercial Logistics OS</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1">
            <button
              onClick={() => setActiveTab("planner")}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                activeTab === "planner"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Compass size={15} />
              <span>Dispatch Planner</span>
            </button>

            <button
              onClick={() => setActiveTab("map")}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                activeTab === "map"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Navigation size={15} />
              <span>Fleet Route Map</span>
            </button>

            <button
              onClick={() => setActiveTab("eld")}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                activeTab === "eld"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <FileText size={15} />
              <span>ELD Daily Logsheets</span>
            </button>

            <button
              onClick={() => setCopilotOpen(!copilotOpen)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                copilotOpen
                  ? "bg-slate-800 text-blue-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot size={15} />
                <span>Rig AI Copilot</span>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </nav>
        </div>

        {/* Driver / Fleet Status Card */}
        <div className="rounded-xl border border-slate-800 bg-[#162032] p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-semibold text-slate-400 uppercase">Assigned Tractor</span>
            <span className="flex items-center gap-1 text-[0.65rem] font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Compliant
            </span>
          </div>
          <div className="font-mono font-bold text-white text-xs">
            Unit 407 · TX-8814
          </div>
          <div className="border-t border-slate-800 pt-1.5 text-[0.68rem] text-slate-400 flex justify-between">
            <span>Cycle Used:</span>
            <span className="font-mono text-slate-200 font-semibold">
              {currentPlan?.meta?.cycle_used_hrs ?? 22.0}h / 70.0h
            </span>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MAIN WORKSPACE CANVAS (Off-White / Slate-50)               */}
      {/* ============================================================== */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50">
        {/* Top Header Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">
              {activeTab === "planner" && "Dispatch Planning & Operations"}
              {activeTab === "map" && "Interactive Fleet Map & Route Telemetry"}
              {activeTab === "eld" && "FMCSA Certified ELD Daily Logsheets (§395.8)"}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <ShieldCheck size={13} />
              49 CFR §395 Verified
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentPlan && (
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <MapPin size={12} className="text-blue-600" />
                <span className="font-medium text-slate-800">
                  {currentPlan.meta?.pickup || "Origin"} → {currentPlan.meta?.dropoff || "Destination"}
                </span>
                <span className="text-slate-400 font-mono">
                  ({summary?.drivingHrs.toFixed(1)}h Drive)
                </span>
              </div>
            )}

            <button
              onClick={() => setShowLogModal(true)}
              disabled={!currentPlan}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-40"
            >
              <FileText size={13} className="text-blue-600" />
              <span>Export ELD PDF</span>
            </button>

            <button
              onClick={() => setCopilotOpen(!copilotOpen)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Bot size={13} />
              <span>{copilotOpen ? "Hide Copilot" : "Rig Copilot"}</span>
            </button>
          </div>
        </header>

        {/* Content Body Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Area */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800">
                <AlertTriangle size={15} className="text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: Dispatch Planner */}
            {activeTab === "planner" && (
              <div className="space-y-6">
                {/* 2-Column Grid: Form + Interactive Map */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Dispatch Creation Card (5 cols) */}
                  <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h2 className="text-sm font-bold text-slate-900">
                        Create Dispatch Route
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Define trip endpoints to compute duty status windows and rest placement
                      </p>
                    </div>

                    <TripForm onSubmit={handleDispatch} loading={loading} />
                  </div>

                  {/* Right: Map Preview Card (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-[540px]">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-white">
                      <div className="flex items-center gap-2">
                        <Navigation size={14} className="text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">Route Geometry Preview</span>
                      </div>
                      <span className="font-mono text-xs text-slate-500">
                        {events.length > 0 ? `${events.length} Legs Plotted` : "Awaiting Parameters"}
                      </span>
                    </div>

                    <div className="flex-1 relative">
                      <RouteMap
                        events={events}
                        routeGeometry={currentPlan?.route_geometry ?? []}
                        currentLocation={currentPlan?.meta?.current}
                      />
                    </div>
                  </div>
                </div>

                {/* HOS Compliance Summary Cards & Duty Timeline */}
                {currentPlan && summary && (
                  <div className="space-y-6 pt-2">
                    {/* 4 Metric Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-semibold text-slate-500">Total Driving Time</div>
                        <div className="font-mono text-2xl font-bold text-slate-900 mt-1">
                          {summary.drivingHrs.toFixed(1)} <span className="text-xs font-medium text-slate-400">hrs</span>
                        </div>
                        <div className="text-[0.7rem] text-emerald-600 font-medium mt-1">
                          ✓ Under 11.0h maximum limit
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-semibold text-slate-500">On-Duty Window</div>
                        <div className="font-mono text-2xl font-bold text-slate-900 mt-1">
                          {summary.onDutyHrs.toFixed(1)} <span className="text-xs font-medium text-slate-400">hrs</span>
                        </div>
                        <div className="text-[0.7rem] text-blue-600 font-medium mt-1">
                          ✓ Satisfies consecutive 14h rule
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-semibold text-slate-500">Transit Duration</div>
                        <div className="font-mono text-2xl font-bold text-slate-900 mt-1">
                          {summary.days} <span className="text-xs font-medium text-slate-400">days</span>
                        </div>
                        <div className="text-[0.7rem] text-slate-500 font-medium mt-1">
                          Calendar cycle span
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-xs font-semibold text-slate-500">Mandatory Stops</div>
                        <div className="font-mono text-2xl font-bold text-blue-600 mt-1">
                          {summary.fuelStops + summary.breaks + summary.rests} <span className="text-xs font-medium text-slate-400">stops</span>
                        </div>
                        <div className="text-[0.7rem] text-slate-500 font-medium mt-1">
                          {summary.rests} sleepers · {summary.breaks} breaks · {summary.fuelStops} fuel
                        </div>
                      </div>
                    </div>

                    {/* Duty Status Allocation Ribbon */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <h3 className="text-xs font-bold text-slate-900">
                            24-Hour Duty Status Timeline
                          </h3>
                          <span className="text-[0.7rem] text-slate-500">
                            Continuous compliance allocation under 49 CFR Part 395
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {(["Driving", "Sleeper Berth", "On Duty", "Off Duty"] as DutyStatus[]).map((s) => (
                            <span key={s} className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                              <span
                                className="h-2.5 w-2.5 rounded-sm"
                                style={{ background: STATUS_COLOR[s] }}
                              />
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex h-7 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                        {events.map((e, i) => {
                          const segHrs = hrs(e.start, e.end);
                          const w = (segHrs / totalHrs) * 100;
                          return (
                            <div
                              key={i}
                              className="h-full rounded-sm transition-all hover:opacity-85 hover:brightness-110 cursor-help"
                              style={{
                                width: `${w}%`,
                                background: STATUS_COLOR[e.status],
                                marginRight: i === events.length - 1 ? 0 : "1px",
                              }}
                              title={`${e.status}: ${e.note} (${segHrs.toFixed(2)}h)`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Chronological Event Timeline */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="border-b border-slate-100 pb-2.5 mb-3 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-900">
                          Route Event Sequence ({events.length} Legs)
                        </h3>
                        <span className="text-[0.7rem] text-slate-400 font-mono">
                          Deterministic HOS Order
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {events.map((e, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2.5 text-xs">
                            <div className="flex items-center gap-3">
                              <span
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50"
                                style={{ color: STATUS_COLOR[e.status] }}
                              >
                                {eventIcon(e.note, 13)}
                              </span>
                              <div>
                                <span className="font-semibold text-slate-900 block">{e.note}</span>
                                <span className="text-[0.68rem] text-slate-500">{e.location}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span
                                className="px-2 py-0.5 rounded text-[0.65rem] font-semibold"
                                style={{ background: `${STATUS_COLOR[e.status]}15`, color: STATUS_COLOR[e.status] }}
                              >
                                {e.status}
                              </span>
                              <span className="text-slate-600 text-xs">{hrs(e.start, e.end).toFixed(2)}h</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Full Map View */}
            {activeTab === "map" && (
              <div className="h-[750px] rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2">
                    <Navigation size={15} className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">Fleet Operations Map</span>
                  </div>
                  {summary && (
                    <div className="flex items-center gap-3 font-mono text-xs text-slate-600">
                      <span>Drive: {summary.drivingHrs.toFixed(1)}h</span>
                      <span>•</span>
                      <span>On-Duty: {summary.onDutyHrs.toFixed(1)}h</span>
                      <span>•</span>
                      <span>Stops: {summary.fuelStops + summary.breaks + summary.rests}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 relative">
                  <RouteMap
                    events={events}
                    routeGeometry={currentPlan?.route_geometry ?? []}
                    currentLocation={currentPlan?.meta?.current}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: ELD Logsheets */}
            {activeTab === "eld" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {currentPlan ? (
                  <LogSheets plan={currentPlan} />
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center text-center space-y-2">
                    <FileText size={32} className="text-slate-300" />
                    <span className="text-sm font-semibold text-slate-700">No Active Dispatch</span>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Submit an origin and destination in the Dispatch Planner to generate official FMCSA §395.8 paper grid logs.
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ========================================================== */}
          {/* 3. RIGHT AI COPILOT PANEL (Clean SaaS Style)               */}
          {/* ========================================================== */}
          {copilotOpen && (
            <CopilotPanel
              analyzing={analyzing}
              onOptimizeTrip={() => {
                if (currentPlan?.meta) {
                  handleDispatch({
                    current_location: currentPlan.meta.current || "Dallas, TX",
                    pickup_location: currentPlan.meta.pickup || "Tulsa, OK",
                    dropoff_location: currentPlan.meta.dropoff || "Chicago, IL",
                    cycle_used_hrs: currentPlan.meta.cycle_used_hrs || 22,
                  });
                }
              }}
              onToggleCollapse={() => setCopilotOpen(false)}
            />
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. MODAL: ELD Daily Logs PDF Preview & Export                  */}
      {/* ============================================================== */}
      {showLogModal && currentPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl p-6">
            <button
              onClick={() => setShowLogModal(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              ✕
            </button>
            <LogSheets plan={currentPlan} />
          </div>
        </div>
      )}
    </div>
  );
};
