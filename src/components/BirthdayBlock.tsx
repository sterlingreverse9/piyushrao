import { useEffect, useState } from "react";

export function BirthdayBlock({ age }: { age: number }) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isBirthday, setIsBirthday] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      let next = new Date(now.getFullYear(), 6, 26);
      if (now >= next) next = new Date(now.getFullYear() + 1, 6, 26);
      const diff = next.getTime() - now.getTime();
      const isToday = now.getMonth() === 6 && now.getDate() === 26;
      setIsBirthday(isToday);
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass p-5 rounded-2xl mt-6"
      style={{ border: "1px solid oklch(0.65 0.22 295 / 0.3)" }}>
      <p className="text-xs uppercase tracking-widest text-primary mb-3">
        🎂 {isBirthday ? "Happy Birthday Piyush! 🎉" : "Next Birthday Countdown"}
      </p>
      <div className="flex gap-3 mb-4">
        {[["Days", countdown.days], ["Hrs", countdown.hours], ["Min", countdown.minutes], ["Sec", countdown.seconds]].map(([label, val]) => (
          <div key={label} className="flex-1 rounded-xl py-3 text-center"
            style={{ background: "oklch(0.65 0.25 295 / 0.12)", border: "1px solid oklch(0.65 0.22 295 / 0.2)" }}>
            <p className="font-display text-2xl font-bold text-gradient">{String(val).padStart(2, "0")}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Currently <span className="text-foreground font-semibold">{age} years old</span> · Born 26 July 2009
      </p>
    </div>
  );
}