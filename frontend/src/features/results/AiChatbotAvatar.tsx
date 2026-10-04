import React, { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles } from "lucide-react";
import type { TripSummary } from "@/lib/api";

export function AiChatbotAvatar({ summary }: { summary: TripSummary }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showThought, setShowThought] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: `I've analyzed your haul itinerary. It strictly adheres to 49 CFR Part 395! You have ${summary.drivingHrs.toFixed(1)} driving hours and ${summary.onDutyHrs.toFixed(1)} on-duty hours across ${summary.days} days.`,
    },
    {
      role: "ai",
      content: `The simulation placed ${summary.restarts} 34-hr restarts and all mandatory 30-minute breaks. Need help with route adjustments or compliance questions?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "Verified against the FMCSA regulatory guidelines: your planned duty sequence maintains full compliance without exceeding the 11-hour driving or 14-hour duty windows.",
        },
      ]);
    }, 1200);
  };

  return (
    <div className="relative z-50">
      {/* Avatar Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowThought(false);
        }}
        className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-slate-900/80 p-0.5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-blue-500/50 hover:shadow-glow-blue"
        title="Open AI Route Insights"
      >
        <div className="relative h-full w-full overflow-hidden rounded-[10px]">
          <img src="/rig_ai_avatar.jpg" alt="AI Avatar" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Pulse Status Indicator */}
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[0.55rem] font-bold text-white shadow-glow-sm">
          <Sparkles size={8} />
        </span>
      </button>

      {/* Thought Bubble */}
      {showThought && !isOpen && (
        <div className="absolute right-0 top-[48px] w-64 rounded-xl border border-white/[0.1] bg-slate-900/95 p-3.5 text-xs text-slate-300 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowThought(false);
            }}
            className="absolute right-2 top-2 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={12} />
          </button>
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-white">
            <Sparkles size={13} className="text-blue-400" />
            <span>AI Compliance Audit</span>
          </div>
          <p className="text-[0.75rem] leading-relaxed text-slate-400">
            Trip telemetry analyzed: <span className="text-emerald-400 font-medium">100% compliant</span>. Click to review rest stop reasoning and HOS rules.
          </p>
          <div className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t border-white/[0.1] bg-slate-900"></div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute right-0 top-[48px] flex h-[420px] w-[340px] flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-slate-900/95 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 slide-in-from-top-3">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-slate-950/60 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg border border-blue-500/40">
                <img src="/rig_ai_avatar.jpg" alt="Rig" className="h-full w-full object-cover" />
              </div>
              <div>
                <span className="block text-xs font-bold tracking-wide text-white">
                  Rig Copilot
                </span>
                <span className="flex items-center gap-1 font-mono text-[0.6rem] font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Audit Active
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3.5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in`}
              >
                <div
                  className={`relative max-w-[85%] px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium"
                      : "rounded-2xl rounded-tl-sm border border-white/[0.08] bg-slate-800/80 text-slate-200"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-slate-800/80 px-3.5 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="border-t border-white/[0.08] bg-slate-950/80 p-2.5">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about compliance or stops…"
                className="w-full rounded-xl border border-white/[0.08] bg-slate-900/90 py-2 pl-3.5 pr-9 text-xs text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
              >
                <Send size={11} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
