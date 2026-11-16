import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { BikeArt } from "@/components/site/bike-art";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="h-40 w-60">
        <BikeArt category="MTB" />
      </div>
      <h1 className="mt-4 text-4xl font-extrabold">Waduh, nyasar!</h1>
      <p className="mt-2 text-muted">Halaman yang kamu cari tidak ditemukan.</p>
      <Link href="/" className={buttonClass("brand", "md", "mt-6")}>
        Kembali ke beranda
      </Link>
    </div>
  );
}
