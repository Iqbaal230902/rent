import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { ScanStation } from "@/components/admin/scan-station";

export const metadata: Metadata = { title: "Scan QR" };

export default async function ScanPage({ searchParams }: PageProps<"/admin/scan">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  return (
    <>
      <PageTitle title="Scan QR" subtitle="Check-in saat pelanggan mengambil, check-out saat sepeda kembali." />
      <ScanStation initialQuery={q} />
    </>
  );
}
