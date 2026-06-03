import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MemoriesGallery } from "@/components/MemoriesGallery";
import { PiyushAI } from "@/components/PiyushAI";
import { TeachersSection } from "@/components/TeachersSection";
import { ProjectsSection } from "@/components/ProjectsSection";
import { NotesSection } from "@/components/NotesSection";
import { useLock } from "@/components/LockControl";
import { LanguageToggle, useT } from "@/lib/i18n";
import { supabase, BUCKETS, publicUrl, compressImage } from "@/lib/supabaseClient";
import portrait from "@/assets/piyush-portrait.jpg";
import {
  MapPin, School, Home, Gamepad2, Code2, GraduationCap,
  Mail, Send, Instagram, Phone, Sparkles, Star,
  Stethoscope, BookOpen, Target, Heart, Camera, Trash2, Loader2
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Piyush — Gamer · Vibe Coder · Haryana" },
      { name: "description", content: "Personal space of Piyush — a 16-year-old gamer and vibe coder from Mahendergarh, Haryana." },
      { property: "og:title", content: "Piyush — Gamer · Vibe Coder" },
      { property: "og:description", content: "Personal space of Piyush — 16, from Haryana, India." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Syne:wght@500;700;800&family=Inter:wght@300;400;500;600&family=Caveat:wght@500;700&family=Dancing+Script:wght@600;700&family=Hind:wght@300;400;500;600;700&family=Noto+Sans+Devanagari:wght@300;400;500;600;700&display=swap" },
    ],
  }),
  component: Index,
});

function calcAge(dob: Date) {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.074.074 0 0 0-.079.037c-.34.6-.719 1.384-.984 2a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-1-2 .077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 5.17 4.369a.07.07 0 0 0-.032.027C2.092 8.84 1.27 13.18 1.673 17.464a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.029.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.105 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-4.95-.838-9.255-3.549-13.07a.061.061 0 0 0-.031-.028zM8.02 14.852c-1.183 0-2.157-1.086-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.334-.955 2.42-2.157 2.42zm7.974 0c-1.183 0-2.157-1.086-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.21 0 2.176 1.096 2.157 2.42 0 1.334-.946 2.42-2.157 2.42z"/>
  </svg>
);

const socials = [
  { label: "WhatsApp", detail: "+91 83959 51790", href: "https://wa.me/918395951790", Icon: Phone, color: "oklch(0.72 0.20 150)" },
  { label: "Telegram", detail: "@mrpuppyx", href: "https://telegram.me/mrpuppyx", Icon: Send, color: "oklch(0.72 0.18 230)" },
  { label: "Instagram", detail: "@temporary_piyush", href: "https://www.instagram.com/temporary_piyush?igsh=c2R3dHJrbno4Zzl0", Icon: Instagram, color: "oklch(0.68 0.24 15)" },
  { label: "Discord", detail: "piyushyadav83", href: "https://discord.com/users/piyushyadav83", Icon: DiscordIcon, color: "oklch(0.62 0.20 270)" },
  { label: "Gmail", detail: "sterlingreverse9@gmail.com", href: "mailto:sterlingreverse9@gmail.com", Icon: Mail, color: "oklch(0.70 0.20 25)" },
  { label: "Gmail", detail: "piyushmajra1975@gmail.com", href: "mailto:piyushmajra1975@gmail.com", Icon: Mail, color: "oklch(0.70 0.20 25)" },
];

const timeline = [
  { years: "LKG – 1st", name: "RRCM School", place: "Majra Kalan" },
  { years: "2nd – 3rd", name: "Alliance School", place: "Mahendergarh" },
  { years: "4th – 5th", name: "MDVN School", place: "Dublana, Narnaul" },
  { years: "6th – 7th", name: "Jawahar Navodaya Vidyalaya", place: "Karira, Kanina" },
  { years: "8th", name: "Aravali School", place: "Mahendergarh" },
  { years: "9th – 12th", name: "GMSSSS Mahendergarh", place: "Currently here", current: true },
];

const friends = [
  "Harsh", "Rohit", "Rihan", "Aditya", "Ashwani", "Vashu", "Jatin",
  "Naveen", "Lucky", "Shivam", "Happy", "Krish", "JP", "Paras",
];

const friendGradients = [
  "linear-gradient(135deg, oklch(0.45 0.18 295), oklch(0.35 0.15 320))",
  "linear-gradient(135deg, oklch(0.42 0.16 260), oklch(0.32 0.14 290))",
  "linear-gradient(135deg, oklch(0.45 0.18 340), oklch(0.35 0.16 10))",
  "linear-gradient(135deg, oklch(0.42 0.15 200), oklch(0.32 0.14 240))",
  "linear-gradient(135deg, oklch(0.45 0.16 160), oklch(0.35 0.15 200))",
  "linear-gradient(135deg, oklch(0.48 0.18 30), oklch(0.36 0.16 60))",
  "linear-gradient(135deg, oklch(0.44 0.17 280), oklch(0.34 0.14 250))",
  "linear-gradient(135deg, oklch(0.46 0.16 120), oklch(0.34 0.14 160))",
  "linear-gradient(135deg, oklch(0.45 0.18 310), oklch(0.35 0.15 340))",
  "linear-gradient(135deg, oklch(0.42 0.15 220), oklch(0.32 0.14 260))",
  "linear-gradient(135deg, oklch(0.48 0.17 50), oklch(0.36 0.15 25))",
  "linear-gradient(135deg, oklch(0.44 0.16 180), oklch(0.34 0.14 215))",
  "linear-gradient(135deg, oklch(0.46 0.18 330), oklch(0.36 0.15 295))",
  "linear-gradient(135deg, oklch(0.50 0.20 85), oklch(0.38 0.17 110))", // Paras — unique amber/lime
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal-on-scroll");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Particles() {
  const particles = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 18 + Math.random() * 22,
      delay: Math.random() * -30,
      opacity: 0.3 + Math.random() * 0.5,
    })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: "var(--primary-glow)",
            opacity: p.opacity,
            boxShadow: "0 0 8px var(--primary-glow)",
            animation: `drift ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function StickyNav() {
  const { t } = useT();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links: { href: string; key: any }[] = [
    { href: "#about", key: "nav_about" },
    { href: "#teachers", key: "nav_teachers" },
    { href: "#friends", key: "nav_friends" },
    { href: "#memories", key: "nav_memories" },
    { href: "#projects", key: "nav_projects" },
    { href: "#connect", key: "nav_contact" },
    { href: "#notes", key: "nav_notes" },
  ];
  return (
    <nav
      className="fixed inset-x-0 top-0 z-40 transition-all"
      style={{
        background: scrolled ? "oklch(0.13 0.02 285 / 0.75)" : "transparent",
        backdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
        borderBottom: scrolled ? "1px solid oklch(1 0 0 / 0.06)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 sm:px-10">
        <a href="#top" className="font-display text-xl font-bold tracking-tight">
          P<span className="text-gradient">.</span>
        </a>
        <div className="hidden gap-6 text-xs text-muted-foreground md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-foreground">{t(l.key)}</a>
          ))}
        </div>
        <LanguageToggle />
      </div>
    </nav>
  );
}

function Index() {
const [showWelcome, setShowWelcome] = useState(() => {
  const seen = localStorage.getItem("welcome_seen");
  if (seen && Date.now() - Number(seen) < 50 * 60 * 60 * 1000) return false;
  return true;
});
const [entered, setEntered] = useState(false);

const handleEnter = () => {
  setEntered(true);
  setTimeout(() => {
    const audio = document.querySelector("audio");
    if (audio) audio.play().catch(() => {});
  }, 500);
};
  useReveal();
  const { t } = useT();
  const dob = useMemo(() => new Date(2009, 6, 26), []);
  const age = calcAge(dob);
  const timelineRef = useRef<HTMLDivElement>(null);

  return (
    <div id="top" className="relative z-10 min-h-screen font-body">
      <StickyNav />
{!entered && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center"
    style={{ background: "oklch(0.08 0.02 285)" }}
  >
    <div className="relative text-center px-6">
      <div className="pointer-events-none absolute -top-32 -left-32 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "oklch(0.55 0.25 295 / 0.4)" }} />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "oklch(0.50 0.22 320 / 0.35)" }} />
      <p className="relative text-xs uppercase tracking-[0.4em] text-primary mb-4">welcome to</p>
      <h1 className="relative font-display text-[clamp(4rem,20vw,10rem)] font-extrabold leading-none tracking-tighter">
        <span className="text-gradient">Piyush's</span>
        <br />
        <span className="text-white">VibeSpace</span>
      </h1>
      <p className="relative mt-6 text-sm text-muted-foreground">
        A personal space — gaming, coding & everything in between
      </p>
      <button
        onClick={handleEnter}
        className="relative mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-primary-foreground transition-all hover:scale-105 hover:shadow-[var(--shadow-glow)]"
        style={{ background: "linear-gradient(135deg, oklch(0.60 0.25 295), oklch(0.55 0.22 320))" }}
      >
        ✨ Enter VibeSpace
      </button>
    </div>
  </div>
)}
<MusicPlayer adminPassword="qwer@$()" />
{showWelcome && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "oklch(0.08 0.02 285 / 0.85)", backdropFilter: "blur(20px)" }}
    onClick={() => { setShowWelcome(false); localStorage.setItem("welcome_seen", String(Date.now())); }}
  >
    <div
      className="relative w-full max-w-md overflow-hidden rounded-3xl p-8 text-center"
      style={{
        background: "linear-gradient(160deg, oklch(0.18 0.05 295 / 0.95), oklch(0.13 0.04 270 / 0.98))",
        border: "1px solid oklch(0.65 0.22 295 / 0.3)",
        boxShadow: "0 0 80px oklch(0.55 0.25 295 / 0.25), 0 25px 60px -15px oklch(0 0 0 / 0.6)",
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl"
        style={{ background: "oklch(0.55 0.25 295 / 0.3)" }} />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full blur-3xl"
        style={{ background: "oklch(0.50 0.22 320 / 0.25)" }} />

      <div className="relative">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "oklch(0.55 0.25 295 / 0.2)", border: "1px solid oklch(0.65 0.22 295 / 0.3)" }}>
          <span className="text-3xl">👋</span>
        </div>

        <h2 className="font-display text-3xl font-extrabold tracking-tight">
          <span className="text-gradient">Welcome!</span>
        </h2>

        <p className="mt-1 text-xs uppercase tracking-[0.3em]"
          style={{ color: "oklch(0.65 0.22 295)" }}>
          — piyush's vibespace —
        </p>

        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          Hey there! 🙌 Thanks for visiting my personal space.
          Take a look around, explore my journey, and don't forget to
          <span className="text-foreground font-medium"> leave your mark</span> at the end!
        </p>

        <a
          href="#notes"
          onClick={() => { setShowWelcome(false); localStorage.setItem("welcome_seen", String(Date.now())); }}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-foreground"
          style={{ color: "oklch(0.75 0.20 295)" }}
        >
          ✍️ Click here to go to notes directly →
        </a>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => { setShowWelcome(false); localStorage.setItem("welcome_seen", String(Date.now())); }}
            className="flex-1 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors"
            style={{ borderColor: "oklch(0.65 0.22 295 / 0.3)", color: "oklch(0.75 0.20 295)" }}
          >
            Maybe later
          </button>
          <button
            onClick={() => { setShowWelcome(false); localStorage.setItem("welcome_seen", String(Date.now())); }}
            className="flex-1 rounded-full px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]"
            style={{ background: "linear-gradient(135deg, oklch(0.60 0.25 295), oklch(0.55 0.22 320))" }}
          >
            Explore Site ✨
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* HERO */}
      <section className="relative min-h-screen overflow-hidden px-6 pt-24 pb-16 sm:px-10">
        <Particles />
        <div className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full blur-3xl animate-blob"
             style={{ background: "oklch(0.55 0.25 295 / 0.35)" }} />
        <div className="pointer-events-none absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full blur-3xl animate-blob"
             style={{ background: "oklch(0.50 0.22 320 / 0.30)", animationDelay: "-6s" }} />

        <div className="relative z-10 mx-auto mt-8 grid max-w-6xl items-center gap-12 lg:mt-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="reveal-on-scroll order-2 lg:order-1">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              hey, i'm online — welcome
            </div>
            <h1 className="font-display text-[clamp(4rem,15vw,11rem)] font-extrabold leading-[0.85] tracking-tighter">
              <span className="text-gradient">Piyush</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground sm:text-xl">
              <span className="text-foreground">{age}</span> · Gamer · Vibe Coder ·
              <span className="text-foreground"> Haryana, India</span>
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              born <span className="text-foreground/80">26 July 2009</span> — currently {age} years young
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <a href="#connect" className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:shadow-[var(--shadow-glow)]">
                Say hi <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href="#about" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium backdrop-blur transition-colors hover:border-primary/40">
                More about me
              </a>
            </div>
          </div>

          <div className="reveal-on-scroll order-1 mx-auto lg:order-2">
            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] blur-2xl"
                   style={{ background: "var(--gradient-violet)", opacity: 0.4 }} />
              <div className="relative glass overflow-hidden p-3 animate-float glow-ring">
                <img src={portrait} alt="Portrait of Piyush"
                  className="block w-[280px] rounded-2xl sm:w-[340px] lg:w-[380px]" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-xl bg-background/60 px-4 py-2.5 backdrop-blur">
                  <span className="font-display text-sm font-bold">PIYUSH</span>
                  <span className="text-xs text-muted-foreground">2026 · HR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="relative px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionTitle eyebrow="about" title={t("about_me")} />
          <div className="reveal-on-scroll mt-12 grid gap-6 md:grid-cols-3">
            <div className="glass glass-hover p-6 md:col-span-2">
              <p className="text-lg leading-relaxed text-foreground/90">
                I'm Piyush — {age}, from a small spot called <span className="text-gradient font-semibold">Majra Kalan</span> in
                Mahendergarh, Haryana. Right now I'm in <span className="text-foreground">12th standard</span> at GMSSSS Mahendergarh,
                spending my hours between schoolbooks, controllers, and chaotic late-night coding sessions.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["🎮 Gaming", "💻 Vibe Coding", "🌙 Night Owl", "🎧 Lo-fi", "✨ Building stuff"].map((tag) => (
                  <span key={tag} className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-7 border-t border-border/60 pt-5">
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-primary">
                  <Heart className="h-3 w-3" /> Family
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm">
                    <span className="text-base">👨</span>
                    <span className="text-muted-foreground">Father</span>
                    <span className="font-semibold text-foreground">Manoj Kumar</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm">
                    <span className="text-base">👩</span>
                    <span className="text-muted-foreground">Mother</span>
                    <span className="font-semibold text-foreground">Poonam Devi</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              <InfoTile icon={<Sparkles className="h-4 w-4" />} label="Age" value={`${age} years`} />
              <InfoTile icon={<MapPin className="h-4 w-4" />} label="Location" value="Mahendergarh, HR" />
              <InfoTile icon={<GraduationCap className="h-4 w-4" />} label="Class" value="12th Standard" />
            </div>
          </div>

          <div className="reveal-on-scroll mt-6 grid gap-6 sm:grid-cols-2">
            <HobbyCard Icon={Gamepad2} title="Gaming"
              text="From competitive shooters to chill story-mode nights — gaming is my reset button." />
            <HobbyCard Icon={Code2} title="Vibe Coding"
              text="Half art, half logic. I build things because the idea won't stop bugging me." />
          </div>
        </div>
      </section>

      {/* ACADEMICS */}
      <section id="academics" className="relative px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionTitle eyebrow="academics" title="Books & dreams" />
          <div className="reveal-on-scroll mt-12 grid gap-6 md:grid-cols-3">
            <div className="glass glass-hover relative overflow-hidden p-6" style={{ borderColor: "oklch(0.70 0.18 150 / 0.3)" }}>
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-3xl" style={{ background: "oklch(0.65 0.22 150)" }} />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "oklch(0.65 0.22 150 / 0.18)", color: "oklch(0.78 0.18 150)" }}>
                <GraduationCap className="h-5 w-5" />
              </div>
              <p className="relative mt-5 text-[11px] uppercase tracking-widest text-muted-foreground">10th Grade</p>
              <h3 className="relative mt-1 font-display text-4xl font-extrabold">
                <span style={{ color: "oklch(0.82 0.18 150)" }}>79.9%</span>
              </h3>
              <p className="relative mt-2 text-sm text-muted-foreground">GMSSSS Mahendergarh</p>
            </div>

            <div className="glass glass-hover p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="mt-5 text-[11px] uppercase tracking-widest text-muted-foreground">11th & 12th</p>
              <h3 className="mt-1 font-display text-2xl font-bold">Science · PCB</h3>
              <p className="mt-2 text-sm text-muted-foreground">Physics, Chemistry, Biology at GMSSSS Mahendergarh.</p>
            </div>

            <div className="glass glass-hover relative overflow-hidden p-6" style={{ borderColor: "oklch(0.70 0.18 150 / 0.4)" }}>
              <div className="absolute inset-0 opacity-25"
                style={{ background: "radial-gradient(circle at 70% 30%, oklch(0.65 0.22 150 / 0.45), transparent 60%)" }} />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "oklch(0.65 0.22 150 / 0.2)", color: "oklch(0.80 0.20 150)" }}>
                <Stethoscope className="h-5 w-5" />
              </div>
              <p className="relative mt-5 text-[11px] uppercase tracking-widest" style={{ color: "oklch(0.80 0.18 150)" }}>
                Preparing for
              </p>
              <h3 className="relative mt-1 font-display text-2xl font-bold">NEET UG 2027</h3>
              <p className="relative mt-2 text-sm text-muted-foreground">Chasing the white coat, one chapter at a time.</p>
              <div className="relative mt-5">
                <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold animate-neet-pulse"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.55 0.22 150 / 0.25), oklch(0.65 0.22 160 / 0.15))",
                    border: "1px solid oklch(0.70 0.20 150 / 0.5)",
                    color: "oklch(0.88 0.16 150)",
                  }}>
                  <Target className="h-4 w-4" /> NEET UG 2027 Aspirant
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLACES */}
      <section id="places" className="relative px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionTitle eyebrow="places" title="Where you'll find me" />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <PlaceCard Icon={Home} eyebrow="home" title="Majra Kalan" subtitle="Mahendergarh, Haryana"
              href="https://maps.app.goo.gl/uiPSPvyV4vPpsc9FA" />
            <PlaceCard Icon={School} eyebrow="school" title="GMSSSS Mahendergarh" subtitle="Currently 12th standard"
              href="https://maps.app.goo.gl/WUL5FruudtcxSG1A7" />
          </div>
        </div>
      </section>

      {/* JOURNEY / SCHOOL HISTORY */}
      <section id="journey" className="relative px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <SectionTitle eyebrow="journey" title={t("school_history")} />
          <div ref={timelineRef} className="relative mt-16 pl-8 sm:pl-12">
            <div className="absolute left-2 top-2 bottom-2 w-px origin-top sm:left-4"
              style={{
                background: "linear-gradient(to bottom, transparent, var(--primary) 15%, var(--primary-glow) 85%, transparent)",
                animation: "draw-line 1.8s ease-out forwards",
              }} />
            {timeline.map((tm, i) => (
              <div key={i} className="reveal-on-scroll relative mb-8 last:mb-0" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="absolute -left-[26px] top-4 flex h-4 w-4 items-center justify-center rounded-full sm:-left-[34px]"
                  style={{
                    background: tm.current ? "var(--primary-glow)" : "var(--primary)",
                    boxShadow: tm.current
                      ? "0 0 0 4px oklch(0.78 0.20 305 / 0.25), 0 0 20px var(--primary-glow)"
                      : "0 0 0 4px oklch(0.68 0.22 295 / 0.15)",
                  }} />
                <div className={`glass glass-hover p-5 ${tm.current ? "border-primary/40" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-primary">{tm.years}</p>
                      <h3 className="mt-1 font-display text-lg font-bold sm:text-xl">{tm.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{tm.place}</p>
                    </div>
                    {tm.current && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        <Star className="h-3 w-3 fill-current" /> now
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEACHERS */}
      <TeachersSection />

      {/* FRIENDS */}
      <FriendsSection />

      {/* MEMORIES */}
      <MemoriesGallery />

      {/* PROJECTS */}
      <ProjectsSection />

      {/* CONTACT */}
      <section id="connect" className="relative px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionTitle eyebrow="contact" title={t("contact")} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {socials.map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                className="reveal-on-scroll glass glass-hover group relative block overflow-hidden p-6"
                style={{ ["--brand" as any]: s.color }}>
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                  style={{ background: s.color }} />
                <div className="relative flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                    style={{ background: `color-mix(in oklab, ${s.color} 20%, transparent)`, color: s.color }}>
                    <s.Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">open</span>
                </div>
                <div className="relative mt-6">
                  <p className="font-display text-xl font-bold">{s.label}</p>
                  <p className="mt-1 break-all text-sm text-muted-foreground">{s.detail}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* LEAVE A NOTE */}
      <NotesSection />

      {/* SIGNATURE */}
      <section id="signature" className="relative overflow-hidden px-6 py-24 sm:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(oklch(1 0 0 / 0.6) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: "oklch(0.55 0.22 295 / 0.18)" }} />
        <div className="reveal-on-scroll relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="text-[11px] uppercase tracking-[0.35em] text-primary">signed</p>
          <div className="relative mt-6 inline-block">
            <h2 className="font-signature text-[clamp(4.5rem,16vw,7rem)] font-bold leading-none text-foreground"
              style={{
                transform: "rotate(-3deg)",
                textShadow: "0 0 30px oklch(0.78 0.20 305 / 0.45), 0 0 60px oklch(0.68 0.22 295 / 0.25)",
              }}>
              Piyush
            </h2>
            <svg viewBox="0 0 320 40" className="mx-auto -mt-2 block w-[80%] sm:w-[70%]" fill="none" style={{ transform: "rotate(-3deg)" }}>
              <path d="M5 25 C 60 5, 120 35, 180 18 S 290 30, 315 12"
                stroke="url(#sig-grad)" strokeWidth="3" strokeLinecap="round" />
              <defs>
                <linearGradient id="sig-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="oklch(0.68 0.22 295)" />
                  <stop offset="100%" stopColor="oklch(0.78 0.20 325)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            — Made with <span className="text-[oklch(0.72_0.18_240)]">💙</span> by Piyush
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-border px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <p className="font-display text-lg font-bold">Piyush</p>
            <p className="text-sm text-muted-foreground">Built with vibes ✨</p>
          </div>
          <div className="flex gap-3">
            {socials.slice(0, 3).map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-all hover:border-primary/40 hover:text-primary">
                <s.Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} · Haryana, India</p>
        </div>
      </footer>
      <PiyushAI />
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="reveal-on-scroll">
      <p className="text-xs uppercase tracking-[0.3em] text-primary">— {eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{title}</h2>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass glass-hover flex items-center gap-3 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">{icon}</div>
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function HobbyCard({ Icon, title, text }: { Icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="glass glass-hover p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-2xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function PlaceCard({ Icon, eyebrow, title, subtitle, href }: {
  Icon: React.ComponentType<{ className?: string }>;
  eyebrow: string; title: string; subtitle: string; href: string;
}) {
  return (
    <div className="reveal-on-scroll glass glass-hover flex flex-col p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
      </div>
      <h3 className="mt-5 font-display text-2xl font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="mt-6 inline-flex items-center justify-center gap-2 self-start rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-[var(--shadow-glow)]">
        <MapPin className="h-4 w-4" /> Open in Google Maps
      </a>
    </div>
  );
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function FriendsSection() {
  const { t } = useT();
  const { unlocked, lockUI } = useLock("piyush.friends.unlocked");
  const [photos, setPhotos] = useState<Record<string, { path: string; url: string }>>({});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    // setLoading(true);
    const { data } = await supabase.storage.from(BUCKETS.friends).list("", { limit: 200 });
    const next: Record<string, { path: string; url: string }> = {};
    for (const name of friends) {
      const prefix = slug(name) + ".";
      const f = (data || []).find((x) => x.name.startsWith(prefix));
      if (f) next[name] = { path: f.name, url: publicUrl(BUCKETS.friends, f.name) + `?v=${f.updated_at || f.created_at || ""}` };
    }
    setPhotos(next); setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const upload = async (name: string, file: File) => {
    try {
      const blob = await compressImage(file, 480, 0.85);
      const path = `${slug(name)}.jpg`;
      await supabase.storage.from(BUCKETS.friends).remove([path]);
      const { error } = await supabase.storage.from(BUCKETS.friends).upload(path, blob, {
        contentType: "image/jpeg", upsert: true,
      });
      if (error) console.warn(error);
      await refresh();
    } catch (e) { console.warn(e); }
  };

  const remove = async (name: string) => {
    const p = photos[name];
    if (!p) return;
    await supabase.storage.from(BUCKETS.friends).remove([p.path]);
    setPhotos((cur) => { const n = { ...cur }; delete n[name]; return n; });
  };

  return (
    <section id="friends" className="relative px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="reveal-on-scroll flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">— circle</p>
            <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">{t("my_circle")} 🤝</h2>
          </div>
          <div className="shrink-0 pt-2">{lockUI}</div>
        </div>
        <p className="reveal-on-scroll mt-4 max-w-xl text-sm text-muted-foreground">{t("circle_subtitle")}</p>

        {loading ? (
          <div className="mt-12 flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("loading")}
          </div>
        ) : (
          <div className="reveal-on-scroll mt-12 flex flex-wrap gap-4">
            {friends.map((name, i) => (
              <FriendCard key={name} name={name} gradient={friendGradients[i % friendGradients.length]}
                photo={photos[name]?.url} admin={unlocked}
                onUpload={(f) => upload(name, f)} onRemove={() => remove(name)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FriendCard({ name, gradient, photo, admin, onUpload, onRemove }: {
  name: string; gradient: string; photo?: string; admin: boolean;
  onUpload: (f: File) => void; onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="group relative flex h-32 w-32 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 p-3 transition-all duration-300 hover:-translate-y-2 hover:shadow-[var(--shadow-glow)] sm:h-36 sm:w-36"
      style={{ background: gradient }}>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(circle at 50% 0%, oklch(1 0 0 / 0.18), transparent 70%)" }} />
      {photo ? (
        <img src={photo} alt={name} className="relative h-16 w-16 rounded-full object-cover ring-2 ring-white/40 sm:h-20 sm:w-20" />
      ) : (
        <span className="relative font-display text-5xl font-extrabold text-white drop-shadow-lg sm:text-6xl">{name.charAt(0)}</span>
      )}
      <span className="relative mt-1 text-sm font-semibold text-white/90">{name}</span>

      {admin && (
        <>
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
          <div className="absolute bottom-1.5 right-1.5 flex flex-col gap-1.5">
            <button onClick={() => inputRef.current?.click()} aria-label={`Upload photo for ${name}`}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95">
              <Camera className="h-4 w-4" />
            </button>
            {photo && (
              <button onClick={onRemove} aria-label={`Remove photo for ${name}`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-white shadow-lg transition-transform active:scale-95">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
function MusicPlayer({ adminPassword }: { adminPassword: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [songs, setSongs] = useState<{ name: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const uploadRef = useRef<HTMLInputElement>(null);

  const fetchSongs = async () => {
    setLoading(true);
    const { data } = await supabase.storage.from("music").list("", { limit: 100 });
    if (data && data.length > 0) {
      const list = data.map((f) => ({
        name: f.name.replace(/\.mp3$/i, ""),
        url: supabase.storage.from("music").getPublicUrl(f.name).data.publicUrl,
      }));
      setSongs(list);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSongs(); }, []);

  useEffect(() => {
    if (audioRef.current && songs[currentIndex]) {
      audioRef.current.src = songs[currentIndex].url;
      audioRef.current.volume = volume;
      if (playing) audioRef.current.play().catch(() => {});
    }
  }, [currentIndex, songs]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setPlaying(true); }
  };

  const prev = () => setCurrentIndex((i) => (i - 1 + songs.length) % songs.length);
  const next = () => setCurrentIndex((i) => (i + 1) % songs.length);

  const unlockAdmin = () => {
    if (pwInput === adminPassword) { setAdminUnlocked(true); setAdminOpen(false); setPwError(false); setPwInput(""); }
    else { setPwError(true); }
  };

  const uploadSong = async (file: File) => {
    const path = file.name;
    await supabase.storage.from("music").upload(path, file, { upsert: true });
    await fetchSongs();
  };

  const deleteSong = async (name: string) => {
    await supabase.storage.from("music").remove([`${name}.mp3`]);
    await fetchSongs();
  };

  return (
    <>
      <audio ref={audioRef} onEnded={next} />
      <input ref={uploadRef} type="file" accept="audio/mp3,audio/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSong(f); e.target.value = ""; }} />

      <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2">
        {/* Main Player */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: "linear-gradient(135deg, oklch(0.18 0.05 295 / 0.92), oklch(0.13 0.04 270 / 0.95))",
            border: "1px solid oklch(0.65 0.22 295 / 0.3)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px oklch(0.55 0.25 295 / 0.2)",
          }}
        >
          {/* Play/Pause */}
          <button onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-full text-primary-foreground transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, oklch(0.60 0.25 295), oklch(0.55 0.22 320))" }}>
            {playing ? "⏸" : "▶"}
          </button>

          {/* Admin: Prev/Next */}
          {adminUnlocked && (
            <>
              <button onClick={prev} className="text-muted-foreground hover:text-foreground text-sm">⏮</button>
              <button onClick={next} className="text-muted-foreground hover:text-foreground text-sm">⏭</button>
            </>
          )}

          {/* Volume */}
          <input type="range" min="0" max="1" step="0.01" value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-16 accent-primary cursor-pointer" />

          {/* Admin Lock */}
          <button onClick={() => setAdminOpen(!adminOpen)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {adminUnlocked ? "🔓" : "🔒"}
          </button>
        </div>

        {/* Admin Panel */}
        {adminOpen && (
          <div className="rounded-2xl p-4"
            style={{
              background: "linear-gradient(135deg, oklch(0.18 0.05 295 / 0.95), oklch(0.13 0.04 270 / 0.98))",
              border: "1px solid oklch(0.65 0.22 295 / 0.3)",
              backdropFilter: "blur(16px)",
            }}>
            {!adminUnlocked ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Admin password</p>
                <input type="password" value={pwInput}
                  onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
                  placeholder="••••••••"
                  className="rounded-lg border border-border bg-black/30 px-3 py-1.5 text-xs outline-none focus:border-primary/60"
                  style={{ borderColor: pwError ? "red" : undefined }} />
                {pwError && <p className="text-[10px] text-red-400">Wrong password</p>}
                <div className="flex gap-2">
                  <button onClick={() => setAdminOpen(false)} className="flex-1 rounded-full border border-border px-2 py-1 text-xs">Cancel</button>
                  <button onClick={unlockAdmin} className="flex-1 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">Unlock</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-foreground">🎵 Manage Songs</p>
                {loading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : songs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No songs yet</p>
                ) : (
                  songs.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className={`truncate text-xs ${i === currentIndex ? "text-primary font-semibold" : "text-muted-foreground"}`}>{s.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => setCurrentIndex(i)} className="text-xs text-primary">▶</button>
                        <button onClick={() => deleteSong(s.name)} className="text-xs text-red-400">✕</button>
                      </div>
                    </div>
                  ))
                )}
                <button onClick={() => uploadRef.current?.click()}
                  className="rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground">
                  + Upload MP3
                </button>
                <button onClick={() => { setAdminUnlocked(false); setAdminOpen(false); }}
                  className="text-xs text-muted-foreground hover:text-foreground">Lock 🔒</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}