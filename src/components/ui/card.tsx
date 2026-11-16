import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-3xl bg-white ring-1 ring-line shadow-pop", className)} {...props} />;
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6", className)}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h3 className="text-lg font-bold leading-tight">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function IconBubble({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white", className)}>{children}</span>
  );
}
