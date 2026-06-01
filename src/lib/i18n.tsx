import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const dict = {
  en: {
    nav_about: "About",
    nav_teachers: "Teachers",
    nav_friends: "Circle",
    nav_memories: "Memories",
    nav_projects: "Projects",
    nav_contact: "Contact",
    nav_notes: "Notes",

    about_me: "About Me",
    my_circle: "My Circle",
    memories: "Memories",
    my_teachers: "My Teachers",
    my_projects: "My Projects",
    leave_note: "Leave a Note",
    school_history: "School History",
    hobbies: "Hobbies",
    contact: "Contact",

    upload_mode_active: "Upload Mode Active",
    locked: "Locked",
    no_memories: "No memories yet. Add your first one! ✨",
    visited_leave: "Visited my site? Leave your mark!",
    websites_vibes: "Websites I built with vibes",
    visit_site: "Visit Site",
    add_project: "Add Project",
    post_note: "Post Note",
    no_notes: "No notes yet. Be the first! ✨",

    teacher_quote: "A great teacher lights the way",
    subj_chemistry: "Chemistry",
    subj_physics: "Physics",
    subj_biology: "Biology",
    subj_english: "English",
    teachers_subtitle: "The ones who shaped who I am",
    memories_subtitle: "Moments I never want to forget",
    projects_subtitle: "Websites I built with vibes",
    circle_subtitle: "The people who make ordinary days unforgettable",

    your_name: "Your name",
    your_note: "Your note...",
    posted: "posted",
    drop_memories: "Drop your memories here, or click to upload",
    processing: "Processing your memories…",
    clear_all: "Clear all memories",
    loading: "Loading…",
  },
  hi: {
    nav_about: "बारे में",
    nav_teachers: "शिक्षक",
    nav_friends: "दोस्त",
    nav_memories: "यादें",
    nav_projects: "प्रोजेक्ट्स",
    nav_contact: "संपर्क",
    nav_notes: "नोट्स",

    about_me: "मेरे बारे में",
    my_circle: "मेरे दोस्त",
    memories: "यादें",
    my_teachers: "मेरे शिक्षक",
    my_projects: "मेरे प्रोजेक्ट्स",
    leave_note: "एक नोट छोड़ो",
    school_history: "स्कूल का सफर",
    hobbies: "शौक",
    contact: "संपर्क",

    upload_mode_active: "अपलोड मोड चालू",
    locked: "लॉक्ड",
    no_memories: "अभी कोई यादें नहीं ✨",
    visited_leave: "मेरी साइट पर आए? कुछ लिख जाओ!",
    websites_vibes: "वो साइट्स जो मैंने बनाई",
    visit_site: "साइट देखो",
    add_project: "प्रोजेक्ट जोड़ो",
    post_note: "नोट डालो",
    no_notes: "अभी कोई नोट नहीं ✨",

    teacher_quote: "एक अच्छा शिक्षक राह दिखाता है",
    subj_chemistry: "रसायन विज्ञान",
    subj_physics: "भौतिक विज्ञान",
    subj_biology: "जीव विज्ञान",
    subj_english: "अंग्रेज़ी",
    teachers_subtitle: "जिन्होंने मुझे आज जैसा बनाया",
    memories_subtitle: "वो पल जिन्हें भूलना नहीं चाहता",
    projects_subtitle: "वो साइट्स जो मैंने बनाई",
    circle_subtitle: "वो लोग जो साधारण दिनों को खास बनाते हैं",

    your_name: "तुम्हारा नाम",
    your_note: "तुम्हारा नोट...",
    posted: "पोस्ट किया",
    drop_memories: "यहाँ अपनी यादें छोड़ो, या क्लिक करके अपलोड करो",
    processing: "यादें प्रोसेस हो रही हैं…",
    clear_all: "सारी यादें हटा दो",
    loading: "लोड हो रहा है…",
  },
} as const;

type Key = keyof typeof dict.en;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
}

const LangCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [fading, setFading] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem("piyush.lang");
      if (v === "en" || v === "hi") setLangState(v);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (lang === "hi") {
      document.documentElement.style.setProperty("--font-body", '"Hind", "Noto Sans Devanagari", "Inter", sans-serif');
    } else {
      document.documentElement.style.setProperty("--font-body", '"Inter", sans-serif');
    }
  }, [lang]);

  const setLang = (l: Lang) => {
    if (l === lang) return;
    setFading(true);
    setTimeout(() => {
      setLangState(l);
      try { localStorage.setItem("piyush.lang", l); } catch { /* ignore */ }
      setTimeout(() => setFading(false), 30);
    }, 180);
  };

  const t = (k: Key) => dict[lang][k] ?? dict.en[k] ?? k;

  return (
    <LangCtx.Provider value={{ lang, setLang, t }}>
      <div style={{ opacity: fading ? 0 : 1, transition: "opacity .2s ease" }}>{children}</div>
    </LangCtx.Provider>
  );
}

export const useT = () => useContext(LangCtx);

export function LanguageToggle() {
  const { lang, setLang } = useT();
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-1 py-1 text-xs backdrop-blur">
      <span className="px-1.5 text-muted-foreground">🌐</span>
      <button
        onClick={() => setLang("en")}
        className="rounded-full px-2.5 py-1 font-semibold transition-colors"
        style={{
          background: lang === "en" ? "var(--primary)" : "transparent",
          color: lang === "en" ? "var(--primary-foreground)" : "var(--muted-foreground)",
        }}
      >
        EN
      </button>
      <button
        onClick={() => setLang("hi")}
        className="rounded-full px-2.5 py-1 font-semibold transition-colors"
        style={{
          background: lang === "hi" ? "var(--primary)" : "transparent",
          color: lang === "hi" ? "var(--primary-foreground)" : "var(--muted-foreground)",
        }}
      >
        हिं
      </button>
    </div>
  );
}
