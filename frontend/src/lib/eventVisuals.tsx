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
 * Commercial Logistics SaaS Duty Status Palette
 * Blue = Active Transit, Orange = Rest & Sleeper, Green = Verified Compliant, Slate = Off Duty
 */
export const STATUS_COLOR: Record<DutyStatus, string> = {
  Driving: "#2563EB",         // Brand SaaS Blue
  "Sleeper Berth": "#F59E0B", // Orange / Mandatory Sleeper
  "On Duty": "#3B82F6",       // Active Freight Handling Blue
  "Off Duty": "#64748B",      // Slate Neutral
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
  current: "Origin Facility",
  pickup: "Freight Pickup",
  dropoff: "Delivery Consignee",
  fuel: "Fuel Stop",
  break: "Mandatory 30m Rest Break",
  restart: "34-Hour Restart Window",
  rest: "10-Hour Sleeper Berth",
  pretrip: "Pre-Trip Inspection",
  driving: "Highway Transit",
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

export function eventIcon(note: string, size = 15) {
  const Icon = EVENT_ICON_CMP[getEventKind(note)];
  return <Icon size={size} />;
}

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
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
