import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zvrejtmpozryxttyxyxr.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cmVqdG1wb3pyeXh0dHl4eXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxODIyNjgsImV4cCI6MjA5NTc1ODI2OH0.rvwcBbfdLygBwjC1TBKVn_i5sVtsXcXWNiFSxc4dN-Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export const BUCKETS = {
  memories: "memories",
  friends: "friend-photos",
  teachers: "teacher-photos",
} as const;

export function publicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function compressImage(file: File, maxW = 1200, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("read"));
    r.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", quality);
      };
      img.src = r.result as string;
    };
    r.readAsDataURL(file);
  });
}
