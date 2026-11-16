import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const s = await getSettings();
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter openTime={s.openTime} closeTime={s.closeTime} whatsapp={s.whatsappNumber} />
    </>
  );
}
