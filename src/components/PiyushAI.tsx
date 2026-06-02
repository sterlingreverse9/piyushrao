import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Mic, MicOff, Volume2, VolumeX, ExternalLink } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string; ts: number };

const SUGGESTED = [
  "Who is Piyush?",
  "What are his hobbies?",
  "Tell me about his education",
  "What is vibe coding?",
  "Where does he study?",
  "Open Telegram",
  "Open Instagram",
  "Open WhatsApp",
];

const GREETING: Msg = {
  role: "assistant",
  ts: Date.now(),
  content:
    "Hey 👋 I'm Piyush AI.\n\nI'm a digital version of Piyush and can tell you about his journey, hobbies, education, interests, projects, and website.\n\nYou can type or use the 🎤 to talk with me.",
};

// Smart-link detector
const LINK_MAP: { match: RegExp; url: string }[] = [
  { match: /open\s+telegram|telegram\s+(link|open)/i, url: "https://t.me/mrpuppyx" },
  { match: /open\s+instagram|instagram\s+(link|open)/i, url: "https://www.instagram.com/temporary_piyush?igsh=c2R3dHJrbno4Zzl0" },
  { match: /open\s+whatsapp|whatsapp\s+(link|open)/i, url: "https://wa.me/918395951790" },
  { match: /(show|open)\s+(home|location|house)/i, url: "https://maps.app.goo.gl/uiPSPvyV4vPpsc9FA" },
  { match: /(show|open|where).*school/i, url: "https://maps.app.goo.gl/F8CRuQ1UqRxou1QM9" },
];

function extractUrls(text: string): string[] {
  const urls = text.match(/https?:\/\/[^\s)]+/g) ?? [];
  return Array.from(new Set(urls));
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function PiyushAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => () => {
    try { recogRef.current?.stop?.(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    // Smart link side-effect
    for (const { match, url } of LINK_MAP) {
      if (match.test(content)) {
        window.open(url, "_blank", "noopener");
        break;
      }
    }

    const userMsg: Msg = { role: "user", content, ts: Date.now() };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const payload = next
        .filter((m) => m !== GREETING)
        .map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/piyush-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessages([...next, { role: "assistant", content: data.reply, ts: Date.now() }]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Oops, I couldn't reach my brain just now. Try again in a moment 🙏", ts: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input isn't supported in this browser. Try Chrome on Android/desktop.");
      return;
    }
    if (listening) {
      try { recogRef.current?.stop(); } catch {}
      setListening(false);
      return;
    }
    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e: any) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setInput(transcript);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    setListening(true);
    try { r.start(); } catch { setListening(false); }
  };

  const speak = (idx: number, text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speakingIdx === idx) {
      synth.cancel();
      setSpeakingIdx(null);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/https?:\/\/\S+/g, ""));
    u.lang = /[\u0900-\u097F]/.test(text) ? "hi-IN" : "en-IN";
    u.rate = 1;
    u.pitch = 1;
    u.onend = () => setSpeakingIdx(null);
    u.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    synth.speak(u);
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

      {open && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden"
          style={{
            bottom: "calc(5rem + env(safe-area-inset-bottom))",
            right: "1.25rem",
            left: "1.25rem",
            maxWidth: "400px",
            marginLeft: "auto",
            height: "min(620px, calc(100vh - 7rem))",
            borderRadius: "1.5rem",
            // Solid opaque chat surface — no website bleeding through
            background: "linear-gradient(180deg, oklch(0.16 0.03 285 / 0.98), oklch(0.12 0.02 285 / 0.98))",
            backdropFilter: "blur(24px) saturate(140%)",
            WebkitBackdropFilter: "blur(24px) saturate(140%)",
            border: "1px solid oklch(0.68 0.22 295 / 0.25)",
            boxShadow: "0 30px 80px -20px oklch(0 0 0 / 0.8), 0 0 60px -20px oklch(0.68 0.22 295 / 0.4)",
            animation: "ai-pop .3s cubic-bezier(.34,1.56,.64,1)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 border-b p-4"
            style={{ borderColor: "oklch(1 0 0 / 0.08)", background: "linear-gradient(135deg, oklch(0.68 0.22 295 / 0.18), transparent)" }}
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
            {messages.map((m, i) => {
              const urls = m.role === "assistant" ? extractUrls(m.content) : [];
              const cleanText = m.content.replace(/https?:\/\/\S+/g, "").trim();
              return (
                <div key={i} className={m.role === "user" ? "flex flex-col items-end" : "flex flex-col items-start"}>
                  <div
                    className="max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                    style={
                      m.role === "user"
                        ? {
                            background: "var(--gradient-violet)",
                            color: "var(--primary-foreground)",
                            borderBottomRightRadius: "0.4rem",
                            boxShadow: "0 4px 14px -4px oklch(0.68 0.22 295 / 0.5)",
                          }
                        : {
                            // Opaque dark glass — no website bleed
                            background: "oklch(0.20 0.03 285 / 0.95)",
                            color: "var(--foreground)",
                            border: "1px solid oklch(1 0 0 / 0.10)",
                            borderBottomLeftRadius: "0.4rem",
                            animation: "ai-fade .35s ease",
                            backdropFilter: "blur(8px)",
                          }
                    }
                  >
                    {cleanText || m.content}
                    {urls.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {urls.map((u) => (
                          <a
                            key={u}
                            href={u}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                            style={{ background: "oklch(0.68 0.22 295 / 0.2)", border: "1px solid oklch(0.68 0.22 295 / 0.4)" }}
                          >
                            <ExternalLink className="h-3 w-3" /> Open link
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`mt-1 flex items-center gap-2 px-1 text-[10px] text-muted-foreground ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <span>{fmtTime(m.ts)}</span>
                    {m.role === "assistant" && (
                      <button
                        onClick={() => speak(i, cleanText || m.content)}
                        className="flex items-center gap-1 rounded-full px-1.5 py-0.5 hover:bg-white/10 hover:text-foreground"
                        aria-label="Read aloud"
                      >
                        {speakingIdx === i ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                        <span>{speakingIdx === i ? "Stop" : "Listen"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
                  style={{ background: "oklch(0.20 0.03 285 / 0.95)", border: "1px solid oklch(1 0 0 / 0.10)", borderBottomLeftRadius: "0.4rem" }}
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
                      className="rounded-full border px-3 py-1.5 text-xs transition-all hover:border-primary/60 hover:bg-primary/15"
                      style={{ borderColor: "oklch(1 0 0 / 0.14)", color: "var(--foreground)", background: "oklch(0.20 0.03 285 / 0.6)" }}
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
            style={{ borderColor: "oklch(1 0 0 / 0.08)", background: "oklch(0.13 0.02 285 / 0.6)" }}
          >
            <button
              type="button"
              onClick={toggleMic}
              aria-label="Voice input"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all"
              style={{
                background: listening ? "oklch(0.65 0.24 25 / 0.25)" : "oklch(1 0 0 / 0.06)",
                border: `1px solid ${listening ? "oklch(0.65 0.24 25 / 0.6)" : "oklch(1 0 0 / 0.12)"}`,
                animation: listening ? "ai-pulse 1.4s ease-in-out infinite" : undefined,
                color: listening ? "oklch(0.75 0.22 25)" : "var(--muted-foreground)",
              }}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Listening…" : "Ask Piyush AI anything…"}
              disabled={loading}
              className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/60 disabled:opacity-60"
              style={{ borderColor: "oklch(1 0 0 / 0.12)", background: "oklch(0 0 0 / 0.35)", color: "var(--foreground)" }}
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
