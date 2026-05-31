import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, Trash2, Upload, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useLock } from "@/components/LockControl";


type Memory = {
  id: string;
  src: string;
  caption: string;
  liked: boolean;
  createdAt: number;
};

const STORAGE_KEY = "piyush.memories.v1";
const MAX_WIDTH = 800;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, MAX_WIDTH / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function MemoriesGallery() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { unlocked, lockUI } = useLock("piyush.memories.unlocked");


  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMemories(JSON.parse(raw));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
    } catch (e) {
      console.warn("Could not save memories — storage may be full", e);
    }
  }, [memories, loaded]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setBusy(true);
    const added: Memory[] = [];
    for (const f of arr) {
      try {
        const src = await compressImage(f);
        added.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          src,
          caption: "",
          liked: false,
          createdAt: Date.now(),
        });
      } catch (e) {
        console.warn("skip file", f.name, e);
      }
    }
    setMemories((prev) => [...added, ...prev]);
    setBusy(false);
  }, []);

  const onPick = () => inputRef.current?.click();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const toggleLike = (id: string) =>
    setMemories((p) => p.map((m) => (m.id === id ? { ...m, liked: !m.liked } : m)));

  const remove = (id: string) =>
    setMemories((p) => p.filter((m) => m.id !== id));

  const setCaption = (id: string, caption: string) =>
    setMemories((p) => p.map((m) => (m.id === id ? { ...m, caption } : m)));

  const clearAll = () => {
    if (memories.length === 0) return;
    if (window.confirm("Clear all memories? This cannot be undone.")) {
      setMemories([]);
    }
  };

  // Keyboard for lightbox
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
            <h2 className="mt-3 text-4xl font-bold sm:text-5xl">📸 Memories</h2>
            <p className="mt-2 text-muted-foreground italic">Moments I never want to forget</p>
          </div>
          <div className="shrink-0 pt-2">{lockUI}</div>
        </div>

        {/* Upload zone (admin only) */}
        {unlocked && (
          <div
            onClick={onPick}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className="group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-10"
            style={{
              borderColor: dragOver ? "oklch(0.78 0.20 305)" : "oklch(0.68 0.22 295 / 0.45)",
              background: dragOver
                ? "oklch(0.55 0.22 295 / 0.10)"
                : "oklch(1 0 0 / 0.02)",
              boxShadow: dragOver ? "0 0 60px -10px oklch(0.78 0.20 305 / 0.55)" : "none",
              animation: "reveal .5s ease-out both",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
              </div>
              <p className="text-sm sm:text-base">
                {busy ? "Processing your memories…" : "Drop your memories here, or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WEBP · multiple at once</p>
            </div>
          </div>
        )}


        {/* Grid / empty */}
        {memories.length === 0 ? (
          <div className="reveal-on-scroll mt-12 flex flex-col items-center justify-center py-16 text-center">
            <div className="text-8xl opacity-25">📷</div>
            <p className="mt-4 text-muted-foreground">No memories yet. Add your first one! ✨</p>
          </div>
        ) : (
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
            {memories.map((m, i) => (
              <MemoryCard
                key={m.id}
                m={m}
                admin={unlocked}
                onOpen={() => setLightbox(i)}
                onLike={() => toggleLike(m.id)}
                onDelete={() => remove(m.id)}
                onCaption={(c) => setCaption(m.id, c)}
              />
            ))}
          </div>
        )}

        {unlocked && memories.length > 0 && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={clearAll}
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-destructive"
            >
              Clear all memories
            </button>
          </div>
        )}

      </div>

      {/* Lightbox */}
      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            aria-label="Close"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {memories.length > 1 && (
            <>
              <button
                aria-label="Previous"
                onClick={(e) => { e.stopPropagation(); setLightbox((idx) => (idx === null ? null : (idx - 1 + memories.length) % memories.length)); }}
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                aria-label="Next"
                onClick={(e) => { e.stopPropagation(); setLightbox((idx) => (idx === null ? null : (idx + 1) % memories.length)); }}
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="flex max-h-full max-w-5xl flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={current.src}
              alt={current.caption || "memory"}
              className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            {current.caption && (
              <p className="max-w-xl text-center text-sm text-white/80">{current.caption}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function MemoryCard({
  m, onOpen, onLike, onDelete, onCaption,
}: {
  m: Memory;
  onOpen: () => void;
  onLike: () => void;
  onDelete: () => void;
  onCaption: (c: string) => void;
}) {
  return (
    <div
      className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-card transition-transform duration-300 hover:scale-[1.02]"
      style={{ animation: "reveal .5s ease-out both" }}
    >
      <img
        src={m.src}
        alt={m.caption || "memory"}
        className="block w-full cursor-zoom-in"
        onClick={onOpen}
        loading="lazy"
      />
      {/* Overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="pointer-events-auto flex justify-end gap-2 p-3">
          <button
            onClick={onLike}
            aria-label="Like"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-colors hover:bg-black/70"
          >
            <Heart
              className="h-4 w-4 transition-colors"
              fill={m.liked ? "oklch(0.65 0.24 25)" : "none"}
              stroke={m.liked ? "oklch(0.65 0.24 25)" : "white"}
            />
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-destructive/80"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="pointer-events-auto p-3">
          <input
            value={m.caption}
            onChange={(e) => onCaption(e.target.value)}
            placeholder="Add a caption…"
            maxLength={120}
            className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-1.5 text-xs text-white placeholder:text-white/50 backdrop-blur focus:border-primary/60 focus:outline-none"
          />
        </div>
      </div>
      {/* Always show liked heart subtly when not hovered */}
      {m.liked && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs opacity-100 transition-opacity group-hover:opacity-0">
          <Heart className="h-3.5 w-3.5" fill="oklch(0.65 0.24 25)" stroke="oklch(0.65 0.24 25)" />
        </div>
      )}
    </div>
  );
}
