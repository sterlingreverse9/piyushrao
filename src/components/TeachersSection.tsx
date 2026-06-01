import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { useLock } from "@/components/LockControl";
import { supabase, BUCKETS, publicUrl, compressImage } from "@/lib/supabaseClient";
import { useT } from "@/lib/i18n";

type Teacher = { name: string; subjectKey: "subj_chemistry" | "subj_physics" | "subj_biology" | "subj_english"; emoji: string };

const TEACHERS: Teacher[] = [
  { name: "Anil Yadav", subjectKey: "subj_chemistry", emoji: "🧪" },
  { name: "Manoj Gupta", subjectKey: "subj_physics", emoji: "⚛️" },
  { name: "Lalit Kumar", subjectKey: "subj_biology", emoji: "🌿" },
  { name: "Sandeep Kumar", subjectKey: "subj_english", emoji: "📖" },
];

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function TeachersSection() {
  const { t } = useT();
  const { unlocked, lockUI } = useLock("piyush.teachers.unlocked");
  const [photos, setPhotos] = useState<Record<string, { path: string; url: string }>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.storage.from(BUCKETS.teachers).list("", { limit: 100 });
    const next: Record<string, { path: string; url: string }> = {};
    for (const teacher of TEACHERS) {
      const prefix = slug(teacher.name) + ".";
      const f = (data || []).find((x) => x.name.startsWith(prefix));
      if (f) next[teacher.name] = { path: f.name, url: publicUrl(BUCKETS.teachers, f.name) + `?v=${f.updated_at || f.created_at || ""}` };
    }
    setPhotos(next); setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const upload = async (teacher: Teacher, file: File) => {
    try {
      const blob = await compressImage(file, 600, 0.88);
      const path = `${slug(teacher.name)}.jpg`;
      // remove previous variants then upload fresh
      await supabase.storage.from(BUCKETS.teachers).remove([path]);
      const { error } = await supabase.storage.from(BUCKETS.teachers).upload(path, blob, {
        contentType: "image/jpeg", upsert: true,
      });
      if (error) { console.warn(error); return; }
      await refresh();
    } catch (e) { console.warn(e); }
  };

  const remove = async (teacher: Teacher) => {
    const p = photos[teacher.name];
    if (!p) return;
    await supabase.storage.from(BUCKETS.teachers).remove([p.path]);
    setPhotos((cur) => { const n = { ...cur }; delete n[teacher.name]; return n; });
  };

  return (
    <section id="teachers" className="relative px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="reveal-on-scroll flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">— gurus</p>
            <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("my_teachers")} 🙏</h2>
            <p className="mt-2 text-muted-foreground italic">{t("teachers_subtitle")}</p>
          </div>
          <div className="shrink-0 pt-2">{lockUI}</div>
        </div>

        {loading ? (
          <div className="mt-12 flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("loading")}
          </div>
        ) : (
          <div className="reveal-on-scroll mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEACHERS.map((teacher) => (
              <TeacherCard
                key={teacher.name}
                teacher={teacher}
                subjectLabel={t(teacher.subjectKey)}
                quote={t("teacher_quote")}
                photo={photos[teacher.name]?.url}
                admin={unlocked}
                onUpload={(f) => upload(teacher, f)}
                onRemove={() => remove(teacher)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TeacherCard({
  teacher, subjectLabel, quote, photo, admin, onUpload, onRemove,
}: {
  teacher: Teacher; subjectLabel: string; quote: string; photo?: string;
  admin: boolean; onUpload: (f: File) => void; onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      className="relative flex flex-col items-center rounded-2xl p-6 text-center transition-all hover:-translate-y-1"
      style={{
        background: "linear-gradient(160deg, oklch(0.18 0.05 260), oklch(0.13 0.04 270))",
        border: "1px solid oklch(0.78 0.16 90 / 0.35)",
        boxShadow: "0 12px 40px -20px oklch(0.78 0.16 90 / 0.35)",
      }}
    >
      <div
        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full"
        style={{ boxShadow: "0 0 0 2px oklch(0.85 0.16 90 / 0.6)", background: "linear-gradient(135deg, oklch(0.40 0.18 280), oklch(0.30 0.15 260))" }}
      >
        {photo ? (
          <img src={photo} alt={teacher.name} className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-4xl font-extrabold text-white">{teacher.name.charAt(0)}</span>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-bold text-foreground">{teacher.name}</h3>
      <span
        className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ background: "oklch(0.78 0.16 90 / 0.15)", color: "oklch(0.88 0.16 90)", border: "1px solid oklch(0.78 0.16 90 / 0.35)" }}
      >
        <span>{teacher.emoji}</span>
        {subjectLabel}
      </span>
      <p className="mt-3 text-xs italic text-muted-foreground">"{quote}"</p>

      {admin && (
        <>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
          <div className="absolute bottom-3 right-3 flex flex-col gap-2">
            <button onClick={() => inputRef.current?.click()} aria-label={`Upload photo for ${teacher.name}`}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110">
              <Camera className="h-4 w-4" />
            </button>
            {photo && (
              <button onClick={onRemove} aria-label={`Remove photo for ${teacher.name}`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-white shadow-lg transition-transform hover:scale-110">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
