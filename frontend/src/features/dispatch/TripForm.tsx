import { useRef, useState, useEffect } from "react";
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
  accentColor: string;
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
  accentColor,
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
    }, 220);
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

  const errorId = `${id}-error`;
  const listboxId = `${id}-listbox`;
  const activeOptionId = highlighted >= 0 ? `${id}-option-${highlighted}` : undefined;

  return (
    <div className="relative">
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </label>
        {value && (
          <span className="font-mono text-[0.65rem] text-slate-500">Verified</span>
        )}
      </div>

      <div className="relative group">
        <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 ${accentColor}`}>
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
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-xl border bg-slate-950/60 py-3 pl-11 pr-10 text-sm font-medium text-white placeholder:text-slate-500 transition-all duration-200 focus:outline-none ${
            error
              ? "border-rose-500/70 focus:ring-2 focus:ring-rose-500/30"
              : "border-white/[0.08] hover:border-white/[0.16] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25"
          }`}
        />
        {fetching ? (
          <Loader2
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
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
              aria-label={`Clear ${label.toLowerCase()}`}
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={13} />
            </button>
          )
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-white/[0.1] bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.label}-${s.lat}-${s.lng}`}
              id={`${id}-option-${i}`}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuggestion(s)}
              onMouseEnter={() => setHighlighted(i)}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                i === highlighted
                  ? "bg-blue-600/20 text-blue-200 border border-blue-500/30"
                  : "text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin size={13} className="shrink-0 text-blue-400" />
                <span className="truncate">{s.label}</span>
              </div>
              <span className="shrink-0 font-mono text-[0.65rem] text-slate-500">
                {s.lat.toFixed(2)}, {s.lng.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

const PRESETS = [
  {
    name: "Dallas → Chicago",
    current: "Dallas, TX",
    pickup: "Tulsa, OK",
    dropoff: "Chicago, IL",
    cycle: 22,
  },
  {
    name: "Atlanta → Denver",
    current: "Atlanta, GA",
    pickup: "Memphis, TN",
    dropoff: "Denver, CO",
    cycle: 34,
  },
  {
    name: "LA → Salt Lake",
    current: "Los Angeles, CA",
    pickup: "Las Vegas, NV",
    dropoff: "Salt Lake City, UT",
    cycle: 15,
  },
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
    if (key === "current" && !c.trim()) return "Specify the start location.";
    if (key === "pickup" && !p.trim()) return "Specify freight pickup point.";
    if (key === "dropoff") {
      if (!d.trim()) return "Specify freight delivery point.";
      if (p.trim() && p.trim().toLowerCase() === d.trim().toLowerCase())
        return "Pickup and delivery cannot be identical.";
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

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to submit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        handleSubmit(e as any);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const loadPreset = (p: typeof PRESETS[number]) => {
    setCurrent(p.current);
    setPickup(p.pickup);
    setDropoff(p.dropoff);
    setCycle(p.cycle);
    setErrors({});
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="panel panel-glow p-6 sm:p-7 relative overflow-hidden"
      aria-busy={loading}
    >
      {/* Top ambient highlight line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              Dispatch Engine
            </span>
            <span className="font-mono text-[0.65rem] text-slate-500">
              49 CFR §395
            </span>
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-white">
            Plan Compliant Haul
          </h3>
        </div>

        {/* Presets dropdown / pill list */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="font-mono text-[0.62rem] uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
            Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => loadPreset(p)}
              className="rounded-lg border border-white/[0.07] bg-slate-800/60 px-2 py-1 text-[0.65rem] font-medium text-slate-300 hover:border-blue-500/40 hover:text-white transition-all"
            >
              {p.name.split(" → ")[1] || p.name}
            </button>
          ))}
        </div>
      </div>

      <fieldset disabled={loading} className="m-0 min-w-0 border-0 p-0 disabled:opacity-60 space-y-4">
        <legend className="sr-only">Trip parameters</legend>

        <LocationField
          id="current"
          label="1. Current Location"
          value={current}
          onChange={setCurrent}
          onBlur={() => validateOnBlur("current")}
          placeholder="e.g. Dallas, TX"
          icon={<Navigation size={16} />}
          accentColor="text-cyan-400"
          error={errors.current}
          inputRef={refs.current}
        />

        <LocationField
          id="pickup"
          label="2. Freight Pickup"
          value={pickup}
          onChange={setPickup}
          onBlur={() => validateOnBlur("pickup")}
          placeholder="e.g. Tulsa, OK"
          icon={<Package size={16} />}
          accentColor="text-blue-400"
          error={errors.pickup}
          inputRef={refs.pickup}
        />

        <LocationField
          id="dropoff"
          label="3. Freight Delivery"
          value={dropoff}
          onChange={setDropoff}
          onBlur={() => validateOnBlur("dropoff")}
          placeholder="e.g. Chicago, IL"
          icon={<Warehouse size={16} />}
          accentColor="text-violet-400"
          error={errors.dropoff}
          inputRef={refs.dropoff}
        />

        {/* Cycle Dial Container */}
        <div className="rounded-xl border border-white/[0.07] bg-slate-950/40 p-4 transition-all hover:border-white/[0.12]">
          <CycleDial value={cycle} onChange={setCycle} />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative mt-6 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 py-3.5 px-4 text-sm font-semibold text-white shadow-glow-combo transition-all duration-300 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin text-white" aria-hidden="true" />
              <span>Simulating HOS Compliance Matrix…</span>
            </>
          ) : (
            <>
              <span>Compute Compliant Route</span>
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              <span className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[0.6rem] font-normal tracking-wide text-white/90 ml-1">
                ⌘↵
              </span>
            </>
          )}
        </button>
      </fieldset>

      <div role="status" aria-live="polite" className="sr-only">
        {loading ? "Computing compliant route, please wait." : ""}
      </div>
    </form>
  );
}
