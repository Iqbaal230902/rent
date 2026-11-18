import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "pleazure.cc — Sewa Sepeda di Sukabumi",
    template: "%s · pleazure.cc",
  },
  description:
    "Sewa road bike, MTB, e-bike & sepeda lipat di Sukabumi. Cek stok real-time, booking online, invoice ber-QR, ambil di Jl. Baldes No.2.",
};

export const viewport: Viewport = {
  themeColor: "#160f2e",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={`${jakarta.variable} ${bricolage.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
