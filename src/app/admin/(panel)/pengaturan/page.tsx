import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { isGatewayEnabled } from "@/lib/payment";
import { PageTitle } from "@/components/admin/page-title";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  await requireStaffPage(["ADMIN"]);
  const s = await getSettings();
  return (
    <>
      <PageTitle title="Pengaturan" subtitle="Jam operasional, hold booking, denda, dan info pembayaran." />
      <SettingsForm initial={s} gatewayEnabled={isGatewayEnabled()} />
    </>
  );
}
