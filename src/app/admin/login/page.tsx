import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { Logo } from "@/components/site/logo";
import { LoginForm } from "@/components/admin/login-form";
import { BikeArt } from "@/components/site/bike-art";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Login staf", robots: { index: false } };

export default async function LoginPage() {
  if (await getCurrentStaff()) redirect("/admin");
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-orange/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-violet/50 blur-3xl" />
        <Logo light className="relative" />
        <div className="relative">
          <div className="h-56 w-80 rounded-[32px] bg-white/95 p-2">
            <BikeArt category="EBIKE" />
          </div>
          <h1 className="mt-8 text-5xl font-extrabold leading-tight">
            Dashboard <span className="text-lime">store</span>.
          </h1>
          <p className="mt-3 max-w-md text-white/70">Konfirmasi bayar, scan QR check-in, hitung denda check-out, dan kelola armada — semua dari HP.</p>
        </div>
        <p className="relative text-xs text-white/40">Pleazure Cycling Culture · Jl. Baldes No.2, Sukabumi</p>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Logo className="lg:hidden" />
          <h2 className="mt-8 text-3xl font-extrabold">Masuk</h2>
          <p className="mt-1 text-muted">Khusus staf & admin Pleazure.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
