import { useEffect, useState } from "react";
import { ExternalLink, Plus, Trash2, X, Rocket, Loader2 } from "lucide-react";
import { useLock } from "@/components/LockControl";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";

type Project = {
  id: string;
  name: string;
  description: string;
  url: string;
  tags: string[];
};

const gradients = [
  "linear-gradient(135deg, oklch(0.45 0.20 30), oklch(0.40 0.18 60))",
  "linear-gradient(135deg, oklch(0.45 0.20 200), oklch(0.40 0.18 240))",
  "linear-gradient(135deg, oklch(0.45 0.20 320), oklch(0.40 0.18 290))",
  "linear-gradient(135deg, oklch(0.45 0.20 150), oklch(0.40 0.18 180))",
];

function initials(n: string) {
  return n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function ProjectsSection() {
  const { t } = useT();
  const { unlocked, lockUI } = useLock("piyush.projects.unlocked");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setProjects((data || []).map((p: any) => ({ ...p, tags: p.tags || [] })));
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const add = async (p: Omit<Project, "id">) => {
    await supabase.from("projects").insert([{ name: p.name, description: p.description, url: p.url, tags: p.tags }]);
    await fetch();
    setOpen(false);
  };

  const remove = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    setProjects((cur) => cur.filter((p) => p.id !== id));
  };

  return (
    <section id="projects" className="relative px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="reveal-on-scroll flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">— builds</p>
            <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("my_projects")} 🚀</h2>
            <p className="mt-2 text-muted-foreground italic">{t("projects_subtitle")}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 pt-2">
            {lockUI}
            {unlocked && (
              <button onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:shadow-[var(--shadow-glow)]">
                <Plus className="h-3.5 w-3.5" /> {t("add_project")}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="mt-12 flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
          </div>
        ) : (
          <div className="reveal-on-scroll mt-12 grid gap-6 sm:grid-cols-2">
            {projects.map((p, i) => (
              <ProjectCard key={p.id} p={p} gradient={gradients[i % gradients.length]} admin={unlocked} onDelete={() => remove(p.id)} t={t} />
            ))}
          </div>
        )}
      </div>

      {open && <AddProjectModal onClose={() => setOpen(false)} onAdd={add} />}
    </section>
  );
}

function ProjectCard({ p, gradient, admin, onDelete, t }: {
  p: Project; gradient: string; admin: boolean; onDelete: () => void; t: (k: any) => string;
}) {
  return (
    <div className="glass glass-hover relative flex flex-col overflow-hidden p-0"
      style={{ animation: "reveal .6s ease-out both" }}>
      <div className="flex h-32 items-center justify-center" style={{ background: gradient }}>
        <span className="font-display text-5xl font-extrabold text-white drop-shadow-lg">{initials(p.name)}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-bold">{p.name}</h3>
        <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary">{tag}</span>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2">
          {p.url ? (
            <a href={p.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]">
              {t("visit_site")} <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
              <Rocket className="h-3 w-3" /> Coming soon
            </span>
          )}
          {admin && (
            <button onClick={onDelete} aria-label="Delete project"
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddProjectModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Omit<Project, "id">) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      description: description.trim(),
      url: url.trim(),
      tags: tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="glass relative w-full max-w-md p-6">
        <button type="button" onClick={onClose} aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
        <h3 className="font-display text-xl font-bold">Add Project</h3>
        <div className="mt-5 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" required
            className="w-full rounded-xl border border-border bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-primary/60" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" rows={3}
            className="w-full rounded-xl border border-border bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-primary/60" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com"
            className="w-full rounded-xl border border-border bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-primary/60" />
          <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="Tags (comma separated)"
            className="w-full rounded-xl border border-border bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-primary/60" />
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/40">Cancel</button>
          <button type="submit" className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:shadow-[var(--shadow-glow)]">Add</button>
        </div>
      </form>
    </div>
  );
}