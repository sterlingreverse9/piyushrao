import { useCallback, useEffect, useState } from "react";
import { Send, Trash2, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useLock } from "@/components/LockControl";
import { useT } from "@/lib/i18n";

type Note = {
  id: string;
  name: string;
  note: string;
  created_at: string;
};

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotesSection() {
  const { t } = useT();
  const { unlocked, lockUI } = useLock("piyush.notes.unlocked");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visitor_notes")
      .select("id, name, note, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.warn("notes load failed", error);
      setError(error.message);
      setNotes([]);
    } else {
      setError(null);
      setNotes(data as Note[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("visitor_notes").insert({
      name: name.trim().slice(0, 60),
      note: text.trim().slice(0, 200),
    });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setName(""); setText("");
    refresh();
  };

  const remove = async (id: string) => {
    await supabase.from("visitor_notes").delete().eq("id", id);
    refresh();
  };

  return (
    <section id="notes" className="relative px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="reveal-on-scroll flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">— guestbook</p>
            <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("leave_note")} 💬</h2>
            <p className="mt-2 text-muted-foreground italic">{t("visited_leave")}</p>
          </div>
          <div className="shrink-0 pt-2">{lockUI}</div>
        </div>

        <form onSubmit={submit} className="reveal-on-scroll glass mt-10 p-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("your_name")} maxLength={60} required
              className="rounded-xl border border-border bg-black/30 px-4 py-3 text-sm outline-none focus:border-primary/60" />
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 200))} placeholder={t("your_note")} rows={2} maxLength={200} required
              className="rounded-xl border border-border bg-black/30 px-4 py-3 text-sm outline-none focus:border-primary/60" />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{text.length}/200</span>
            <button type="submit" disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)] disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t("post_note")}
            </button>
          </div>
          {error && (
            <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error.includes("relation") || error.includes("does not exist")
                ? "Notes table not set up yet. Create the visitor_notes table in Supabase to enable this section."
                : error}
            </p>
          )}
        </form>

        <div className="mt-10">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("loading")}
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 opacity-40" />
              <p className="mt-3">{t("no_notes")}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((n) => (
                <div key={n.id} className="glass glass-hover relative p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 font-display text-sm font-bold text-primary">
                      {n.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{n.name}</p>
                      <p className="text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                    </div>
                    {unlocked && (
                      <button onClick={() => remove(n.id)} aria-label="Delete note"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/90">{n.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
