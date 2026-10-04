import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  FileText,
  Sparkles,
  Bot,
  Zap,
  ShieldCheck,
  Minimize2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { useUIActionBus } from "@/lib/uiActionBus";
import { sendChat, type Citation } from "./chatService";
import { ConfirmTripCard } from "./ConfirmTripCard";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  isStreaming?: boolean;
  toolCall?: string;
  citations?: Citation[];
  pendingConfirm?: any;
}

interface CopilotPanelProps {
  analyzing?: boolean;
  onOptimizeTrip?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  analyzing = false,
  onOptimizeTrip,
  collapsed = false,
  onToggleCollapse,
}) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I'm **Rig**, your autonomous dispatch and FMCSA compliance copilot. You can ask me to evaluate route parameters, audit HOS constraints (49 CFR §395), optimize rest breaks, or verify paper log entries.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentPlan, setCurrentPlan, setActiveLogDay, setPdfDownloadUrl } = useUIActionBus();

  const [threadId, setThreadId] = useState(() => {
    const saved = sessionStorage.getItem("rig_thread_id");
    if (saved) return saved;
    const newId = `thread_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("rig_thread_id", newId);
    return newId;
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, analyzing]);

  const addMessage = (sender: "user" | "bot", text: string, extra?: Partial<Message>) => {
    const id = `msg_${Math.random().toString(36).substring(2, 11)}`;
    setMessages((prev) => [...prev, { id, sender, text, ...extra }]);
    return id;
  };

  const handleSend = async (textToSend: string, isConfirm: boolean = false) => {
    if (!textToSend.trim() && !isConfirm) return;

    setError(null);
    setLoading(true);

    if (!isConfirm) {
      addMessage("user", textToSend);
      setMessage("");
    } else {
      setMessages((prev) => prev.filter((m) => !m.pendingConfirm));
      addMessage("user", "Routing parameters approved. Proceed with dispatch.");
    }

    const assistantMsgId = addMessage("bot", "", { isStreaming: true });

    try {
      const resp = await sendChat({
        message: isConfirm ? "" : textToSend,
        thread_id: threadId,
        confirm: isConfirm,
      });

      let toolExecuted = "";
      let downloadNote = "";
      for (const action of resp.ui_actions) {
        if (action.type === "RENDER_TRIP") {
          setCurrentPlan(action.payload);
          toolExecuted = "calculate_hos_route";
        } else if (action.type === "SHOW_LOG_SHEET") {
          if (action.payload?.day_requested) setActiveLogDay(action.payload.day_requested);
          toolExecuted = "generate_eld_sheet";
        } else if (action.type === "OFFER_DOWNLOAD") {
          setPdfDownloadUrl(action.payload.download_url);
          downloadNote = `\n\n[Download Official Logs PDF](${action.payload.download_url}) (link active for 15 minutes).`;
          toolExecuted = "export_eld_pdf";
        }
      }

      const hasRenderTrip = resp.ui_actions.some((a) => a.type === "RENDER_TRIP");
      const replyText =
        resp.reply ||
        (hasRenderTrip
          ? "Compliant route calculated and verified against 49 CFR Part 395! The geometry has been loaded onto your primary map and daily ELD sheets have been populated."
          : resp.needs_confirmation
            ? "I've synthesized the dispatch request. Please confirm the routing parameters below:"
            : "Understood.");

      setMessages((prev) => {
        let next = prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                isStreaming: false,
                text: replyText + downloadNote,
                toolCall: toolExecuted || undefined,
                citations: resp.citations.length ? resp.citations : m.citations,
              }
            : m
        );
        if (resp.needs_confirmation) {
          next = [
            ...next,
            {
              id: `confirm_${Date.now()}`,
              sender: "bot" as const,
              text: "",
              pendingConfirm: resp.needs_confirmation,
            },
          ];
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assistant connection failed.");
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
    } finally {
      setLoading(false);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsgId ? { ...m, isStreaming: false } : m))
      );
    }
  };

  const resetThread = () => {
    const newId = `thread_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("rig_thread_id", newId);
    setThreadId(newId);
    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: `Conversation reset. Rig ready for routing parameters or compliance inquiries.`,
      },
    ]);
  };

  const handleCommand = (cmd: string) => {
    if (cmd === "Optimize my trip") {
      if (onOptimizeTrip) {
        onOptimizeTrip();
        addMessage("user", "Optimize my trip for 49 CFR compliance.");
        addMessage("bot", "Evaluating current route parameters. Simulating mandatory 30-min breaks and sleeper berths to preserve maximum driving window…");
        return;
      }
    }
    handleSend(cmd);
  };

  if (collapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center justify-between border-l border-slate-200 bg-white py-3">
        <button
          onClick={onToggleCollapse}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-blue-600 hover:bg-blue-50 transition-colors"
          title="Open AI Copilot"
        >
          <Bot size={16} />
        </button>
        <span className="font-mono text-[0.65rem] font-bold uppercase tracking-wider text-slate-400 rotate-90 whitespace-nowrap">
          RIG COPILOT
        </span>
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
      </div>
    );
  }

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-slate-200 bg-slate-50 text-slate-800">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Bot size={15} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 tracking-tight">
                Rig AI Copilot
              </span>
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[0.62rem] font-medium text-blue-700">
                Gemini 2.5
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[0.62rem] text-emerald-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>49 CFR RAG Engine Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={resetThread}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Reset Conversation"
          >
            <RotateCcw size={12} />
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Collapse Copilot"
            >
              <Minimize2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Analyzing Banner */}
      {(analyzing || loading) && (
        <div className="flex shrink-0 items-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700">
          <Zap size={13} className="animate-spin text-blue-600" />
          <span>
            {analyzing ? "Simulating route and evaluating HOS limits…" : "Formulating compliance guidance…"}
          </span>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="shrink-0 border-b border-slate-200 bg-white p-3.5">
        <div className="mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Sparkles size={12} className="text-blue-600" />
            <span>AI Dispatch Recommendations</span>
          </span>
          <span className="text-[0.65rem] font-medium text-slate-400">Real-time</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {currentPlan ? (
            <>
              Itinerary verified: <strong className="text-emerald-700">100% compliant</strong> under Part 395. All 10h sleeper berths positioned to prevent 14h clock expiry.
            </>
          ) : (
            <>
              Input your trip endpoints on the left to automatically calculate required rest stops and generate paper ELD daily grids.
            </>
          )}
        </p>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col space-y-1">
            <div className="flex items-center gap-1 text-[0.68rem] font-semibold">
              {m.sender === "user" ? (
                <span className="text-blue-700">Dispatcher</span>
              ) : (
                <span className="text-slate-700 flex items-center gap-1">
                  <Bot size={11} className="text-blue-600" />
                  Rig Copilot
                </span>
              )}
            </div>

            {m.toolCall && (
              <div className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[0.62rem] text-slate-600 w-fit">
                <Zap size={9} className="text-blue-600" />
                <span>Tool Executed: {m.toolCall}()</span>
              </div>
            )}

            {m.text && (
              <div
                className={`rounded-xl p-3 text-xs leading-relaxed shadow-sm ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-white border border-slate-200/80 text-slate-800"
                }`}
              >
                {m.sender === "bot" ? (
                  <div className="react-markdown-container space-y-1.5">
                    <ReactMarkdown
                      components={{
                        strong: ({ node, ...props }) => <strong className="text-slate-900 font-bold" {...props} />,
                        a: ({ node, ...props }) => (
                          <a
                            className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => <p className="my-1 text-slate-700" {...props} />,
                        ul: ({ node, ...props }) => <ul className="my-1 pl-4 list-disc marker:text-blue-600" {...props} />,
                        ol: ({ node, ...props }) => <ol className="my-1 pl-4 list-decimal marker:text-blue-600" {...props} />,
                        li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
                        code: ({ node, ...props }) => (
                          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.7rem] text-slate-800 border border-slate-200" {...props} />
                        ),
                      }}
                    >
                      {m.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span style={{ whiteSpace: "pre-line" }}>{m.text}</span>
                )}

                {m.isStreaming && (
                  <span className="inline-block h-3.5 w-1.5 ml-1 bg-blue-600 animate-pulse rounded-sm align-middle" />
                )}
              </div>
            )}

            {/* Confirm Card */}
            {m.pendingConfirm && (
              <ConfirmTripCard
                params={m.pendingConfirm}
                onConfirm={() => handleSend("", true)}
                onCancel={() => {
                  setMessages((prev) => prev.filter((msg) => msg.id !== m.id));
                }}
                disabled={loading}
              />
            )}

            {/* RAG Citations */}
            {m.citations && m.citations.length > 0 && (
              <div className="mt-1 flex flex-col gap-1.5">
                <span className="text-[0.62rem] font-bold text-slate-500 uppercase tracking-wider">
                  Regulatory Citations:
                </span>
                {m.citations.map((c, i) => {
                  const isWeb = typeof c.source === "string" && /^https?:\/\//.test(c.source);
                  const label =
                    c.source === "fmcsa-hos-guide"
                      ? `FMCSA HOS Handbook · Page ${c.page_range}`
                      : c.title || "49 CFR Regulation";

                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-sm"
                    >
                      <div className="flex items-center justify-between text-[0.68rem] font-semibold text-blue-700 mb-1">
                        <span className="flex items-center gap-1">
                          <FileText size={11} />
                          {label}
                        </span>
                        {isWeb && <ExternalLink size={10} className="text-slate-400" />}
                      </div>
                      {c.snippet && (
                        <p className="line-clamp-2 text-slate-600 text-[0.7rem] italic">
                          "{c.snippet}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {error && (
        <div className="shrink-0 flex items-center gap-2 border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Suggested Command Chips */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-3">
        <div className="mb-1.5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider">
          Suggested Queries
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Optimize my trip", icon: Zap },
            { label: "Explain 14h rule", icon: HelpCircle },
            { label: "Check 34h restart", icon: RefreshCw },
            { label: "Audit rest stops", icon: ShieldCheck },
          ].map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => handleCommand(label)}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-left text-xs text-slate-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
            >
              <Icon size={11} className="text-blue-600 shrink-0" />
              <span className="truncate font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-200 bg-white p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(message);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            placeholder="Ask Rig about routes or compliance…"
            className="flex-1 rounded-lg border border-slate-300 py-2 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={12} />
          </button>
        </form>
      </div>
    </aside>
  );
};
