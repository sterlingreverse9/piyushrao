import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/sarvam-tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { text } = (await request.json()) as { text?: string };
          if (!text || typeof text !== "string") {
            return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });
          }

          const key = process.env.SARVAM_API_KEY;
          if (!key) {
            return new Response(JSON.stringify({ error: "Missing SARVAM_API_KEY" }), { status: 500 });
          }

          // Sarvam has a per-input character limit; trim defensively
          const input = text.slice(0, 1500);

          const res = await fetch("https://api.sarvam.ai/text-to-speech", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api-subscription-key": key,
            },
            body: JSON.stringify({
              inputs: [input],
              target_language_code: "hi-IN",
              speaker: "shubh",
              model: "bulbul:v3",
              enable_preprocessing: true,
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            console.error("Sarvam TTS error", res.status, errText);
            return new Response(JSON.stringify({ error: `Sarvam ${res.status}` }), { status: 502 });
          }

          const data = (await res.json()) as { audios?: string[] };
          const audio = data.audios?.[0];
          if (!audio) {
            return new Response(JSON.stringify({ error: "No audio returned" }), { status: 502 });
          }

          return new Response(JSON.stringify({ audio }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("Sarvam TTS handler crash", e);
          return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
        }
      },
    },
  },
});
