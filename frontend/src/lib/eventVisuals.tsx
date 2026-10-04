import type { ComponentType } from "react";
import {
  Fuel,
  Coffee,
  BedDouble,
  RotateCcw,
  Package,
  Warehouse,
  Flag,
  Truck,
  Navigation,
} from "lucide-react";
import type { DutyStatus } from "./api";

/**
 * Modern SaaS palette for duty-status and per-event telemetry visuals.
 * Cohesive electric blue + violet + amber + slate scheme across timeline and map.
 */
export const STATUS_COLOR: Record<DutyStatus, string> = {
  Driving: "#3B82F6",       // Electric Blue
  "Sleeper Berth": "#8B5CF6", // Electric Violet
  "On Duty": "#F59E0B",     // Amber / Gold
  "Off Duty": "#64748B",    // Cool Slate
};

export type EventKind =
  | "current"
  | "pickup"
  | "dropoff"
  | "fuel"
  | "break"
  | "restart"
  | "rest"
  | "pretrip"
  | "driving";

export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  current: "Trip Origin",
  pickup: "Freight Pickup",
  dropoff: "Freight Delivery",
  fuel: "Fuel Stop",
  break: "30-Min Rest Break",
  restart: "34-Hr Reset",
  rest: "10-Hr Sleeper Rest",
  pretrip: "Pre-Trip Inspection",
  driving: "Active Transit",
};

const EVENT_ICON_CMP: Record<EventKind, ComponentType<{ size?: number; className?: string }>> = {
  current: Navigation,
  fuel: Fuel,
  break: Coffee,
  restart: RotateCcw,
  rest: BedDouble,
  pickup: Package,
  dropoff: Warehouse,
  pretrip: Flag,
  driving: Truck,
};

export function getEventKind(note: string): EventKind {
  const n = note.toLowerCase();
  if (n.includes("fuel")) return "fuel";
  if (n.includes("break")) return "break";
  if (n.includes("restart")) return "restart";
  if (n.includes("rest")) return "rest";
  if (n.includes("pickup")) return "pickup";
  if (n.includes("dropoff")) return "dropoff";
  if (n.includes("pre-trip")) return "pretrip";
  return "driving";
}

export function EventIconCmp({ kind, size = 15, className }: { kind: EventKind; size?: number; className?: string }) {
  const Icon = EVENT_ICON_CMP[kind];
  return <Icon size={size} className={className} />;
}

/** Kept for existing call sites that pass a raw note string. */
export function eventIcon(note: string, size = 15) {
  const Icon = EVENT_ICON_CMP[getEventKind(note)];
  return <Icon size={size} />;
}

/**
 * Map pins only show "real" stops — never one-per-driving-segment noise and
 * never the (mostly co-located) pre-trip inspection bookkeeping event.
 */
export function isMapPinKind(kind: EventKind): boolean {
  return kind !== "driving" && kind !== "pretrip";
}

export function formatDuration(hours: number): string {
  const totalMin = Math.round(hours * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
