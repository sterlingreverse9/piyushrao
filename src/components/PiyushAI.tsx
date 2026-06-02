import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTED = [
  "Who is Piyush?",
  "What projects has he built?",
  "What are his hobbies?",
  "Why was this website created?",
  "What's his favorite game?",
  "Tell me about his journey",
];

const GREETING: Msg = {
  role: "assistant",
  content: "Hey! I'm Piyush AI ✨ — a digital version of Piyush who knows everything about him and this site. Ask me anything!",
};

export function PiyushAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/piyush-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: "Oops, I couldn't reach my brain just now. Try again in a moment 🙏" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Piyush AI"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground transition-transform hover:scale-105 active:scale-95"
        style={{
          background: "var(--gradient-violet)",
          boxShadow: "0 10px 40px -8px oklch(0.68 0.22 295 / 0.7), 0 0 0 1px oklch(1 0 0 / 0.1) inset",
        }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ animation: "ai-pulse 2.4s ease-in-out infinite", background: "oklch(0.68 0.22 295 / 0.35)" }}
          />
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="glass fixed z-50 flex flex-col overflow-hidden"
          style={{
            bottom: "calc(5rem + env(safe-area-inset-bottom))",
            right: "1.25rem",
            left: "1.25rem",
            maxWidth: "380px",
            marginLeft: "auto",
            height: "min(560px, calc(100vh - 7rem))",
            borderRadius: "1.5rem",
            animation: "ai-pop .3s cubic-bezier(.34,1.56,.64,1)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 border-b p-4"
            style={{ borderColor: "oklch(1 0 0 / 0.08)", background: "linear-gradient(135deg, oklch(0.68 0.22 295 / 0.15), transparent)" }}
          >
            <div
              className="relative flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "var(--gradient-violet)", boxShadow: "var(--shadow-glow)" }}
            >
              <Sparkles className="h-5 w-5 text-primary-foreground" />
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
                style={{ background: "oklch(0.75 0.20 150)", borderColor: "oklch(0.15 0.02 285)" }}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-bold leading-tight">Piyush AI</h3>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "oklch(0.75 0.20 150)", boxShadow: "0 0 8px oklch(0.75 0.20 150)" }} />
                Piyush AI is online
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                  style={
                    m.role === "user"
                      ? {
                          background: "var(--gradient-violet)",
                          color: "var(--primary-foreground)",
                          borderBottomRightRadius: "0.4rem",
                        }
                      : {
                          background: "oklch(1 0 0 / 0.05)",
                          border: "1px solid oklch(1 0 0 / 0.08)",
                          borderBottomLeftRadius: "0.4rem",
                          animation: "ai-fade .35s ease",
                        }
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
                  style={{ background: "oklch(1 0 0 / 0.05)", border: "1px solid oklch(1 0 0 / 0.08)", borderBottomLeftRadius: "0.4rem" }}
                >
                  <Dot delay="0s" />
                  <Dot delay=".15s" />
                  <Dot delay=".3s" />
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="pt-2">
                <p className="mb-2 px-1 text-[11px] uppercase tracking-wider text-muted-foreground">Try asking</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full border px-3 py-1.5 text-xs transition-all hover:border-primary/60 hover:bg-primary/10"
                      style={{ borderColor: "oklch(1 0 0 / 0.12)", color: "var(--muted-foreground)" }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-center gap-2 border-t p-3"
            style={{ borderColor: "oklch(1 0 0 / 0.08)" }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Piyush AI anything…"
              disabled={loading}
              className="flex-1 rounded-full border bg-black/30 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 disabled:opacity-60"
              style={{ borderColor: "oklch(1 0 0 / 0.12)" }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary-foreground transition-all hover:scale-105 disabled:opacity-40"
              style={{ background: "var(--gradient-violet)", boxShadow: "0 6px 20px -6px oklch(0.68 0.22 295 / 0.6)" }}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 rounded-full"
      style={{
        background: "oklch(0.78 0.20 305)",
        animation: `ai-bounce 1s ease-in-out ${delay} infinite`,
      }}
    />
  );
}
