import type { Metadata } from "next";
import { getPublicModels } from "@/lib/catalog";
import { getPublicContext } from "@/lib/public-context";
import { CatalogBrowser } from "@/components/site/catalog-browser";
import { windowFromQuery } from "@/lib/window";
import { CATEGORY_ORDER, type Category } from "@/lib/constants";

export const metadata: Metadata = { title: "Katalog & stok sepeda" };

export default async function CatalogPage({ searchParams }: PageProps<"/sepeda">) {
  const sp = await searchParams;
  const [{ rules, todayDate, initialWindow }, models] = await Promise.all([getPublicContext(), getPublicModels()]);
  const k = typeof sp.kategori === "string" ? sp.kategori.toUpperCase() : "";
  const initialCategory = (CATEGORY_ORDER as string[]).includes(k) ? (k as Category) : "ALL";

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-pink/20 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6">
        <p className="inline-flex rounded-full bg-orange/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-orange">
          Stok real-time
        </p>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">
          Katalog <span className="text-brand">sepeda</span>
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Atur jam ambil & kembali, lalu lihat sisa unit tiap model. Unit yang sedang maintenance tidak dihitung.
        </p>
        <div className="mt-8">
          <CatalogBrowser
            models={models}
            rules={rules}
            initialWindow={windowFromQuery(sp, initialWindow)}
            initialCategory={initialCategory}
            todayDate={todayDate}
          />
        </div>
      </div>
    </div>
  );
}
