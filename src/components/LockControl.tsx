import { useEffect, useRef, useState } from "react";
import { Lock, Unlock, X } from "lucide-react";

const PASSWORD = "piyush83";

export function useLock(storageKey: string) {
  const [unlocked, setUnlocked] = useState(false);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setUnlocked(sessionStorage.getItem(storageKey) === "1");
    } catch { /* ignore */ }
    setHydrated(true);
  }, [storageKey]);

  const setUnlockedPersist = (v: boolean) => {
    setUnlocked(v);
    try {
      if (v) sessionStorage.setItem(storageKey, "1");
      else sessionStorage.removeItem(storageKey);
    } catch { /* ignore */ }
  };

  const lockUI = (
    <>
      <LockButton unlocked={unlocked} onClick={() => setOpen(true)} />
      {open && (
        <PasswordModal
          onClose={() => setOpen(false)}
          onSuccess={() => { setUnlockedPersist(true); setOpen(false); }}
        />
      )}
    </>
  );

  return { unlocked: hydrated && unlocked, lockUI };
}

function LockButton({ unlocked, onClick }: { unlocked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={unlocked ? "Upload mode active" : "Unlock upload"}
      className="group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition-all"
      style={{
        borderColor: unlocked ? "oklch(0.70 0.18 150 / 0.55)" : "oklch(1 0 0 / 0.12)",
        background: unlocked ? "oklch(0.55 0.20 150 / 0.15)" : "oklch(1 0 0 / 0.04)",
        color: unlocked ? "oklch(0.85 0.18 150)" : "var(--muted-foreground)",
        boxShadow: unlocked ? "0 0 18px oklch(0.65 0.22 150 / 0.45)" : "none",
      }}
    >
      {unlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
      {unlocked ? "Upload Mode Active" : "Locked"}
    </button>
  );
}

function PasswordModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) onSuccess();
    else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="glass relative w-full max-w-sm p-6"
        style={{ animation: shake ? "lock-shake .45s ease" : undefined }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <h3 className="mt-4 font-display text-xl font-bold">Enter password</h3>
        <p className="mt-1 text-sm text-muted-foreground">Admin access required to upload.</p>
        <input
          ref={inputRef}
          type="password"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          placeholder="••••••••"
          className="mt-5 w-full rounded-xl border bg-black/30 px-4 py-3 text-sm outline-none transition-colors focus:border-primary/60"
          style={{ borderColor: error ? "oklch(0.65 0.24 25)" : "oklch(1 0 0 / 0.12)" }}
        />
        {error && (
          <p className="mt-2 text-xs font-medium" style={{ color: "oklch(0.75 0.22 25)" }}>
            Incorrect password
          </p>
        )}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]"
          >
            Unlock
          </button>
        </div>
      </form>
    </div>
  );
}
