import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, Mic, MicOff, Volume2, VolumeX, ExternalLink, Lock, Unlock, Trash2, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
const ELEVEN_VOICE_ID = "1qEiC6qsybMkmnNdVMbK";
const ELEVEN_API_KEY = "sk_4b462662a574f6dd909d4655bc8c74424957bc221970f71a";

type Msg = { role: "user" | "assistant"; content: string; ts: number };
type Knowledge = { id: string; info: string; created_at: string };

const ADMIN_PASSWORD = "qwer123@$()";
const ADMIN_SESSION_KEY = "piyush.ai.admin.unlocked";

const SUGGESTED = [
  "Who is Piyush?",
  "What are his hobbies?",
  "Tell me about his education",
  "What is vibe coding?",
  "Open Telegram",
  "Open Instagram",
  "Open WhatsApp",
];

const GREETING: Msg = {
  role: "assistant",
  ts: Date.now(),
  content:
    "Hey 👋 I'm Piyush AI.\n\nI'm a digital version of Piyush and can tell you about his journey, hobbies, education, interests, projects, and website.\n\nYou can type or tap the 🎤 to talk — I'll auto-send when you stop speaking and read my reply aloud.",
};

const LINK_MAP: { match: RegExp; url: string }[] = [
  { match: /open\s+telegram|telegram\s+(link|open)/i, url: "https://t.me/mrpuppyx" },
  { match: /open\s+instagram|instagram\s+(link|open)/i, url: "https://www.instagram.com/temporary_piyush?igsh=c2R3dHJrbno4Zzl0" },
  { match: /open\s+whatsapp|whatsapp\s+(link|open)/i, url: "https://wa.me/918395951790" },
  { match: /(show|open)\s+(home|location|house)/i, url: "https://maps.app.goo.gl/uiPSPvyV4vPpsc9FA" },
  { match: /(show|open|where).*school/i, url: "https://maps.app.goo.gl/WUL5FruudtcxSG1A7" },
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
  const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState(false);
  const [newInfo, setNewInfo] = useState("");
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<any>(null);
  const lastSpokenRef = useRef<number>(-1);

  // Load admin state & knowledge
  useEffect(() => {
    try { setAdminUnlocked(sessionStorage.getItem(ADMIN_SESSION_KEY) === "1"); } catch {}
  }, []);

  const refreshKnowledge = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ai_knowledge")
        .select("id, info, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!error && data) setKnowledge(data as Knowledge[]);
    } catch (e) { console.warn("ai_knowledge load", e); }
  }, []);

  useEffect(() => { refreshKnowledge(); }, [refreshKnowledge]);

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

  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    for (const { match, url } of LINK_MAP) {
      if (match.test(content)) { window.open(url, "_blank", "noopener"); break; }
    }

    const userMsg: Msg = { role: "user", content, ts: Date.now() };
    const next: Msg[] = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const payload = next.filter((m) => m !== GREETING).map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/piyush-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payload,
          knowledge: knowledge.map((k) => k.info),
        }),
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
  }, [messages, loading, knowledge]);

  // Auto-speak new assistant message
  useEffect(() => {
    if (!open) return;
    const lastIdx = messages.length - 1;
    if (lastIdx <= 0) return;
    if (lastIdx === lastSpokenRef.current) return;
    const last = messages[lastIdx];
    if (last.role !== "assistant") return;
    lastSpokenRef.current = lastIdx;
    const clean = last.content.replace(/https?:\/\/\S+/g, "").trim();
    if (!clean) return;
    const speakWithElevenLabs = async () => {
    setSpeakingIdx(lastIdx);
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`, {
        method: "POST",
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: clean,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        }),
      });
      if (!res.ok) {
  const errorText = await res.text();
  throw new Error(
    `ElevenLabs failed (${res.status}): ${errorText}`
  );
}
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { setSpeakingIdx((c) => (c === lastIdx ? null : c)); URL.revokeObjectURL(url); };
      audio.onerror = () => setSpeakingIdx((c) => (c === lastIdx ? null : c));
      audio.play();
    } catch (err) {
  alert("ElevenLabs Error: " + String(err));

  const synth = window.speechSynthesis;

  if (synth) {
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = /[\u0900-\u097F]/.test(clean) ? "hi-IN" : "en-IN";
    u.rate = 0.88;
    u.pitch = 1.1;
    u.onend = () => setSpeakingIdx((c) => (c === lastIdx ? null : c));

    synth.speak(u);
  }
}

};

speakWithElevenLabs();
  }, [messages, open]);

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
    // Stop any ongoing TTS so the mic can hear properly
    try { window.speechSynthesis?.cancel(); } catch {}
    setSpeakingIdx(null);

    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = false;
    let finalText = "";
    r.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setInput((finalText + interim).trim());
    };
    r.onend = () => {
      setListening(false);
      const toSend = (finalText || "").trim();
      if (toSend) {
        setInput("");
        send(toSend);
      }
    };
    r.onerror = () => setListening(false);
    recogRef.current = r;
    setListening(true);
    try { r.start(); } catch { setListening(false); }
  };

  const toggleSpeak = (idx: number, text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speakingIdx === idx) { synth.cancel(); setSpeakingIdx(null); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/https?:\/\/\S+/g, ""));
    u.lang = /[\u0900-\u097F]/.test(text) ? "hi-IN" : "en-IN";
    u.onend = () => setSpeakingIdx(null);
    u.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    synth.speak(u);
  };

  const submitPwd = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      try { sessionStorage.setItem(ADMIN_SESSION_KEY, "1"); } catch {}
      setShowPwd(false); setPwd(""); setPwdError(false);
      setShowAdmin(true);
    } else {
      setPwdError(true);
    }
  };

  const addInfo = async () => {
    const v = newInfo.trim();
    if (!v) return;
    setSaving(true);
    const { error } = await supabase.from("ai_knowledge").insert({ info: v.slice(0, 1000) });
    setSaving(false);
    if (!error) { setNewInfo(""); refreshKnowledge(); }
    else alert("Save failed: " + error.message);
  };

  const deleteInfo = async (id: string) => {
    await supabase.from("ai_knowledge").delete().eq("id", id);
    refreshKnowledge();
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Piyush AI"
        className="fixed right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground transition-transform hover:scale-105 active:scale-95"
        style={{
          bottom: "calc(5.5rem + env(safe-area-inset-bottom))",
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
            bottom: "calc(9rem + env(safe-area-inset-bottom))",
            right: "1.25rem",
            left: "1.25rem",
            maxWidth: "400px",
            marginLeft: "auto",
            height: "min(620px, calc(100vh - 11rem))",
            borderRadius: "1.5rem",
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
                Piyush AI is online · {knowledge.length} facts
              </p>
            </div>
            <button
              onClick={() => (adminUnlocked ? setShowAdmin((v) => !v) : setShowPwd(true))}
              aria-label="Admin"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              style={{
                background: adminUnlocked ? "oklch(0.55 0.20 150 / 0.18)" : "oklch(1 0 0 / 0.05)",
                color: adminUnlocked ? "oklch(0.82 0.18 150)" : "var(--muted-foreground)",
              }}
              title={adminUnlocked ? "Admin panel" : "Unlock admin"}
            >
              {adminUnlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Admin Panel */}
          {showAdmin && adminUnlocked && (
            <div className="border-b p-3" style={{ borderColor: "oklch(1 0 0 / 0.08)", background: "oklch(0.10 0.02 285 / 0.6)" }}>
              <p className="mb-2 text-[10px] uppercase tracking-wider text-primary">Feed AI personal info</p>
              <div className="flex gap-2">
                <input
                  value={newInfo}
                  onChange={(e) => setNewInfo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInfo(); } }}
                  placeholder='e.g. "Piyush loves Valorant"'
                  className="flex-1 rounded-lg border px-3 py-2 text-xs outline-none focus:border-primary/60"
                  style={{ borderColor: "oklch(1 0 0 / 0.12)", background: "oklch(0 0 0 / 0.35)" }}
                />
                <button
                  onClick={addInfo}
                  disabled={saving || !newInfo.trim()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary-foreground disabled:opacity-40"
                  style={{ background: "var(--gradient-violet)" }}
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
              </div>
              {knowledge.length > 0 && (
                <div className="mt-2 max-h-32 space-y-1 overflow-y-auto pr-1">
                  {knowledge.map((k) => (
                    <div key={k.id} className="flex items-start gap-2 rounded-md p-1.5 text-[11px]" style={{ background: "oklch(1 0 0 / 0.04)" }}>
                      <span className="flex-1 break-words text-foreground/85">{k.info}</span>
                      <button onClick={() => deleteInfo(k.id)} aria-label="Delete" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Password modal */}
          {showPwd && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowPwd(false)}>
              <form onSubmit={submitPwd} onClick={(e) => e.stopPropagation()} className="w-full max-w-xs rounded-2xl p-5" style={{ background: "oklch(0.14 0.03 285)", border: "1px solid oklch(0.68 0.22 295 / 0.3)" }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Lock className="h-4 w-4" />
                </div>
                <h4 className="mt-3 font-display text-base font-bold">Admin password</h4>
                <input
                  autoFocus
                  type="password"
                  value={pwd}
                  onChange={(e) => { setPwd(e.target.value); setPwdError(false); }}
                  placeholder="••••••••"
                  className="mt-3 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary/60"
                  style={{ borderColor: pwdError ? "oklch(0.65 0.24 25)" : "oklch(1 0 0 / 0.12)", background: "oklch(0 0 0 / 0.35)" }}
                />
                {pwdError && <p className="mt-1 text-[11px]" style={{ color: "oklch(0.75 0.22 25)" }}>Incorrect password</p>}
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setShowPwd(false)} className="flex-1 rounded-full border border-border px-3 py-2 text-xs">Cancel</button>
                  <button type="submit" className="flex-1 rounded-full bg-primary px-3 py-2 text-xs text-primary-foreground">Unlock</button>
                </div>
              </form>
            </div>
          )}

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
                          <a key={u} href={u} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                            style={{ background: "oklch(0.68 0.22 295 / 0.2)", border: "1px solid oklch(0.68 0.22 295 / 0.4)" }}>
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
                        onClick={() => toggleSpeak(i, cleanText || m.content)}
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
                <div className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
                  style={{ background: "oklch(0.20 0.03 285 / 0.95)", border: "1px solid oklch(1 0 0 / 0.10)", borderBottomLeftRadius: "0.4rem" }}>
                  <Dot delay="0s" /><Dot delay=".15s" /><Dot delay=".3s" />
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div className="pt-2">
                <p className="mb-2 px-1 text-[11px] uppercase tracking-wider text-muted-foreground">Try asking</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED.map((q) => (
                    <button key={q} onClick={() => send(q)}
                      className="rounded-full border px-3 py-1.5 text-xs transition-all hover:border-primary/60 hover:bg-primary/15"
                      style={{ borderColor: "oklch(1 0 0 / 0.14)", color: "var(--foreground)", background: "oklch(0.20 0.03 285 / 0.6)" }}>
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
              placeholder={listening ? "Listening… auto-sends when you stop" : "Ask Piyush AI anything…"}
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
