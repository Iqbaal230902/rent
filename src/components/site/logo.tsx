import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden>
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6b2c" />
          <stop offset=".55" stopColor="#ff2e7e" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#lm)" />
      <circle cx="13" cy="25" r="6.5" fill="none" stroke="white" strokeWidth="2.6" />
      <circle cx="27" cy="25" r="6.5" fill="none" stroke="white" strokeWidth="2.6" />
      <path d="M13 25 L19 14 H26 L27 25 M19 14 L22 25" stroke="white" strokeWidth="2.6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="31" cy="10" r="3" fill="#b8f94a" />
    </svg>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-none">
        <span className={cn("block font-display text-[19px] font-extrabold tracking-tight", light ? "text-white" : "text-ink")}>
          pleazure<span className="text-pink">.cc</span>
        </span>
        <span className={cn("block text-[10px] font-semibold uppercase tracking-[.18em]", light ? "text-white/60" : "text-muted")}>
          Bike · Rent · Service
        </span>
      </span>
    </span>
  );
}
