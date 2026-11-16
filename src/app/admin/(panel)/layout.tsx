import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/auth";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Dashboard pleazure.cc" }, robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaffPage();
  return (
    <div className="flex min-h-dvh bg-[#f6f3fb]">
      <AdminSidebar name={user.name} role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav role={user.role} name={user.name} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}
