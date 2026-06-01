import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Trash2, Upload, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useLock } from "@/components/LockControl";
import { supabase, BUCKETS, publicUrl, compressImage } from "@/lib/supabaseClient";
import { useT } from "@/lib/i18n";

type Memory = {
  path: string;
  url: string;
  createdAt: number;
};

const META_KEY = "piyush.memories.meta.v1";
type MetaMap = Record<string, { caption?: string; liked?: boolean }>;

function loadMeta(): MetaMap {
  try { return JSON.parse(localStorage.getItem(META_KEY) || "{}"); } catch { return {}; }
}
function saveMeta(m: MetaMap) {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch { /* ignore */ }
}

export function MemoriesGallery() {
  const { t } = useT();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [meta, setMeta] = useState<MetaMap>({});
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { unlocked, lockUI } = useLock("piyush.memories.unlocked");

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from(BUCKETS.memories).list("", {
      limit: 200, sortBy: { column: "created_at", order: "desc" },
    });
    if (error) {
      console.warn("memories list failed", error);
      setMemories([]);
    } else {
      setMemories(
        (data || [])
          .filter((f) => f.name && !f.name.endsWith("/"))
          .map((f) => ({
            path: f.name,
            url: publicUrl(BUCKETS.memories, f.name),
            createdAt: f.created_at ? new Date(f.created_at).getTime() : 0,
          }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); setMeta(loadMeta()); }, [refresh]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setBusy(true);
    for (const f of arr) {
      try {
        const blob = await compressImage(f, 1200, 0.85);
        const path = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error } = await supabase.storage.from(BUCKETS.memories).upload(path, blob, {
          contentType: "image/jpeg", upsert: false,
        });
        if (error) console.warn("upload failed", error);
      } catch (e) { console.warn("skip", e); }
    }
    setBusy(false);
    await refresh();
  }, [refresh]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const toggleLike = (path: string) => {
    const next = { ...meta, [path]: { ...meta[path], liked: !meta[path]?.liked } };
    setMeta(next); saveMeta(next);
  };
  const setCaption = (path: string, caption: string) => {
    const next = { ...meta, [path]: { ...meta[path], caption } };
    setMeta(next); saveMeta(next);
  };

  const remove = async (path: string) => {
    const { error } = await supabase.storage.from(BUCKETS.memories).remove([path]);
    if (error) { console.warn(error); return; }
    setMemories((p) => p.filter((m) => m.path !== path));
    const next = { ...meta }; delete next[path]; setMeta(next); saveMeta(next);
  };

  const clearAll = async () => {
    if (!memories.length) return;
    if (!window.confirm("Clear all memories? This cannot be undone.")) return;
    const paths = memories.map((m) => m.path);
    await supabase.storage.from(BUCKETS.memories).remove(paths);
    await refresh();
  };

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % memories.length));
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? null : (i - 1 + memories.length) % memories.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, memories.length]);

  const current = lightbox !== null ? memories[lightbox] : null;

  return (
    <section id="memories" className="relative px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="reveal-on-scroll mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">— gallery</p>
            <h2 className="mt-3 text-4xl font-bold sm:text-5xl">📸 {t("memories")}</h2>
            <p className="mt-2 text-muted-foreground italic">{t("memories_subtitle")}</p>
          </div>
          <div className="shrink-0 pt-2">{lockUI}</div>
        </div>

        {unlocked && (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className="group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-10"
            style={{
              borderColor: dragOver ? "oklch(0.78 0.20 305)" : "oklch(0.68 0.22 295 / 0.45)",
              background: dragOver ? "oklch(0.55 0.22 295 / 0.10)" : "oklch(1 0 0 / 0.02)",
              boxShadow: dragOver ? "0 0 60px -10px oklch(0.78 0.20 305 / 0.55)" : "none",
            }}
          >
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)} />
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
              </div>
              <p className="text-sm sm:text-base">{busy ? t("processing") : t("drop_memories")}</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-12 flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("loading")}
          </div>
        ) : memories.length === 0 ? (
          <div className="reveal-on-scroll mt-12 flex flex-col items-center justify-center py-16 text-center">
            <div className="text-8xl opacity-25">📷</div>
            <p className="mt-4 text-muted-foreground">{t("no_memories")}</p>
          </div>
        ) : (
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
            {memories.map((m, i) => (
              <MemoryCard key={m.path} m={m} info={meta[m.path] || {}} admin={unlocked}
                onOpen={() => setLightbox(i)}
                onLike={() => toggleLike(m.path)}
                onDelete={() => remove(m.path)}
                onCaption={(c) => setCaption(m.path, c)} />
            ))}
          </div>
        )}

        {unlocked && memories.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button onClick={clearAll} className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-destructive">
              {t("clear_all")}
            </button>
          </div>
        )}
      </div>

      {current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <button aria-label="Close" onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          {memories.length > 1 && (
            <>
              <button aria-label="Previous"
                onClick={(e) => { e.stopPropagation(); setLightbox((idx) => (idx === null ? null : (idx - 1 + memories.length) % memories.length)); }}
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button aria-label="Next"
                onClick={(e) => { e.stopPropagation(); setLightbox((idx) => (idx === null ? null : (idx + 1) % memories.length)); }}
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="flex max-h-full max-w-5xl flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img src={current.url} alt="memory" className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl" />
            {meta[current.path]?.caption && (
              <p className="max-w-xl text-center text-sm text-white/80">{meta[current.path]?.caption}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function MemoryCard({
  m, info, admin, onOpen, onLike, onDelete, onCaption,
}: {
  m: Memory;
  info: { caption?: string; liked?: boolean };
  admin: boolean;
  onOpen: () => void; onLike: () => void; onDelete: () => void; onCaption: (c: string) => void;
}) {
  const liked = !!info.liked;
  return (
    <div className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-300 hover:scale-[1.02]"
      style={{ animation: "reveal .5s ease-out both" }}>
      <img src={m.url} alt={info.caption || "memory"} className="block w-full cursor-zoom-in"
        onClick={onOpen} loading="lazy" />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="pointer-events-auto flex justify-end gap-2 p-3">
          <button onClick={onLike} aria-label="Like"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-colors hover:bg-black/70">
            <Heart className="h-4 w-4" fill={liked ? "oklch(0.65 0.24 25)" : "none"} stroke={liked ? "oklch(0.65 0.24 25)" : "white"} />
          </button>
          {admin && (
            <button onClick={onDelete} aria-label="Delete"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-destructive/80">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        {admin ? (
          <div className="pointer-events-auto p-3">
            <input value={info.caption || ""} onChange={(e) => onCaption(e.target.value)}
              placeholder="Add a caption…" maxLength={120}
              className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-xs text-white placeholder:text-white/50 backdrop-blur focus:border-primary/60 focus:outline-none" />
          </div>
        ) : info.caption ? (
          <div className="pointer-events-auto p-3">
            <p className="line-clamp-2 text-xs text-white/90">{info.caption}</p>
          </div>
        ) : null}
      </div>
      {liked && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs opacity-100 transition-opacity group-hover:opacity-0">
          <Heart className="h-3.5 w-3.5" fill="oklch(0.65 0.24 25)" stroke="oklch(0.65 0.24 25)" />
        </div>
      )}
    </div>
  );
}
