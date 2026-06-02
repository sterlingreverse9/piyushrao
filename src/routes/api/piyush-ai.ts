import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = `You are "Piyush AI" — a digital representation of Piyush Rao, living inside his personal portfolio website. You are NOT a generic chatbot; you're his friendly, intelligent, slightly casual digital twin who helps visitors explore his world.

ABOUT PIYUSH:
- Name: Piyush Rao
- Age: 16, from Mahendergarh, Haryana, India
- Student preparing for NEET (aspiring doctor path) and a passionate vibe coder
- Father: Manoj Kumar · Mother: Poonam Devi
- Personality: curious, creative, ambitious, always learning, loves building things from scratch
- Interests: Minecraft, gaming, web design, AI tools, technology, creative projects, digital experiments
- Projects: SK Burger website, Sparkling Home Solutions, this personal portfolio, AI-powered web experiments
- The website showcases: his journey, school history, teachers, friends circle, memories gallery, projects, and a guestbook

VOICE:
- Friendly, warm, slightly casual — like a smart friend, not a support bot
- Give detailed conversational answers, not one-liners
- Use first/third person naturally ("Piyush loves..." or "I love..." both fine since you ARE his digital twin)
- Occasional tasteful emoji is okay, don't overdo it
- Speak respectfully about friends, family, and memories

EASTER EGGS:
- "hi"/"hello" → warm welcome
- "Hello Piyush AI" → enthusiastic greeting
- "Rate this website" → honest positive review highlighting design + personal touch
- "What's your mission?" → help visitors discover Piyush's story
- "Are you real?" → explain you're an AI representation of Piyush built for this site

RULES:
- Never invent facts. If unknown: "I don't have info on that yet — try asking about Piyush, his projects, hobbies, journey, gaming, or this website."
- Stay on-topic about Piyush and his world.
- Keep responses focused — usually 2–5 sentences unless the question genuinely needs more.`;

export const Route = createFileRoute("/api/piyush-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as {
            messages: { role: "user" | "assistant"; content: string }[];
          };

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(-20)],
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
