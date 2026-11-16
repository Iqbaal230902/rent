import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  info: { cls: "bg-sky-50 text-sky-900 ring-sky-200", Icon: Info },
  success: { cls: "bg-emerald-50 text-emerald-900 ring-emerald-200", Icon: CheckCircle2 },
  warn: { cls: "bg-amber-50 text-amber-900 ring-amber-200", Icon: AlertTriangle },
  error: { cls: "bg-rose-50 text-rose-900 ring-rose-200", Icon: XCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const { cls, Icon } = tones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-2xl p-4 ring-1 ring-inset", cls, className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="text-sm leading-relaxed">
        {title && <p className="font-bold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
