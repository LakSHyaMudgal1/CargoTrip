import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, Navigation, ShieldCheck, Zap, FileText, Sparkles, ArrowRight } from "lucide-react";
import { gsap, prefersReducedMotion } from "@/lib/scroll";
import { HERO_FRAME_COUNT, preloadHeroFrames } from "@/lib/frames";
import { TripForm, type TripInput } from "@/features/dispatch/TripForm";
import { ResultsStage } from "@/features/results/ResultsStage";
import { LogSheets } from "@/features/logs/LogSheets";
import { planTrip, summarize, type TripPlan } from "@/lib/api";
import { useUIActionBus } from "@/lib/uiActionBus";
import { ScrambleText } from "@/components/ui/ScrambleText";

const HERO_FRAME = 0;
const PLAN_FRAME = Math.round((HERO_FRAME_COUNT - 1) * 0.5); // ~90
const LAST_FRAME = HERO_FRAME_COUNT - 1; // ~179

const HERO_PLAN_DUR = 2.0;
const PLAN_RESULTS_DUR = 1.8;

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  cw: number,
  ch: number
) {
  if (!img || !img.complete || !img.naturalWidth) return;
  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
}

type Phase = "hero" | "plan" | "results";

export function ViewportStage({
  onProgress,
  onReady,
  booted,
}: {
  onProgress?: (progress: number) => void;
  onReady?: () => void;
  booted?: boolean;
} = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const planRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const lastValueRef = useRef(0);
  const busyRef = useRef(false);
  const phaseRef = useRef<Phase>("hero");

  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [phase, setPhase] = useState<Phase>("hero");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showLogSheetsModal, setShowLogSheetsModal] = useState(false);

  const currentPlan = useUIActionBus((s) => s.currentPlan);
  const setCurrentPlan = useUIActionBus((s) => s.setCurrentPlan);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const reduced = typeof window !== "undefined" && prefersReducedMotion();

  // Canvas drawing with frame blending
  const draw = useCallback((value: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const { width: cw, height: ch } = canvas;
    const max = HERO_FRAME_COUNT - 1;
    const v = value < 0 ? 0 : value > max ? max : value;
    lastValueRef.current = v;

    const f0 = Math.floor(v);
    const f1 = Math.min(max, f0 + 1);
    const frac = v - f0;
    const imgs = imagesRef.current;

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0B0F17";
    ctx.fillRect(0, 0, cw, ch);
    drawCover(ctx, imgs[f0], cw, ch);
    if (frac > 0.001 && f1 !== f0) {
      ctx.globalAlpha = frac;
      drawCover(ctx, imgs[f1], cw, ch);
      ctx.globalAlpha = 1;
    }
  }, []);

  const playTransition = useCallback(
    (opts: {
      to: number;
      out?: HTMLElement | null;
      show?: HTMLElement | null;
      duration: number;
      onDone: () => void;
    }) => {
      busyRef.current = true;
      const { to, out, show, duration, onDone } = opts;
      const proxy = { f: lastValueRef.current };
      const tl = gsap.timeline({
        onComplete: () => {
          onDone();
          window.setTimeout(() => (busyRef.current = false), 200);
        },
      });
      tl.to(proxy, { f: to, duration, ease: "power2.inOut", onUpdate: () => draw(proxy.f) }, 0);
      if (out) {
        tl.to(out, { autoAlpha: 0, y: -20, duration: duration * 0.4, ease: "power2.in" }, 0);
      }
      if (show) {
        gsap.set(show, { y: 20 });
        tl.to(
          show,
          { autoAlpha: 1, y: 0, duration: duration * 0.5, ease: "power3.out" },
          duration * 0.45
        );
      }
      return tl;
    },
    [draw]
  );

  const goHeroToPlan = useCallback(() => {
    playTransition({
      to: PLAN_FRAME,
      out: heroRef.current,
      show: planRef.current,
      duration: HERO_PLAN_DUR,
      onDone: () => setPhase("plan"),
    });
  }, [playTransition]);

  const goPlanToHero = useCallback(() => {
    playTransition({
      to: HERO_FRAME,
      out: planRef.current,
      show: heroRef.current,
      duration: HERO_PLAN_DUR,
      onDone: () => setPhase("hero"),
    });
  }, [playTransition]);

  const goToResults = useCallback(() => {
    if (reduced) {
      setPhase("results");
      requestAnimationFrame(() =>
        scrollAreaRef.current?.scrollTo({ top: 0, behavior: "smooth" })
      );
      return;
    }
    playTransition({
      to: LAST_FRAME,
      out: planRef.current,
      show: resultsRef.current,
      duration: PLAN_RESULTS_DUR,
      onDone: () => setPhase("results"),
    });
  }, [playTransition, reduced]);

  const goResultsToPlan = useCallback(() => {
    if (reduced) {
      setPhase("plan");
      return;
    }
    playTransition({
      to: PLAN_FRAME,
      out: resultsRef.current,
      show: planRef.current,
      duration: PLAN_RESULTS_DUR,
      onDone: () => setPhase("plan"),
    });
  }, [playTransition, reduced]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const { images, ready: readyPromise } = preloadHeroFrames(
      HERO_FRAME_COUNT,
      PLAN_FRAME + 2,
      (loaded, total) => {
        const p = loaded / total;
        setProgress(p);
        onProgress?.(p);
      }
    );
    imagesRef.current = images;

    const resize = () => {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      draw(lastValueRef.current);
    };
    window.addEventListener("resize", resize);
    resize();

    readyPromise.then(() => {
      setReady(true);
      onReady?.();
      draw(reduced ? LAST_FRAME : HERO_FRAME);
      if (!reduced) {
        gsap.set(heroRef.current, { autoAlpha: 1, y: 0 });
        gsap.set(planRef.current, { autoAlpha: 0 });
        if (resultsRef.current) gsap.set(resultsRef.current, { autoAlpha: 0 });
      }
    });

    return () => window.removeEventListener("resize", resize);
  }, []);

  // Hero Boot Animation
  useEffect(() => {
    if (!booted || reduced) return;

    const ctx = gsap.context(() => {
      if (!heroRef.current) return;
      const badge = heroRef.current.querySelector(".hero-badge");
      const h1 = heroRef.current.querySelector("h1");
      const p = heroRef.current.querySelector("p");
      const features = heroRef.current.querySelector(".hero-features");
      const cta = heroRef.current.querySelector(".hero-cta");
      const brandBar = document.querySelector(".brand-bar");

      gsap.set([badge, h1, p, features, cta, brandBar], { autoAlpha: 0 });

      const tl = gsap.timeline({ delay: 0.1 });

      tl.to(brandBar, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, 0);

      tl.fromTo(
        badge,
        { autoAlpha: 0, y: 15 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", clearProps: "all" },
        0.15
      );

      tl.fromTo(
        h1,
        { autoAlpha: 0, y: 25, scale: 0.98 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 1.1,
          ease: "power3.out",
          clearProps: "all",
        },
        0.25
      );

      tl.fromTo(
        p,
        { autoAlpha: 0, y: 15 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", clearProps: "all" },
        0.45
      );

      tl.fromTo(
        features,
        { autoAlpha: 0, y: 15 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out", clearProps: "all" },
        0.6
      );

      tl.fromTo(
        cta,
        { autoAlpha: 0, y: 15 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "power2.out", clearProps: "all" },
        0.75
      );
    }, heroRef);

    return () => ctx.revert();
  }, [booted, reduced]);

  useEffect(() => {
    if (reduced) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [reduced]);

  const handleGesture = useCallback(
    (dir: 1 | -1) => {
      if (reduced || busyRef.current || loading) return;
      const p = phaseRef.current;
      if (p === "hero" && dir > 0) goHeroToPlan();
      else if (p === "plan" && dir < 0) goPlanToHero();
    },
    [reduced, loading, goHeroToPlan, goPlanToHero]
  );

  useEffect(() => {
    if (reduced) return;

    const onWheel = (e: WheelEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest(".chat-dock-panel, [data-lenis-prevent]")) return;
      if (Math.abs(e.deltaY) < 6) return;
      handleGesture(e.deltaY > 0 ? 1 : -1);
    };

    let startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest(".chat-dock-panel, [data-lenis-prevent]")) return;
      startY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest(".chat-dock-panel, [data-lenis-prevent]")) return;
      const endY = e.changedTouches[0]?.clientY ?? startY;
      const dy = startY - endY;
      if (Math.abs(dy) < 40) return;
      handleGesture(dy > 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (["ArrowDown", "PageDown", " ", "Spacebar"].includes(e.key)) handleGesture(1);
      else if (["ArrowUp", "PageUp"].includes(e.key)) handleGesture(-1);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [reduced, handleGesture]);

  const handlePlan = useCallback(
    async (input: TripInput) => {
      setLoading(true);
      setError(null);
      try {
        const result = await planTrip(input);
        setCurrentPlan(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Calculation failed. Please verify addresses.");
        setLoading(false);
      }
    },
    [setCurrentPlan]
  );

  useEffect(() => {
    if (!currentPlan) return;
    setPlan(currentPlan);
    setLoading(false);
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => goToResults())
    );
    return () => cancelAnimationFrame(id);
  }, [currentPlan]);

  // Reduced motion layout
  if (reduced) {
    return (
      <main className="relative min-h-svh bg-void text-white">
        <canvas
          ref={canvasRef}
          className="fixed inset-0 -z-10 h-full w-full opacity-30"
          aria-hidden="true"
        />

        {/* Top Navbar */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.08] bg-slate-950/80 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-glow-sm">
              <Navigation size={16} className="text-white fill-white/20" />
            </div>
            <span className="font-mono text-base font-bold text-white tracking-tight">
              HAULR OS
            </span>
          </div>
          <span className="font-mono text-xs text-blue-400">
            49 CFR §395 · Compliant Engine
          </span>
        </header>

        <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 py-16 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400">
            <Sparkles size={13} />
            <span>Autonomous HOS Route Intelligence</span>
          </div>
          <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Intelligent Haul Planning,{" "}
            <span className="text-gradient-electric">Engineered for Compliance.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-slate-400 leading-relaxed">
            Multi-day commercial freight routing strictly adhering to 49 CFR Part 395 limits.
            Deterministic solver computes all mandatory breaks, 34-hour restarts, and fuel stops with verified ELD log sheets.
          </p>
        </section>

        <section className="mx-auto w-full max-w-lg px-6 pb-24">
          <TripForm onSubmit={handlePlan} loading={loading} />
          {error && <FormError message={error} />}
        </section>

        {plan && plan.events.length > 0 && (
          <>
            <ResultsStage
              plan={plan}
              summary={summarize(plan.events)}
              onViewLogSheets={() => setShowLogSheetsModal(true)}
            />
            {showLogSheetsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4">
                <div className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-white/[0.12] rounded-2xl shadow-2xl">
                  <button
                    onClick={() => setShowLogSheetsModal(false)}
                    className="sticky top-4 left-[calc(100%-2.5rem)] z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                  >
                    ✕
                  </button>
                  <div className="px-6 pb-12 pt-6">
                    <LogSheets plan={plan} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    );
  }

  // Motion path: Viewport-locked stage with smooth state transitions
  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden bg-void">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-65" aria-hidden="true" />

        {/* Ambient atmospheric dark scrims */}
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-void via-void/50 to-void/70" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-48 bg-gradient-to-t from-void to-transparent" />
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 z-[3] w-[800px] h-[500px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent blur-[120px]" />

        {/* Modern SaaS Navbar */}
        <header className="brand-bar pointer-events-auto absolute inset-x-0 top-0 z-[20] flex items-center justify-between border-b border-white/[0.08] bg-slate-950/60 px-6 py-3.5 sm:px-10 backdrop-blur-xl transition-all">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 shadow-glow-combo">
              <Navigation size={17} className="text-white fill-white/20" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold tracking-tight text-white">
                HAULR OS
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.2 font-mono text-[0.62rem] font-semibold uppercase tracking-wider text-blue-400">
                Enterprise
              </span>
            </div>
          </div>

          {/* Center Navigation Pills */}
          <div className="hidden md:flex items-center gap-1 rounded-xl border border-white/[0.08] bg-slate-900/60 p-1 backdrop-blur-md">
            <button
              onClick={goPlanToHero}
              className={`rounded-lg px-3 py-1 font-mono text-xs font-semibold transition-all ${
                phase === "hero" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              onClick={goHeroToPlan}
              className={`rounded-lg px-3 py-1 font-mono text-xs font-semibold transition-all ${
                phase === "plan" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              Dispatch Planner
            </button>
            {plan && (
              <button
                onClick={goToResults}
                className={`rounded-lg px-3 py-1 font-mono text-xs font-semibold transition-all ${
                  phase === "results" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                Telemetry Results
              </button>
            )}
          </div>

          {/* Right Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-900/60 px-3 py-1.5 font-mono text-[0.68rem] text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                <ScrambleText
                  text={ready ? "FMCSA 70h / 8d Ready" : `Loading Vector Matrix · ${Math.round(progress * 100)}%`}
                  start={booted}
                  delay={100}
                  duration={600}
                />
              </span>
            </div>

            {phase === "hero" ? (
              <button
                onClick={goHeroToPlan}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-glow-sm hover:from-blue-500 hover:to-indigo-500 transition-all"
              >
                <span>Plan Route</span>
                <ArrowRight size={13} />
              </button>
            ) : phase === "results" ? (
              <button
                onClick={goResultsToPlan}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-slate-800/80 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
              >
                <span>Edit Route</span>
              </button>
            ) : null}
          </div>
        </header>

        {/* Hero Section */}
        <div ref={heroRef} className="absolute inset-0 z-[4] flex items-center justify-center px-6">
          <div className="max-w-3xl text-center">
            {/* Top pill badge */}
            <div className="hero-badge mx-auto inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 shadow-glow-sm backdrop-blur-md mb-6">
              <Sparkles size={14} className="text-blue-400" />
              <span>AUTONOMOUS FREIGHT & HOS DISPATCH INTELLIGENCE</span>
            </div>

            {/* Headline */}
            <h1 className="text-balance text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tightest text-white leading-[1.05]">
              Intelligent Haul Planning,{" "}
              <br />
              <span className="text-gradient-electric inline-block">
                Engineered for Compliance.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-slate-300 font-medium">
              Deterministic multi-day routing under 49 CFR Part 395 limits.
              Compute required rest breaks, 34-hour restarts, and fuel stops in milliseconds—with verified ELD paper logsheets.
            </p>

            {/* 3 Feature Pills */}
            <div className="hero-features mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-medium text-slate-300">
              <span className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-900/70 px-3 py-1.5 backdrop-blur-md">
                <ShieldCheck size={14} className="text-emerald-400" />
                Zero Violations Guaranteed
              </span>
              <span className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-900/70 px-3 py-1.5 backdrop-blur-md">
                <Zap size={14} className="text-blue-400" />
                Sub-Second CARTO Geometry
              </span>
              <span className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-900/70 px-3 py-1.5 backdrop-blur-md">
                <FileText size={14} className="text-violet-400" />
                FMCSA §395.8 Auto-Draw Grids
              </span>
            </div>

            {/* CTAs */}
            <div className="hero-cta mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={goHeroToPlan}
                className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-glow-combo transition-all duration-300 hover:scale-[1.02] hover:shadow-glow-lg active:scale-[0.98]"
              >
                <span>Launch Route Planner</span>
                <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <div
                className="flex items-center gap-1.5 text-xs font-mono text-slate-400 cursor-pointer hover:text-white transition-colors"
                onClick={goHeroToPlan}
              >
                <span>Press Space or Scroll</span>
                <ChevronDown size={15} className="animate-bounce text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Plan Form Overlay (Centered) */}
        <div
          ref={planRef}
          className="absolute inset-0 z-[4] flex items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20 pb-6"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          <div className="w-full max-w-xl">
            <TripForm onSubmit={handlePlan} loading={loading} />
            {error && <FormError message={error} />}
          </div>
        </div>

        {/* Results Overlay (Mounted once a plan exists) */}
        {plan && plan.events.length > 0 && (
          <div ref={resultsRef} className="absolute inset-0 z-[5]" style={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />
            <div
              ref={scrollAreaRef}
              data-lenis-prevent
              className="relative h-full overflow-y-auto overflow-x-hidden"
            >
              <ResultsStage
                plan={plan}
                summary={summarize(plan.events)}
                onEdit={goResultsToPlan}
                onViewLogSheets={() => setShowLogSheetsModal(true)}
                fit
              />
            </div>

            {/* Modal for LogSheets */}
            {showLogSheetsModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4">
                <div className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-white/[0.12] rounded-2xl shadow-2xl">
                  <button
                    onClick={() => setShowLogSheetsModal(false)}
                    className="sticky top-4 left-[calc(100%-2.5rem)] z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                  >
                    ✕
                  </button>
                  <div className="px-6 pb-12 pt-6">
                    <LogSheets plan={plan} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {phase === "results" ? "Compliant haul planned. Telemetry results ready." : ""}
      </div>
    </>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-3 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs sm:text-sm text-rose-300 font-medium"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-400" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
