import { useState } from "react";
import { Loader2, Sparkles, UserRound, KeyRound, ArrowRight } from "lucide-react";
import { createProfile, recoverProfile, type VisitorProfile } from "@/lib/visitorProfile";

export function VisitorOnboarding({
  onDone,
}: {
  onDone: (p: VisitorProfile) => void;
}) {
  const [mode, setMode] = useState<"new" | "recover">("new");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = name.trim();
    if (!v) {
      setError("Please enter your name to continue.");
      return;
    }
    setLoading(true);
    try {
      const p = await createProfile(v);
      onDone(p);
    } catch (err) {
      setError("Couldn't create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const u = username.trim().toLowerCase();
    if (!u) {
      setError("Enter your username (e.g. rahul847).");
      return;
    }
    setLoading(true);
    try {
      const p = await recoverProfile(u);
      if (!p) {
        setError("No profile found with that username.");
      } else {
        onDone(p);
      }
    } catch {
      setError("Recovery failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      style={{
        background: "oklch(0.05 0.02 285 / 0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        animation: "ai-fade .35s ease",
      }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl p-7"
        style={{
          background:
            "linear-gradient(160deg, oklch(0.18 0.05 295 / 0.96), oklch(0.12 0.04 270 / 0.98))",
          border: "1px solid oklch(0.65 0.22 295 / 0.35)",
          boxShadow:
            "0 0 80px oklch(0.55 0.25 295 / 0.3), 0 25px 60px -15px oklch(0 0 0 / 0.7)",
          animation: "ai-pop .35s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl"
          style={{ background: "oklch(0.55 0.25 295 / 0.35)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full blur-3xl"
          style={{ background: "oklch(0.50 0.22 320 / 0.30)" }}
        />

        <div className="relative">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: "var(--gradient-violet)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>

          <h2 className="text-center font-display text-2xl font-extrabold tracking-tight">
            {mode === "new" ? (
              <>Welcome to <span className="text-gradient">VibeSpace</span> 👋</>
            ) : (
              <>Recover your <span className="text-gradient">profile</span></>
            )}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {mode === "new"
              ? "Before you enter, tell me your name."
              : "Enter your username to restore your data."}
          </p>

          {mode === "new" ? (
            <form onSubmit={submitNew} className="mt-6 space-y-3">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary">
                  <UserRound className="h-3 w-3" /> Your name
                </span>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  placeholder="e.g. Rahul"
                  maxLength={40}
                  className="w-full rounded-xl border px-4 py-3 text-base outline-none transition-colors focus:border-primary"
                  style={{
                    borderColor: "oklch(0.65 0.22 295 / 0.3)",
                    background: "oklch(0 0 0 / 0.35)",
                  }}
                />
              </label>

              {error && (
                <p className="rounded-lg px-3 py-2 text-xs"
                  style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.85 0.18 25)" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                style={{
                  background: "var(--gradient-violet)",
                  boxShadow: "var(--shadow-glow)",
                  minHeight: 48,
                }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
              </button>

              <button
                type="button"
                onClick={() => { setMode("recover"); setError(null); }}
                className="mx-auto mt-1 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <KeyRound className="h-3 w-3" />
                Already have a profile? Recover it →
              </button>
            </form>
          ) : (
            <form onSubmit={submitRecover} className="mt-6 space-y-3">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary">
                  <KeyRound className="h-3 w-3" /> Your username
                </span>
                <input
                  autoFocus
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(null); }}
                  placeholder="e.g. rahul847"
                  maxLength={32}
                  className="w-full rounded-xl border px-4 py-3 text-base outline-none transition-colors focus:border-primary"
                  style={{
                    borderColor: "oklch(0.65 0.22 295 / 0.3)",
                    background: "oklch(0 0 0 / 0.35)",
                  }}
                />
              </label>

              {error && (
                <p className="rounded-lg px-3 py-2 text-xs"
                  style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.85 0.18 25)" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                style={{
                  background: "var(--gradient-violet)",
                  boxShadow: "var(--shadow-glow)",
                  minHeight: 48,
                }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Recover →</>}
              </button>

              <button
                type="button"
                onClick={() => { setMode("new"); setError(null); }}
                className="mx-auto mt-1 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                ← Create new profile instead
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
