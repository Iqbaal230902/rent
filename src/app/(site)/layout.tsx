import { Navbar } from "@/components/site/navbar";
import { MobileBottomNav } from "@/components/site/mobile-bottom-nav";
import { SiteFooter } from "@/components/site/site-footer";
import { getSettings } from "@/lib/settings";
import { SmoothScroll } from "@/components/motion/smooth-scroll";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const s = await getSettings();
  return (
    <SmoothScroll>
      <Navbar />
      <main className="flex-1">{children}</main>
      <SiteFooter openTime={s.openTime} closeTime={s.closeTime} whatsapp={s.whatsappNumber} />
      <MobileBottomNav />
    </SmoothScroll>
  );
}
