import type { Metadata } from "next";
import { LookupForm } from "@/components/site/lookup-form";

export const metadata: Metadata = { title: "Cek booking" };

export default function LookupPage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet/20 blur-3xl" />
      <div className="relative mx-auto max-w-md px-4 pb-24 pt-10">
        <h1 className="text-center text-4xl font-extrabold">
          Cek <span className="text-brand">booking</span>
        </h1>
        <p className="mt-3 text-center text-muted">Masukkan kode booking & nomor WhatsApp yang dipakai saat memesan.</p>
        <LookupForm />
      </div>
    </div>
  );
}
