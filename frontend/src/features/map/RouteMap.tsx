import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Maximize2, Layers } from "lucide-react";
import type { DutyEvent, GeoJsonLine } from "@/lib/api";
import {
  EventIconCmp,
  EVENT_KIND_LABEL,
  STATUS_COLOR,
  formatClock,
  formatDuration,
  getEventKind,
  isMapPinKind,
  type EventKind,
} from "@/lib/eventVisuals";

type Pin = {
  key: string;
  kind: EventKind;
  lat: number;
  lng: number;
  location: string;
  note: string;
  start: string;
  end: string;
  color: string;
  seq: number | null;
};

const CURRENT_COLOR = "#2563EB"; // SaaS Blue

function buildPins(events: DutyEvent[], routeGeometry: GeoJsonLine[], currentLabel?: string): Pin[] {
  const pins: Pin[] = [];

  const origin = routeGeometry.find((l) => l.coordinates.length > 0)?.coordinates[0];
  if (origin) {
    pins.push({
      key: "trip-start",
      kind: "current",
      lat: origin[1],
      lng: origin[0],
      location: currentLabel || events[0]?.location || "Origin Terminal",
      note: "Trip Origin",
      start: events[0]?.start ?? "",
      end: events[0]?.start ?? "",
      color: CURRENT_COLOR,
      seq: null,
    });
  }

  let seq = 0;
  events.forEach((e, i) => {
    if (!e.lat || !e.lng) return;
    const kind = getEventKind(e.note);
    if (!isMapPinKind(kind)) return;
    seq += 1;
    pins.push({
      key: `${i}-${kind}`,
      kind,
      lat: e.lat,
      lng: e.lng,
      location: e.location,
      note: e.note,
      start: e.start,
      end: e.end,
      color: STATUS_COLOR[e.status] || "#2563EB",
      seq,
    });
  });

  return pins;
}

function useMarkerIcons(pins: Pin[]) {
  const cache = useRef(new Map<string, L.DivIcon>());

  return useMemo(() => {
    const icons = new Map<string, L.DivIcon>();
    for (const pin of pins) {
      const cacheKey = `${pin.kind}-${pin.color}-${pin.seq ?? "x"}`;
      let icon = cache.current.get(cacheKey);
      if (!icon) {
        const svg = renderToStaticMarkup(<EventIconCmp kind={pin.kind} size={14} />);
        const seqBadge =
          pin.seq != null ? `<span class="haulr-pin__seq">${pin.seq}</span>` : "";
        const ring = pin.kind === "current" ? `<span class="haulr-pin__ring"></span>` : "";
        icon = L.divIcon({
          html: `<div class="haulr-pin">${ring}<span class="haulr-pin__badge" style="--pin-color:${pin.color}">${svg}</span>${seqBadge}</div>`,
          className: "haulr-pin-wrapper",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -18],
        });
        cache.current.set(cacheKey, icon);
      }
      icons.set(pin.key, icon);
    }
    return icons;
  }, [pins]);
}

function MapBounds({ routeGeometry, pins }: { routeGeometry: GeoJsonLine[]; pins: Pin[] }) {
  const map = useMap();

  useEffect(() => {
    const bounds = computeBounds(routeGeometry, pins);
    if (bounds) map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, routeGeometry, pins]);

  return null;
}

function computeBounds(routeGeometry: GeoJsonLine[], pins: Pin[]): L.LatLngBounds | null {
  const bounds = L.latLngBounds([]);
  routeGeometry.forEach((line) =>
    line.coordinates.forEach((c) => bounds.extend([c[1], c[0]]))
  );
  pins.forEach((p) => bounds.extend([p.lat, p.lng]));
  return bounds.isValid() ? bounds : null;
}

function FitRouteControl({ routeGeometry, pins }: { routeGeometry: GeoJsonLine[]; pins: Pin[] }) {
  const map = useMap();
  const onClick = useCallback(() => {
    const bounds = computeBounds(routeGeometry, pins);
    if (bounds) map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, routeGeometry, pins]);

  useEffect(() => {
    const ctrl = new L.Control({ position: "topright" });
    ctrl.onAdd = () => {
      const btn = L.DomUtil.create("button", "haulr-map-btn");
      btn.type = "button";
      btn.title = "Fit full route to view";
      btn.setAttribute("aria-label", "Fit route to view");
      btn.innerHTML = renderToStaticMarkup(<Maximize2 size={15} />);
      L.DomEvent.disableClickPropagation(btn);
      L.DomEvent.on(btn, "click", onClick);
      return btn;
    };
    ctrl.addTo(map);
    return () => {
      ctrl.remove();
    };
  }, [map, onClick]);

  return null;
}

function ScaleControl() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control.scale({ position: "bottomright", imperial: true, metric: false });
    ctrl.addTo(map);
    return () => {
      ctrl.remove();
    };
  }, [map]);
  return null;
}

const LEGEND_ORDER: EventKind[] = [
  "current",
  "pickup",
  "dropoff",
  "fuel",
  "break",
  "rest",
  "restart",
];

function statusForKind(kind: EventKind): DutyEvent["status"] {
  if (kind === "rest") return "Sleeper Berth";
  if (kind === "break" || kind === "restart") return "Off Duty";
  return "On Duty";
}

function MapLegend({ kinds }: { kinds: Set<EventKind> }) {
  const [open, setOpen] = useState(false);
  const present = LEGEND_ORDER.filter((k) => kinds.has(k));
  if (present.length === 0) return null;

  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 z-[1000]">
      {open && (
        <div className="mb-2 min-w-[180px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5 text-xs font-semibold text-slate-700">
            <span>Route Waypoints</span>
            <span className="font-mono text-[0.65rem] text-slate-400">{present.length} Types</span>
          </div>
          <ul className="space-y-1.5">
            {present.map((kind) => {
              const color = kind === "current" ? CURRENT_COLOR : STATUS_COLOR[statusForKind(kind)];
              return (
                <li key={kind} className="flex items-center gap-2 text-xs text-slate-600">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50"
                    style={{ color, borderColor: `${color}40` }}
                  >
                    <EventIconCmp kind={kind} size={11} />
                  </span>
                  <span>{EVENT_KIND_LABEL[kind]}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:text-slate-900"
      >
        <Layers size={13} className="text-blue-600" />
        <span>Map Legend</span>
      </button>
    </div>
  );
}

export function RouteMap({
  events,
  routeGeometry,
  currentLocation,
}: {
  events: DutyEvent[];
  routeGeometry: GeoJsonLine[];
  currentLocation?: string;
}) {
  const polylines = routeGeometry.map((line) =>
    line.coordinates.map((c) => [c[1], c[0]] as [number, number])
  );

  const pins = useMemo(
    () => buildPins(events, routeGeometry, currentLocation),
    [events, routeGeometry, currentLocation]
  );
  const icons = useMarkerIcons(pins);
  const kinds = useMemo(() => new Set(pins.map((p) => p.kind)), [pins]);
  const stopCount = pins.filter((p) => p.seq != null).length;

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      <MapContainer
        center={[39.8283, -98.5795]}
        zoom={4}
        style={{ height: "100%", width: "100%" }}
        className="haulr-map"
      >
        {/* CARTO Positron Light Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Primary Blue Route Polyline */}
        {polylines.map((positions, i) => (
          <Polyline
            key={`route-${i}`}
            positions={positions}
            pathOptions={{
              color: "#2563EB",
              weight: 5,
              opacity: 0.9,
              className: "route-glow-path",
            }}
          />
        ))}

        {/* Directional Flow Overlay */}
        {polylines.map((positions, i) => (
          <Polyline
            key={`flow-${i}`}
            positions={positions}
            pathOptions={{
              color: "#93C5FD",
              weight: 2,
              opacity: 0.9,
              dashArray: "3 12",
              lineCap: "round",
              className: "route-flow-path",
            }}
          />
        ))}

        {pins.map((pin) => (
          <Marker key={pin.key} position={[pin.lat, pin.lng]} icon={icons.get(pin.key)}>
            <Popup className="haulr-popup">
              <div className="min-w-[190px]">
                <div className="mb-1.5 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100"
                    style={{ color: pin.color }}
                  >
                    <EventIconCmp kind={pin.kind} size={12} />
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {EVENT_KIND_LABEL[pin.kind]}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-600 leading-snug">
                  {pin.location}
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 font-mono text-[0.68rem] text-slate-500">
                  <span>{pin.start ? formatClock(pin.start) : "—"}</span>
                  {pin.kind !== "current" && (
                    <span className="rounded bg-slate-100 px-1 py-0.5 font-semibold text-slate-700">
                      {formatDuration((new Date(pin.end).getTime() - new Date(pin.start).getTime()) / 3_600_000)}
                    </span>
                  )}
                </div>
                {pin.seq != null && (
                  <div className="mt-2 border-t border-slate-100 pt-1.5 font-mono text-[0.62rem] text-slate-400">
                    Stop #{pin.seq} of {stopCount}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <MapBounds routeGeometry={routeGeometry} pins={pins} />
        <FitRouteControl routeGeometry={routeGeometry} pins={pins} />
        <ScaleControl />
      </MapContainer>

      <MapLegend kinds={kinds} />
    </div>
  );
}
