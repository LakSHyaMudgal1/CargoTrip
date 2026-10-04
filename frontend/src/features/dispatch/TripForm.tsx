import { useRef, useState } from "react";
import { Navigation, Package, Warehouse, Loader2, X, MapPin, ArrowRight } from "lucide-react";
import { CycleDial } from "./CycleDial";
import { suggestLocations, type LocationSuggestion } from "@/lib/api";

export type TripInput = {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  cycle_used_hrs: number;
};

type FieldKey = "current" | "pickup" | "dropoff";

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

function LocationField({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  icon,
  error,
  inputRef,
}: FieldProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [fetching, setFetching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const skipNextFetch = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchSuggestions = (query: string) => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setFetching(true);
      try {
        const results = await suggestLocations(query, controller.signal);
        setSuggestions(results);
        setOpen(results.length > 0);
        setHighlighted(-1);
      } catch {
        // aborted or network error
      } finally {
        setFetching(false);
      }
    }, 200);
  };

  const selectSuggestion = (s: LocationSuggestion) => {
    skipNextFetch.current = true;
    onChange(s.label);
    setOpen(false);
    setSuggestions([]);
    setHighlighted(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (highlighted >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[highlighted]);
      } else {
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          ref={inputRef}
          id={id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            fetchSuggestions(e.target.value.trim());
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 140);
            onBlur();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full rounded-lg border bg-white py-2 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          }`}
        />
        {fetching ? (
          <Loader2
            size={13}
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
          />
        ) : (
          value && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange("");
                setSuggestions([]);
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={`${s.label}-${s.lat}-${s.lng}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuggestion(s)}
              onMouseEnter={() => setHighlighted(i)}
              className={`flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs ${
                i === highlighted ? "bg-blue-50 text-blue-900 font-medium" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <MapPin size={12} className="shrink-0 text-blue-600" />
                <span className="truncate">{s.label}</span>
              </div>
              <span className="shrink-0 font-mono text-[0.62rem] text-slate-400">
                {s.lat.toFixed(1)}, {s.lng.toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

const PRESETS = [
  { name: "Dallas → Chicago", current: "Dallas, TX", pickup: "Tulsa, OK", dropoff: "Chicago, IL", cycle: 22 },
  { name: "Atlanta → Denver", current: "Atlanta, GA", pickup: "Memphis, TN", dropoff: "Denver, CO", cycle: 34 },
  { name: "LA → Salt Lake", current: "Los Angeles, CA", pickup: "Las Vegas, NV", dropoff: "Salt Lake City, UT", cycle: 15 },
];

export function TripForm({
  onSubmit,
  loading,
}: {
  onSubmit: (data: TripInput) => void | Promise<void>;
  loading?: boolean;
}) {
  const [current, setCurrent] = useState("Dallas, TX");
  const [pickup, setPickup] = useState("Tulsa, OK");
  const [dropoff, setDropoff] = useState("Chicago, IL");
  const [cycle, setCycle] = useState(22);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const refs: Record<FieldKey, React.RefObject<HTMLInputElement | null>> = {
    current: useRef<HTMLInputElement>(null),
    pickup: useRef<HTMLInputElement>(null),
    dropoff: useRef<HTMLInputElement>(null),
  };

  const fieldError = (key: FieldKey, values = { current, pickup, dropoff }) => {
    const { current: c, pickup: p, dropoff: d } = values;
    if (key === "current" && !c.trim()) return "Enter starting location.";
    if (key === "pickup" && !p.trim()) return "Enter pickup facility.";
    if (key === "dropoff") {
      if (!d.trim()) return "Enter delivery destination.";
      if (p.trim() && p.trim().toLowerCase() === d.trim().toLowerCase())
        return "Pickup and delivery cannot be the same.";
    }
    return undefined;
  };

  const validateOnBlur = (key: FieldKey) => {
    const err = fieldError(key);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[key] = err;
      else delete next[key];
      return next;
    });
  };

  const validateAll = () => {
    const e: Record<string, string> = {};
    (["current", "pickup", "dropoff"] as FieldKey[]).forEach((key) => {
      const err = fieldError(key);
      if (err) e[key] = err;
    });
    if (cycle < 0 || cycle > 70) e.cycle = "Cycle must be between 0 and 70 hours.";
    setErrors(e);
    return e;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (loading) return;
    const e = validateAll();
    const firstInvalid = (["current", "pickup", "dropoff"] as FieldKey[]).find((key) => e[key]);
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }
    if (Object.keys(e).length > 0) return;
    onSubmit({
      current_location: current.trim(),
      pickup_location: pickup.trim(),
      dropoff_location: dropoff.trim(),
      cycle_used_hrs: cycle,
    });
  };

  const loadPreset = (p: typeof PRESETS[number]) => {
    setCurrent(p.current);
    setPickup(p.pickup);
    setDropoff(p.dropoff);
    setCycle(p.cycle);
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Route Presets */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Quick Route Presets
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => loadPreset(p)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:border-blue-400 hover:text-blue-700 transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-3">
        <LocationField
          id="current"
          label="Origin Terminal"
          value={current}
          onChange={setCurrent}
          onBlur={() => validateOnBlur("current")}
          placeholder="City, State (e.g. Dallas, TX)"
          icon={<Navigation size={14} />}
          error={errors.current}
          inputRef={refs.current}
        />

        <LocationField
          id="pickup"
          label="Freight Pickup"
          value={pickup}
          onChange={setPickup}
          onBlur={() => validateOnBlur("pickup")}
          placeholder="City, State (e.g. Tulsa, OK)"
          icon={<Package size={14} />}
          error={errors.pickup}
          inputRef={refs.pickup}
        />

        <LocationField
          id="dropoff"
          label="Freight Delivery"
          value={dropoff}
          onChange={setDropoff}
          onBlur={() => validateOnBlur("dropoff")}
          placeholder="City, State (e.g. Chicago, IL)"
          icon={<Warehouse size={14} />}
          error={errors.dropoff}
          inputRef={refs.dropoff}
        />
      </div>

      {/* Cycle Dial */}
      <CycleDial value={cycle} onChange={setCycle} />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Calculating HOS Route…</span>
          </>
        ) : (
          <>
            <span>Generate Compliant Dispatch Plan</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}
