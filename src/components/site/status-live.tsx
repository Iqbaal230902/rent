"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** Polling status booking; begitu status berubah (mis. PAID), halaman di-refresh → invoice tampil. */
export function StatusAutoRefresh({ token, status, intervalMs = 5000 }: { token: string; status: string; intervalMs?: number }) {
  const router = useRouter();
  const current = useRef(status);
  useEffect(() => {
    current.current = status;
  }, [status]);
  useEffect(() => {
    if (!["PENDING_PAYMENT", "PAID", "IN_USE"].includes(status)) return;
    const id = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/bookings/${token}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status !== current.current) router.refresh();
      } catch {
        /* abaikan */
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [token, status, intervalMs, router]);
  return null;
}

export function Countdown({ to, className }: { to: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  if (now === null) return <span className={className}>…</span>;
  const ms = Math.max(0, new Date(to).getTime() - now);
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className={cn("tabular-nums", className)}>
      {d > 0 && `${d} hari `}
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

export function CopyButton({ text, label = "Salin", className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard tidak tersedia */
        }
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl bg-ink/5 px-2.5 py-1.5 text-xs font-bold text-ink transition hover:bg-ink/10",
        className,
      )}
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {done ? "Tersalin" : label}
    </button>
  );
}
