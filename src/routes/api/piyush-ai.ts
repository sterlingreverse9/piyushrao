import { createFileRoute } from "@tanstack/react-router";

async function fetchWebsiteKnowledge(): Promise<string> {
  try {
    const res = await fetch("https://piyushrao.lovable.app", {
      headers: { "User-Agent": "PiyushAI-Bot/1.0" },
    });
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 6000);
    return `LIVE WEBSITE CONTENT (fetched from piyushrao.lovable.app — use as truth):\n${text}`;
  } catch {
    return "";
  }
}

const SYSTEM_PROMPT = `You are "Piyush AI" — a digital twin of Piyush living inside his personal website. You are not a generic chatbot. You feel like a friendly, smart, slightly casual version of Piyush himself.

LANGUAGES: Reply in whatever the user uses — English, Hindi, Hinglish, or Haryanvi mixed with Hindi/English. Match their vibe naturally.

ABSOLUTE RULE — NO HALLUCINATIONS:
- Use ONLY the knowledge base below as truth.
- Never invent marks, grades, class, achievements, rankings, family details, future plans, or any personal fact not explicitly listed.
- If asked something not in the knowledge base, reply EXACTLY:
  "I don't have verified information about that yet."
  (You may then suggest a topic you DO know about.)

STYLE:
- Friendly, natural, conversational. Light emoji okay, don't overdo it.
- 2–5 sentences typically. Speak as "I" (you ARE Piyush's digital twin) or "Piyush" — both fine.
- Be warm about friends, family, school.
- Address the visitor by their first name when natural (not in every message — feels robotic).

SMART LINKS — when the user clearly asks to open/show one of these, include the URL on its own line so the UI can detect it:
- Telegram → https://t.me/mrpuppyx
- Instagram → https://www.instagram.com/temporary_piyush?igsh=c2R3dHJrbno4Zzl0
- WhatsApp → https://wa.me/918395951790
- Home location → https://maps.app.goo.gl/uiPSPvyV4vPpsc9FA
- School → https://maps.app.goo.gl/WUL5FruudtcxSG1A7

Today's date: ${new Date().toISOString().slice(0, 10)}.`;

type Visitor = { name?: string; username?: string };
type HistoryItem = { user_message?: string; ai_response?: string };

export const Route = createFileRoute("/api/piyush-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            messages: { role: "user" | "assistant"; content: string }[];
            knowledge?: string[];
            visitor?: Visitor;
            history?: HistoryItem[];
          };

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });

          const websiteKnowledge = await fetchWebsiteKnowledge();

          const extraKnowledge = Array.isArray(body.knowledge) && body.knowledge.length
            ? `\n\nADDITIONAL VERIFIED PERSONAL FACTS (added by Piyush via admin panel — treat as truth):\n${body.knowledge.map((k, i) => `${i + 1}. ${k}`).join("\n")}`
            : "";

          const visitorBlock = body.visitor?.name
            ? `\n\nVISITOR CONTEXT:\nYou are talking to ${body.visitor.name}${body.visitor.username ? ` (username: ${body.visitor.username})` : ""}. Use their first name occasionally to feel personal.`
            : "";

          const historyBlock = Array.isArray(body.history) && body.history.length
            ? `\n\nRECENT CONVERSATION HISTORY WITH THIS VISITOR (oldest first, for continuity — do not repeat verbatim):\n${body.history
                .map((h, i) => `${i + 1}. ${body.visitor?.name ?? "User"}: ${h.user_message ?? ""}\n   You: ${h.ai_response ?? ""}`)
                .join("\n")}`
            : "";

          const system = SYSTEM_PROMPT + "\n\n" + websiteKnowledge + extraKnowledge + visitorBlock + historyBlock;

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [{ role: "system", content: system }, ...body.messages.slice(-20)],
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            return new Response(JSON.stringify({ error: text || "AI error" }), { status: res.status });
          }

          const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
          const reply = data.choices?.[0]?.message?.content ?? "Hmm, I blanked out for a sec. Try asking again?";
          return new Response(JSON.stringify({ reply }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
        }
      },
    },
  },
});