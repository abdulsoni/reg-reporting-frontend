"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

import {
  Bot,
  Send,
  X,
  User,
  Sparkles,
  Loader2,
  Minus,
  Maximize2,
  Network,
  Database,
} from "lucide-react";

import type { LineageData } from "../types/lineage";
import type {
  AttributeSearchEntry,
  UpstreamTrace,
} from "../lib/reverseLineage";
import { apiUrl } from "../lib/config";

type ActiveTrace = {
  entry: AttributeSearchEntry;
  trace: UpstreamTrace;
} | null;

type ViewMode = "system" | "data";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  data: LineageData;
  activeTrace: ActiveTrace;
  onClose: () => void;
  panelRef?: RefObject<HTMLDivElement | null>;
};

/*
 * Solid colors live in inline styles on purpose. They do not depend on
 * Tailwind generating arbitrary-value classes, so the panel is opaque on
 * every machine, build and browser.
 */
const COLORS = {
  panel: "#182638",
  header: "#1b2b40",
  subHeader: "#1b2a3d",
  footer: "#172537",
  card: "#394657",
  cardHover: "#45566d",
  assistantBubble: "#303e50",
  userBubble: "#2a4a86",
  input: "#3b485b",
  border: "#3d4c61",
  text: "#ffffff",
  muted: "#94a3b8",
};

const PANEL_STYLE: CSSProperties = {
  position: "fixed",
  bottom: 16,
  right: 16,
  zIndex: 2147483000,
  width: 340,
  maxWidth: "calc(100vw - 2rem)",
  backgroundColor: COLORS.panel,
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
  opacity: 1,
  isolation: "isolate",
};

const emptySubscribe = () => () => {};

const VIEW_OPTIONS: {
  id: ViewMode;
  label: string;
  icon: typeof Network;
}[] = [
  {
    id: "system",
    label: "System View",
    icon: Network,
  },
  {
    id: "data",
    label: "Data View",
    icon: Database,
  },
];

function buildDemoAnswer(
  prompt: string,
  data: LineageData,
  activeTrace: ActiveTrace,
  viewMode: ViewMode
): string {
  if (viewMode === "data") {
    const trace = data.trace;

    if (!trace) {
      return `You asked: "${prompt}". No datapoint trace is loaded in this view. Open a datapoint from the evidence page and ask again. (Demo response — the assistant API is not available.)`;
    }

    const systems = Array.from(new Set(trace.hops.map((hop) => hop.systemId)));
    const reconciliation = trace.reconciliation;

    const parts = [
      `You asked: "${prompt}".`,
      `Datapoint ${trace.datapointId} is ${trace.status.toLowerCase()} across ${trace.hops.length} traced hop${trace.hops.length === 1 ? "" : "s"} in ${systems.length} system${systems.length === 1 ? "" : "s"}: ${systems.join(", ")}.`,
      `Reported value ${String(reconciliation.reportedValue)}, calculated value ${String(reconciliation.calculatedValue)}, variance ${reconciliation.variance ?? "n/a"} (tolerance ${reconciliation.tolerance}) — reconciliation ${reconciliation.result}.`,
    ];

    if (trace.nextSource) {
      const nextSystem = trace.nextSource.system;
      if (typeof nextSystem === "string" && nextSystem.length > 0) {
        parts.push(`Next source to connect: ${nextSystem}.`);
      }
    }

    parts.push("This is a demo response because the assistant API is not available.");
    return parts.join(" ");
  }

  if (!activeTrace) {
    return `You asked: "${prompt}". No attribute is currently selected. Search for an attribute or select a column in the graph, then ask again. (Demo response — the assistant API is not available.)`;
  }

  const { entry, trace } = activeTrace;

  const systemLabels = new Map(
    data.systems.map((system) => [system.id, system.label])
  );

  const systems = Array.from(trace.pathSystemIds).map(
    (systemId) => systemLabels.get(systemId) ?? systemId
  );

  const transformations = Array.from(
    new Set(
      data.lineageEdges
        .filter(
          (edge) =>
            trace.edgeIds.has(edge.id) && edge.transformation.trim().length > 0
        )
        .map((edge) => edge.transformation.trim())
    )
  ).slice(0, 4);

  const parts = [
    `You asked: "${prompt}".`,
    `${entry.attributeName} (${entry.tableName} in ${entry.systemLabel}) is traced through ${systems.length} upstream system${systems.length === 1 ? "" : "s"}: ${systems.join(", ")}.`,
  ];

  if (transformations.length > 0) {
    parts.push(`Key transformations: ${transformations.join("; ")}.`);
  }

  parts.push("This is a demo response because the assistant API is not available.");
  return parts.join(" ");
}

export default function LineageAssistantPanel({
  data,
  activeTrace,
  onClose,
  panelRef,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode | null>(null);

  /*
   * Portals only exist in the browser. `useSyncExternalStore` returns false
   * during SSR and true on the client, avoiding a hydration mismatch without
   * setting state inside an effect.
   */
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const nextMessageId = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pathSystems = activeTrace
    ? Array.from(activeTrace.trace.pathSystemIds)
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, sending]);

  async function sendMessage(value?: string) {
    const prompt = (value ?? question).trim();
    if (!prompt || sending || !viewMode) return;

    setMessages((current) => [
      ...current,
      { id: ++nextMessageId.current, role: "user", content: prompt },
    ]);

    setQuestion("");
    setSending(true);
    setError("");

    try {
      const response = await fetch(
         apiUrl(`/api/lineage/assistant`),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: prompt,
            context: {
              view_mode: viewMode,
              selected_attribute: activeTrace?.entry.attributeName ?? null,
              selected_attribute_id: activeTrace?.entry.attributeId ?? null,
              selected_system_id: activeTrace?.entry.systemId ?? null,
              selected_table_id: activeTrace?.entry.tableId ?? null,
              upstream_systems: pathSystems,
              lineage_data: data,
              datapoint_trace: viewMode === "data" ? data.trace ?? null : null,
            },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setMessages((current) => [
            ...current,
            {
              id: ++nextMessageId.current,
              role: "assistant",
              content: buildDemoAnswer(prompt, data, activeTrace, viewMode),
            },
          ]);
          return;
        }

        throw new Error(`Assistant request failed (${response.status})`);
      }

      const result = await response.json();

      setMessages((current) => [
        ...current,
        {
          id: ++nextMessageId.current,
          role: "assistant",
          content:
            result.answer ?? result.message ?? "I couldn't generate a response.",
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to connect to the assistant."
      );
    } finally {
      setSending(false);
    }
  }

  if (!mounted) return null;

  const panel = (
    <aside
      ref={panelRef}
      role={minimized ? "button" : undefined}
      aria-label={minimized ? "Expand Assistant" : "Lineage assistant"}
      onClick={minimized ? () => setMinimized(false) : undefined}
      className="flex flex-col overflow-hidden"
      style={{
        ...PANEL_STYLE,
        height: minimized ? 54 : 550,
        maxHeight: "calc(100vh - 2rem)",
        cursor: minimized ? "pointer" : "default",
      }}
    >
      {/* HEADER */}
      <div
        className="flex shrink-0 items-center justify-between px-3"
        style={{
          height: 54,
          backgroundColor: COLORS.header,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              backgroundColor: "#2b3b52",
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <Bot size={19} color="#e2e8f0" />
          </div>
          <h3
            className="text-[13px] font-semibold tracking-tight"
            style={{ color: COLORS.text }}
          >
            ChatBot
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMinimized((current) => !current);
            }}
            className="rounded-md p-1 transition hover:bg-white/10"
            style={{ color: "#cbd5e1" }}
            aria-label={minimized ? "Maximize assistant" : "Minimize assistant"}
          >
            {minimized ? <Maximize2 size={15} /> : <Minus size={15} />}
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            className="rounded-md p-1 transition hover:bg-white/10"
            style={{ color: "#cbd5e1" }}
            aria-label="Close assistant"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* VIEW SELECTOR — always visible, aligned with the panel */}

          <div
            className="flex shrink-0 items-center gap-1.5 px-2.5 py-2"
            style={{
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            {VIEW_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = option.id === viewMode;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setViewMode(option.id)}
                  aria-pressed={active}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition"
                  style={{
                    backgroundColor: active ? "#27447a" : COLORS.card,
                    color: active ? "#dbeafe" : "#cbd5e1",
                    border: `1px solid ${active ? "#60a5fa" : COLORS.border}`,
                  }}
                >
                  <Icon size={12} color={active ? "#93c5fd" : COLORS.muted} />
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* CHAT CONTENT */}
          <div
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2.5 py-2.5"
            style={{
              backgroundColor: COLORS.panel,
              scrollbarWidth: "thin",
              scrollbarColor: "#475569 transparent",
            }}
          >
            {messages.length === 0 && (
              <>
                <div className="flex items-center gap-2 pb-1">
                  <Sparkles size={14} color="#60a5fa" />
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: "#e2e8f0" }}
                  >
                    How can I help you?
                  </span>
                </div>

                <p
                  className="px-1 text-[11px] leading-[17px]"
                  style={{ color: COLORS.muted }}
                >
                  {viewMode === null
                    ? "Select System View or Data View above to scope your questions."
                    : viewMode === "system"
                      ? "Ask a question about the system lineage. You can switch views at any time using the selector above."
                      : "Ask a question about the traced datapoint values. You can switch views at any time using the selector above."}
                </p>
              </>
            )}

            {messages.map((message) => {
              const isAssistant = message.role === "assistant";

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant && (
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "#2f3f55" }}
                    >
                      <Bot size={15} color="#e2e8f0" />
                    </div>
                  )}

                  <div className="min-w-0 max-w-[88%]">
                    <p
                      className={`mb-1 text-[9px] font-semibold uppercase tracking-wider ${
                        isAssistant ? "" : "text-right"
                      }`}
                      style={{ color: isAssistant ? "#60a5fa" : "#64748b" }}
                    >
                      {isAssistant ? "ChatBot" : "You"}
                    </p>

                    <div
                      className="whitespace-pre-wrap break-words px-3 py-2.5 text-[12px] leading-[19px]"
                      style={{
                        backgroundColor: isAssistant
                          ? COLORS.assistantBubble
                          : COLORS.userBubble,
                        color: isAssistant ? "#f1f5f9" : "#eff6ff",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 12,
                      }}
                    >
                      {message.content}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "#3a4a60" }}
                    >
                      <User size={14} color="#e2e8f0" />
                    </div>
                  )}
                </div>
              );
            })}

            {sending && (
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-3 text-[11px]"
                style={{ backgroundColor: "#25354a", color: "#cbd5e1" }}
              >
                <Loader2 size={14} className="animate-spin" color="#60a5fa" />
                ATLAS is analyzing lineage...
              </div>
            )}

            {error && (
              <div
                className="rounded-lg p-2.5 text-[11px]"
                style={{
                  backgroundColor: "#3b2230",
                  border: "1px solid #7f3446",
                  color: "#fda4af",
                }}
              >
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div
            className="shrink-0 p-2.5"
            style={{
              backgroundColor: COLORS.footer,
              borderTop: `1px solid ${COLORS.border}`,
            }}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  viewMode === null
                    ? "Select a view to start asking..."
                    : viewMode === "system"
                      ? "Ask about system lineage..."
                      : "Ask about data lineage..."
                }
                disabled={sending || !viewMode}
                className="h-9 min-w-0 flex-1 px-3 text-[11px] outline-none disabled:opacity-60"
                style={{
                  backgroundColor: COLORS.input,
                  color: COLORS.text,
                  border: "1px solid #556176",
                  borderRadius: 8,
                }}
              />

              <button
                type="submit"
                disabled={!question.trim() || sending || !viewMode}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  backgroundColor: "#cbd5e1",
                  color: "#1e293b",
                  borderRadius: 8,
                  minWidth:'30px'
                }}
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </aside>
  );

  // Portal to <body> so no ancestor transform, overflow, opacity or stacking
  // context can clip, fade or mis-position the fixed panel.
  return createPortal(panel, document.body);
}