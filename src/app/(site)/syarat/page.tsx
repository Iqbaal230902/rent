import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { TermsList } from "@/components/site/terms";

export const metadata: Metadata = { title: "Syarat & ketentuan sewa" };

export default async function TermsPage() {
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      <p className="inline-flex rounded-full bg-violet/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-violet">
        Syarat & ketentuan
      </p>
      <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Aturan sewa sepeda</h1>
      <p className="mt-3 text-lg text-muted">
        Berlaku untuk semua sewa di Pleazure Cycling Culture. Jam operasional {settings.openTime.replace(":", ".")}–
        {settings.closeTime.replace(":", ".")} WIB; jam ambil & kembali harus di dalam jam operasional.
      </p>
      <div className="mt-8">
        <TermsList settings={settings} />
      </div>
    </div>
  );
}
