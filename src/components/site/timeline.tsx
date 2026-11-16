import { Check, X } from "lucide-react";
import type { TimelineStep } from "@/lib/views";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const COLORS = ["#ff6b2c", "#ff2e7e", "#7c3aed", "#16a34a"];

export function StatusTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative grid gap-0">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const color = s.state === "fail" ? "#e11d48" : COLORS[i % COLORS.length];
        return (
          <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                className={cn("absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5", s.state === "done" ? "" : "bg-line")}
                style={s.state === "done" ? { background: color } : undefined}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white ring-4 ring-white",
                s.state === "todo" && "bg-line text-muted",
                s.state === "current" && "animate-pulse",
              )}
              style={s.state !== "todo" ? { background: color } : undefined}
            >
              {s.state === "fail" ? <X className="h-4 w-4" /> : s.state === "done" ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <div className="pt-1">
              <p className={cn("font-bold", s.state === "todo" && "text-muted")}>{s.label}</p>
              <p className="text-sm text-muted">
                {s.at ? fmtDateTime(s.at) : s.state === "current" ? "Langkah berikutnya" : "—"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
