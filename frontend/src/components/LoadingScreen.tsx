import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ShieldCheck, Truck, Cpu } from "lucide-react";

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

  const minimumTimeMet = useRef(false);
  const isClosing = useRef(false);
  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;
  const proxy = useRef({ progress: 0 });

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const steps = [
        "CALIBRATING 49 CFR PART 395 RULES…",
        "SYNCING HOS TELEMETRY CLOCKS…",
        "COMPUTING OPTIMAL REST WINDOWS…",
        "DISPATCH WORKSPACE OPERATIONAL.",
      ];
      let stepIndex = 0;

      const tl = gsap.timeline({
        onComplete: () => {
          minimumTimeMet.current = true;
          checkComplete();
        },
      });

      const textProxy = { progress: 0 };
      tl.to(textProxy, {
        progress: 1,
        duration: 1.2,
        ease: "none",
        onUpdate: () => {
          const newIndex = Math.floor(textProxy.progress * (steps.length - 0.01));
          if (newIndex !== stepIndex && newIndex < steps.length && statusStepRef.current) {
            stepIndex = newIndex;
            statusStepRef.current.innerText = steps[stepIndex];
          }
        },
      });
    }, containerRef);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const tween = gsap.to(proxy.current, {
      progress: progress * 100,
      duration: 0.35,
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
          scale: 0.98,
          duration: 0.45,
          ease: "power2.inOut",
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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0F172A] text-slate-100 selection:bg-blue-600"
    >
      <div className="relative z-10 flex w-full max-w-md flex-col gap-6 rounded-2xl border border-slate-800 bg-[#1E293B]/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">HAULR</span>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-blue-400">
                  ENTERPRISE
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Logistics Operating System</span>
            </div>
          </div>

          <div
            ref={counterRef}
            className="font-mono text-2xl font-bold tabular-nums tracking-tight text-blue-400"
          >
            00%
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-2.5">
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              ref={progressRef}
              className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <div ref={statusStepRef} className="truncate text-slate-300">
              CALIBRATING 49 CFR PART 395 RULES…
            </div>
          </div>
        </div>

        {/* Telemetry Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-[0.7rem] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck size={14} className="text-emerald-400" />
            FMCSA Compliant
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Cpu size={14} className="text-blue-400" />
            AI RAG Active
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SYSTEM READY
          </span>
        </div>
      </div>
    </div>
  );
}
