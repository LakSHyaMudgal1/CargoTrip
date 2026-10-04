import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, AlertCircle, Compass, RefreshCw, HelpCircle, FileText } from "lucide-react";
import { useUIActionBus } from "@/lib/uiActionBus";
import { sendChat } from "./chatService";
import { ConfirmTripCard } from "./ConfirmTripCard";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  isStreaming?: boolean;
  citations?: Array<{
    source: string;
    page_range: string;
    title?: string;
    snippet: string;
  }>;
  pendingConfirm?: any;
}

export const ChatDock: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I'm **Rig**, your autonomous dispatch and FMCSA compliance copilot. You can ask me to plot routes, explain HOS rules (49 CFR §395), optimize rest breaks, or verify paper logbook entries. How can I assist your dispatch today?"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zustand store triggers
  const { setCurrentPlan, setActiveLogDay, setPdfDownloadUrl } = useUIActionBus();

  // Session thread ID
  const [threadId] = useState(() => {
    const saved = sessionStorage.getItem("rig_thread_id");
    if (saved) return saved;
    const newId = `thread_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("rig_thread_id", newId);
    return newId;
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, loading]);

  const addMessage = (sender: "user" | "bot", text: string, extra?: Partial<Message>) => {
    const id = `msg_${Math.random().toString(36).substring(2, 11)}`;
    setMessages(prev => [...prev, { id, sender, text, ...extra }]);
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
      setMessages(prev => prev.filter(m => !m.pendingConfirm));
      addMessage("user", "Parameters authorized. Proceed with compliance calculation.");
    }

    const assistantMsgId = addMessage("bot", "", { isStreaming: true });

    try {
      const resp = await sendChat({
        message: isConfirm ? "" : textToSend,
        thread_id: threadId,
        confirm: isConfirm,
      });

      let downloadNote = "";
      for (const action of resp.ui_actions) {
        if (action.type === "RENDER_TRIP") {
          setCurrentPlan(action.payload);
        } else if (action.type === "SHOW_LOG_SHEET") {
          if (action.payload?.day_requested) setActiveLogDay(action.payload.day_requested);
        } else if (action.type === "OFFER_DOWNLOAD") {
          setPdfDownloadUrl(action.payload.download_url);
          downloadNote = `\n\n[Download Logs PDF](${action.payload.download_url}) (link valid for 15 minutes).`;
        }
      }

      const hasRenderTrip = resp.ui_actions.some((a) => a.type === "RENDER_TRIP");
      const replyText =
        resp.reply ||
        (hasRenderTrip
          ? "Route calculated and verified against 49 CFR Part 395! The geometry has been loaded onto your map and the daily ELD sheets have been populated."
          : resp.needs_confirmation
            ? "I've synthesized the dispatch request. Please confirm the routing parameters below:"
            : "Understood.");

      setMessages(prev => {
        let next = prev.map(m =>
          m.id === assistantMsgId
            ? {
                ...m,
                isStreaming: false,
                text: replyText + downloadNote,
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
      setError(e instanceof Error ? e.message : "Connection failed.");
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
    } finally {
      setLoading(false);
      setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, isStreaming: false } : m));
    }
  };

  const handleStarterChip = (query: string) => {
    handleSend(query);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-blue-700 active:scale-95"
          title="Open Rig AI Copilot"
        >
          <MessageSquare size={22} className="relative z-10" />
          
          {/* Subtle status pulse */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          </span>
        </button>
      )}

      {/* Modern AI Chat Drawer Window */}
      {isOpen && (
        <div className="chat-dock-panel flex h-[580px] w-[390px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header Bar */}
          <div className="relative border-b border-slate-200 bg-slate-50 px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden border border-blue-600/30 shadow-sm">
                <img src="/rig_ai_avatar.jpg" alt="Rig Avatar" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-[1.5px] border-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-sans text-sm font-bold text-slate-900 tracking-tight">
                    Rig Copilot
                  </h3>
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-1.5 py-0.2 font-mono text-[0.6rem] font-semibold text-blue-700">
                    AI Agent
                  </span>
                </div>
                <span className="font-mono text-[0.62rem] text-slate-500 flex items-center gap-1">
                  Gemini 2.5 Flash · RAG Active
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              title="Close Copilot"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                {m.text && (
                  <div className={`flex gap-2.5 max-w-[92%] ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    {m.sender === "bot" && (
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg overflow-hidden border border-slate-200 bg-white mt-auto mb-1 shadow-sm">
                        <img src="/rig_ai_avatar.jpg" alt="Rig" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        m.sender === "user"
                          ? "bg-blue-600 text-white font-medium rounded-tr-sm shadow-sm"
                          : "border border-slate-200 bg-white text-slate-800 rounded-tl-sm shadow-sm"
                      }`}
                    >
                      {m.sender === "bot" ? (
                        <div className="react-markdown-container space-y-1.5">
                          <ReactMarkdown
                            components={{
                              strong: ({ node, ...props }) => <strong className="text-slate-900 font-bold" {...props} />,
                              a: ({ node, ...props }) => (
                                <a
                                  className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-4 transition-colors"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  {...props}
                                />
                              ),
                              p: ({ node, ...props }) => <p className="my-1 text-slate-700" {...props} />,
                              ul: ({ node, ...props }) => <ul className="my-1.5 pl-4 list-disc marker:text-blue-600" {...props} />,
                              ol: ({ node, ...props }) => <ol className="my-1.5 pl-4 list-decimal marker:text-blue-600" {...props} />,
                              li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
                              code: ({ node, ...props }) => (
                                <code
                                  className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.75rem] text-slate-800 border border-slate-200"
                                  {...props}
                                />
                              ),
                              h1: ({ node, ...props }) => <h1 className="text-base font-bold text-slate-900 mt-2 mb-1" {...props} />,
                              h2: ({ node, ...props }) => <h2 className="text-sm font-bold text-slate-900 mt-2 mb-1" {...props} />,
                              h3: ({ node, ...props }) => <h3 className="text-xs font-bold text-slate-900 mt-1.5 mb-0.5" {...props} />,
                              blockquote: ({ node, ...props }) => (
                                <blockquote className="border-l-2 border-blue-600 pl-2.5 my-1.5 text-slate-600 italic" {...props} />
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
                        <span className="inline-block w-1.5 h-3 ml-1 bg-blue-600 animate-pulse rounded-sm" />
                      )}
                    </div>
                  </div>
                )}

                {/* Interactive Confirmation Card */}
                {m.pendingConfirm && (
                  <ConfirmTripCard
                    params={m.pendingConfirm}
                    onConfirm={() => handleSend("", true)}
                    onCancel={() => {
                      setMessages(prev => prev.filter(msg => msg.id !== m.id));
                    }}
                    disabled={loading}
                  />
                )}

                {/* Modern RAG Citations */}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                    {m.citations.map((c, i) => {
                      const isWeb = typeof c.source === "string" && /^https?:\/\//.test(c.source);
                      let host = "";
                      if (isWeb) {
                        try { host = new URL(c.source).hostname.replace(/^www\./, ""); } catch { host = c.source; }
                      }
                      const citationLabel = c.source === "fmcsa-hos-guide"
                        ? `FMCSA §395 (p. ${c.page_range})`
                        : isWeb
                          ? (c.title?.slice(0, 26) || host)
                          : "Handbook FAQ";

                      const chipClass = "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-[0.62rem] text-slate-700 hover:border-blue-600 hover:text-blue-600 shadow-sm transition-all";

                      return isWeb ? (
                        <a
                          key={i}
                          href={c.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={chipClass}
                          title={c.title || c.source}
                        >
                          <Compass size={11} className="text-blue-600" />
                          <span>{citationLabel}</span>
                        </a>
                      ) : (
                        <div key={i} className={chipClass + " cursor-help"} title={c.snippet}>
                          <FileText size={11} className="text-blue-600" />
                          <span>{citationLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Prompt Chips */}
          {messages.length === 1 && !loading && (
            <div className="border-t border-slate-200 bg-white px-4 py-2.5">
              <span className="font-mono text-[0.62rem] uppercase tracking-wider text-slate-500 block mb-1.5">
                Suggested Dispatches & Rules
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Explain 14h Rule", query: "Explain the FMCSA 14-hour on-duty window rule.", icon: HelpCircle },
                  { label: "Plan Trip", query: "Plan Dallas to Chicago, pickup Tulsa, 22 hrs cycle.", icon: Compass },
                  { label: "34h Restart", query: "When is a 34-hour restart legally scheduled?", icon: RefreshCw },
                ].map(({ label, query, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => handleStarterChip(query)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.68rem] font-medium text-slate-700 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm"
                  >
                    <Icon size={11} className="text-blue-600" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="border-t border-slate-200 bg-white p-3">
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
                placeholder="Ask Rig about parameters, routes, or HOS rules…"
                className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm"
              >
                <Send size={14} />
              </button>
            </form>
            <div className="mt-1.5 text-center font-mono text-[0.58rem] tracking-wider text-slate-500 uppercase">
              Powered by Gemini 2.5 Flash · 49 CFR Part 395 Deterministic Engine
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
