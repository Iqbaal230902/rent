"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bike, ClipboardList, LayoutDashboard, LogOut, ScanLine, Settings2 } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, color: "bg-orange", adminOnly: false },
  { href: "/admin/booking", label: "Booking", icon: ClipboardList, color: "bg-pink", adminOnly: false },
  { href: "/admin/scan", label: "Scan QR", icon: ScanLine, color: "bg-lime text-ink", adminOnly: false },
  { href: "/admin/armada", label: "Armada & Tarif", icon: Bike, color: "bg-violet", adminOnly: true },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings2, color: "bg-sky text-ink", adminOnly: true },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
}

async function logout(router: ReturnType<typeof useRouter>) {
  await fetch("/api/auth/logout", { method: "POST" });
  router.replace("/admin/login");
  router.refresh();
}

export function AdminSidebar({ name, role }: { name: string; role: "ADMIN" | "STAFF" }) {
  const isActive = useActive();
  const router = useRouter();
  const items = ITEMS.filter((i) => role === "ADMIN" || !i.adminOnly);
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-hidden bg-ink p-4 text-white lg:flex">
      <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-pink/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-violet/40 blur-3xl" />
      <Link href="/admin" className="relative px-2 py-3">
        <Logo light />
      </Link>
      <nav className="relative mt-6 grid gap-1">
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                active ? "bg-white text-ink shadow-pop" : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <span className={cn("grid h-8 w-8 place-items-center rounded-xl text-white", it.color)}>
                <it.icon className="h-4 w-4" />
              </span>
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="relative mt-auto rounded-2xl bg-white/10 p-3">
        <p className="truncate text-sm font-bold">{name}</p>
        <p className="text-xs text-white/60">{role === "ADMIN" ? "Admin / Pemilik" : "Staf Store"}</p>
        <button
          onClick={() => logout(router)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2 text-xs font-bold hover:bg-white/20"
        >
          <LogOut className="h-3.5 w-3.5" /> Keluar
        </button>
      </div>
    </aside>
  );
}

export function AdminMobileNav({ role, name }: { role: "ADMIN" | "STAFF"; name: string }) {
  const isActive = useActive();
  const router = useRouter();
  const items = ITEMS.filter((i) => role === "ADMIN" || !i.adminOnly);
  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-ink px-4 text-white lg:hidden">
        <Logo light />
        <button onClick={() => logout(router)} className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">
          <LogOut className="h-3.5 w-3.5" /> {name.split(" ")[0]}
        </button>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <Link key={it.href} href={it.href} className="flex flex-col items-center gap-1 py-2 text-[11px] font-bold">
              <span
                className={cn(
                  "grid h-9 w-12 place-items-center rounded-2xl transition",
                  active ? cn(it.color, "text-white") : "text-muted",
                )}
              >
                <it.icon className="h-5 w-5" />
              </span>
              <span className={active ? "text-ink" : "text-muted"}>{it.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
