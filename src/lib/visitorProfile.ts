import { supabase } from "@/lib/supabaseClient";

export type VisitorProfile = {
  visitor_id: string;
  name: string;
  username: string;
  first_visit?: string;
  last_visit?: string;
  total_visits?: number;
  total_messages?: number;
  games_played?: number;
};

const LS_KEY = "vibespace.visitor.profile";

function slug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16) || "visitor";
}

function rand3() {
  return Math.floor(100 + Math.random() * 900).toString();
}

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "v-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

export function getStoredProfile(): VisitorProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as VisitorProfile;
    if (!p?.visitor_id || !p?.username) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveProfileLocal(p: VisitorProfile) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {}
}

export function clearProfileLocal() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

async function usernameTaken(username: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("visitor_profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function createProfile(name: string): Promise<VisitorProfile> {
  const cleanName = name.trim().slice(0, 40) || "Friend";
  const base = slug(cleanName);
  let username = base + rand3();
  // Try up to 5 times for uniqueness
  for (let i = 0; i < 5; i++) {
    const taken = await usernameTaken(username);
    if (!taken) break;
    username = base + rand3();
  }

  const profile: VisitorProfile = {
    visitor_id: uuid(),
    name: cleanName,
    username,
    first_visit: new Date().toISOString(),
    last_visit: new Date().toISOString(),
    total_visits: 1,
    total_messages: 0,
    games_played: 0,
  };

  try {
    await supabase.from("visitor_profiles").insert({
      visitor_id: profile.visitor_id,
      name: profile.name,
      username: profile.username,
      first_visit: profile.first_visit,
      last_visit: profile.last_visit,
      total_visits: 1,
      total_messages: 0,
      games_played: 0,
    });
  } catch (e) {
    console.warn("createProfile supabase", e);
  }

  saveProfileLocal(profile);
  return profile;
}

export async function recoverProfile(username: string): Promise<VisitorProfile | null> {
  const u = username.trim().toLowerCase();
  if (!u) return null;
  try {
    const { data } = await supabase
      .from("visitor_profiles")
      .select("*")
      .eq("username", u)
      .maybeSingle();
    if (!data) return null;
    const p: VisitorProfile = {
      visitor_id: data.visitor_id,
      name: data.name,
      username: data.username,
      first_visit: data.first_visit,
      last_visit: data.last_visit,
      total_visits: data.total_visits ?? 0,
      total_messages: data.total_messages ?? 0,
      games_played: data.games_played ?? 0,
    };
    saveProfileLocal(p);
    return p;
  } catch (e) {
    console.warn("recoverProfile", e);
    return null;
  }
}

export async function bumpVisit(p: VisitorProfile) {
  const next = { ...p, last_visit: new Date().toISOString(), total_visits: (p.total_visits ?? 0) + 1 };
  saveProfileLocal(next);
  try {
    await supabase
      .from("visitor_profiles")
      .update({ last_visit: next.last_visit, total_visits: next.total_visits })
      .eq("visitor_id", p.visitor_id);
  } catch (e) {
    console.warn("bumpVisit", e);
  }
  return next;
}

export async function incrementMessages(p: VisitorProfile) {
  const next = { ...p, total_messages: (p.total_messages ?? 0) + 1 };
  saveProfileLocal(next);
  try {
    await supabase
      .from("visitor_profiles")
      .update({ total_messages: next.total_messages })
      .eq("visitor_id", p.visitor_id);
  } catch (e) {
    console.warn("incrementMessages", e);
  }
  return next;
}

export async function incrementGames(p: VisitorProfile) {
  const next = { ...p, games_played: (p.games_played ?? 0) + 1 };
  saveProfileLocal(next);
  try {
    await supabase
      .from("visitor_profiles")
      .update({ games_played: next.games_played })
      .eq("visitor_id", p.visitor_id);
  } catch (e) {
    console.warn("incrementGames", e);
  }
  return next;
}

export async function loadRecentConversations(visitorId: string, limit = 5) {
  try {
    const { data } = await supabase
      .from("ai_conversations")
      .select("user_message, ai_response, created_at")
      .eq("visitor_id", visitorId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []).reverse();
  } catch (e) {
    console.warn("loadRecentConversations", e);
    return [];
  }
}

export async function saveConversation(
  p: VisitorProfile,
  userMessage: string,
  aiResponse: string
) {
  try {
    await supabase.from("ai_conversations").insert({
      visitor_id: p.visitor_id,
      visitor_name: p.name,
      username: p.username,
      user_message: userMessage.slice(0, 4000),
      ai_response: aiResponse.slice(0, 8000),
    });
  } catch (e) {
    console.warn("saveConversation", e);
  }
}
