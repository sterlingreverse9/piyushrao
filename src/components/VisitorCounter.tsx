import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const SESSION_KEY = "piyush.visitor.session";

function makeSessionId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let sid = sessionStorage.getItem(SESSION_KEY);
        if (!sid) {
          sid = makeSessionId();
          sessionStorage.setItem(SESSION_KEY, sid);
          await supabase.from("visitors").insert({ session_id: sid });
        }
        const { count: c } = await supabase
          .from("visitors")
          .select("*", { count: "exact", head: true });
        if (!cancelled && typeof c === "number") setCount(c);
      } catch (e) {
        console.warn("visitor counter", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null) return null;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs backdrop-blur"
      style={{
        borderColor: "oklch(1 0 0 / 0.1)",
        background: "oklch(0.13 0.02 285 / 0.6)",
        color: "var(--muted-foreground)",
      }}
    >
      <Users className="h-3.5 w-3.5 text-primary" />
      <span>
        <span className="text-foreground font-semibold">
          {count.toLocaleString()}
        </span>{" "}
        visitors
      </span>
    </div>
  );
}
