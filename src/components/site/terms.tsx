import { AlarmClock, Ban, CreditCard, IdCard, ShieldAlert, Timer } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { rupiah } from "@/lib/format";

export function termsItems(s: Settings) {
  return [
    {
      icon: IdCard,
      color: "#ff6b2c",
      title: "Jaminan E-KTP asli",
      body: "Saat mengambil sepeda, tunjukkan QR invoice dan titipkan E-KTP asli (atau SIM bila disetujui staf). Kami hanya mencatat jenis jaminan, tidak memfoto/menyalin KTP. Jaminan dikembalikan saat sepeda kembali.",
    },
    {
      icon: Timer,
      color: "#ff2e7e",
      title: "Batas waktu booking (hold)",
      body: `Booking yang belum dibayar menahan unit sampai ${s.holdMinutesAfterStart} menit setelah jam ambil. Lewat dari itu, booking otomatis kedaluwarsa dan unit dilepas untuk pelanggan lain.`,
    },
    {
      icon: CreditCard,
      color: "#7c3aed",
      title: "Pembayaran",
      body: "Bayar di store (tunai / QRIS toko) atau transfer bank lalu kirim bukti via WhatsApp. Status menjadi LUNAS setelah dikonfirmasi staf, dan invoice ber-QR terbit otomatis.",
    },
    {
      icon: AlarmClock,
      color: "#0891b2",
      title: "Denda keterlambatan",
      body: `Toleransi ${s.graceMinutes} menit. Setelah itu dikenakan ${rupiah(s.lateFeePerHour)} per jam per unit (dibulatkan ke atas), dibayar di tempat saat pengembalian.`,
    },
    {
      icon: ShieldAlert,
      color: "#16a34a",
      title: "Kerusakan & kehilangan",
      body: "Kerusakan akibat pemakaian tidak wajar dibebankan sesuai biaya perbaikan bengkel Pleazure. Kehilangan unit/aksesori diganti sesuai nilai barang. Laporkan kendala di jalan ke WhatsApp kami.",
    },
    {
      icon: Ban,
      color: "#e11d48",
      title: "Pembatalan & no-show",
      body: "Booking yang belum dibayar boleh dibatalkan kapan saja (hubungi WhatsApp). Booking lunas yang tidak diambil sampai jam selesai sewa dianggap hangus. Pengembalian dana dibahas kasus per kasus dengan staf.",
    },
  ];
}

export function TermsList({ settings, compact }: { settings: Settings; compact?: boolean }) {
  return (
    <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4"}>
      {termsItems(settings).map((t) => (
        <details
          key={t.title}
          className="group rounded-3xl bg-cream p-5 ring-1 ring-line open:bg-white open:shadow-pop"
          open={!compact}
        >
          <summary className="flex cursor-pointer list-none items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white" style={{ background: t.color }}>
              <t.icon className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-extrabold leading-tight">{t.title}</span>
            <span className="ml-auto text-xl font-bold text-muted transition group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-ink/75">{t.body}</p>
        </details>
      ))}
    </div>
  );
}
