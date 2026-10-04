import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Navigation, ShieldCheck } from "lucide-react";

export function LoadingScreen({
  progress = 1,
  isReady = true,
  onComplete,
}: {
  progress?: number;
  isReady?: boolean;
  onComplete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const statusStepRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  const minimumTimeMet = useRef(false);
  const isClosing = useRef(false);
  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;
  const proxy = useRef({ progress: 0 });

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const steps = [
        "INITIALIZING HOS DISPATCH ENGINE…",
        "SYNCING 49 CFR PART 395 RULES…",
        "PREPARING ROUTE GEOMETRY MATRIX…",
        "DISPATCH SYSTEM OPERATIONAL."
      ];
      let stepIndex = 0;

      const tl = gsap.timeline({
        onComplete: () => {
          minimumTimeMet.current = true;
          checkComplete();
        },
      });

      const textProxy = { progress: 0 };
      tl.to(
        textProxy,
        {
          progress: 1,
          duration: 1.4,
          ease: "none",
          onUpdate: () => {
            const newIndex = Math.floor(textProxy.progress * (steps.length - 0.01));
            if (newIndex !== stepIndex && newIndex < steps.length && statusStepRef.current) {
              stepIndex = newIndex;
              statusStepRef.current.innerText = steps[stepIndex];
            }
          },
        }
      );
    }, containerRef);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const tween = gsap.to(proxy.current, {
      progress: progress * 100,
      duration: 0.4,
      ease: "power2.out",
      onUpdate: () => {
        if (counterRef.current) {
          const p = Math.round(proxy.current.progress);
          counterRef.current.innerText = `${p.toString().padStart(2, "0")}%`;
        }
      },
    });
    return () => {
      tween.kill();
    };
  }, [progress]);

  const checkComplete = () => {
    if (isReadyRef.current && minimumTimeMet.current && !isClosing.current) {
      isClosing.current = true;

      gsap.context(() => {
        const tl = gsap.timeline({
          onComplete: () => {
            document.body.style.overflow = "";
            onComplete();
          },
        });

        tl.to(containerRef.current, {
          autoAlpha: 0,
          scale: 1.03,
          duration: 0.65,
          ease: "power3.inOut",
        });
      }, containerRef);
    }
  };

  useEffect(() => {
    checkComplete();
  }, [isReady]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-void text-white overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-violet-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-6 px-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div ref={logoRef} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 shadow-glow-combo">
              <Navigation size={18} className="text-white fill-white/20" />
            </div>
            <div>
              <span className="font-mono text-base font-extrabold tracking-tight text-white block">
                HAULR OS
              </span>
              <span className="font-mono text-[0.62rem] uppercase tracking-wider text-slate-500 block">
                Enterprise Dispatch
              </span>
            </div>
          </div>

          <div
            ref={counterRef}
            className="font-mono text-3xl font-extrabold tabular-nums tracking-tighter text-blue-400"
          >
            00%
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-2">
          <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-white/[0.06]">
            <div
              ref={progressRef}
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 shadow-glow-sm transition-all duration-300 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[0.68rem] font-mono text-slate-400">
            <div ref={statusStepRef} className="truncate">
              INITIALIZING HOS DISPATCH ENGINE…
            </div>
          </div>
        </div>

        {/* Telemetry pill row */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-3 text-[0.65rem] font-mono text-slate-500">
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck size={12} className="text-blue-400" />
            49 CFR §395
          </span>
          <span>LAT 39.06° N</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            DGPS LOCKED
          </span>
        </div>
      </div>
    </div>
  );
}
