import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  brand:
    "bg-brand text-white shadow-[0_10px_24px_-10px_rgba(255,46,126,.7)] hover:brightness-110 hover:shadow-[0_14px_28px_-10px_rgba(255,46,126,.8)]",
  ink: "bg-ink text-white hover:bg-ink-2",
  lime: "bg-lime text-ink hover:brightness-95",
  outline: "bg-white text-ink ring-1 ring-inset ring-line hover:ring-ink/30 hover:bg-white",
  ghost: "text-ink hover:bg-ink/5",
  danger: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-100",
  success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_10px_24px_-12px_rgba(16,185,129,.9)]",
} as const;

const sizes = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-11 px-5 text-sm rounded-2xl gap-2",
  lg: "h-13 px-7 text-base rounded-2xl gap-2.5",
  icon: "h-10 w-10 rounded-xl",
} as const;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
};

export function buttonClass(variant: keyof typeof variants = "brand", size: keyof typeof sizes = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
    variants[variant],
    sizes[size],
    extra,
  );
}

export function Button({ variant = "brand", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
