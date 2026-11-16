import { BOOKING_STATUS, CATEGORIES, UNIT_STATUS, type BookingStatusKey, type Category } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = BOOKING_STATUS[status as BookingStatusKey];
  if (!s) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset whitespace-nowrap",
        s.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function UnitBadge({ status }: { status: string }) {
  const s = UNIT_STATUS[status];
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset", s?.badge)}>
      {s?.label ?? status}
    </span>
  );
}

export function CategoryChip({ category, className }: { category: Category; className?: string }) {
  const c = CATEGORIES[category];
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", c.chip, className)}>
      {c.label}
    </span>
  );
}
