"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlarmClock, Clock, CreditCard, Save, Timer } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api } from "@/lib/client-api";
import { rupiah } from "@/lib/format";

export function SettingsForm({ initial, gatewayEnabled }: { initial: Settings; gatewayEnabled: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({
    open_time: initial.openTime,
    close_time: initial.closeTime,
    hold_minutes_after_start: String(initial.holdMinutesAfterStart),
    checkin_early_minutes: String(initial.checkinEarlyMinutes),
    grace_minutes: String(initial.graceMinutes),
    late_fee_per_hour: String(initial.lateFeePerHour),
    max_rental_days: String(initial.maxRentalDays),
    min_rental_minutes: String(initial.minRentalMinutes),
    whatsapp_number: initial.whatsappNumber,
    bank_info: initial.bankInfo,
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const Section = ({ icon: Icon, color, title, children }: { icon: typeof Clock; color: string; title: string; children: React.ReactNode }) => (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-line shadow-pop">
      <p className="flex items-center gap-3 font-display text-lg font-extrabold">
        <span className={`grid h-9 w-9 place-items-center rounded-xl text-white ${color}`}>
          <Icon className="h-4 w-4" />
        </span>
        {title}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );

  return (
    <form
      className="grid gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        const r = await api("/api/admin/settings", { method: "PUT", body: f });
        setLoading(false);
        if (!r.ok) return setMsg({ tone: "error", text: r.error });
        setMsg({ tone: "success", text: "Pengaturan tersimpan." });
        router.refresh();
      }}
    >
      {Section({
        icon: Clock,
        color: "bg-orange",
        title: "Jam operasional & durasi",
        children: (
          <>
            <Field label="Jam buka (WIB)"><Input type="time" step={1800} value={f.open_time} onChange={set("open_time")} /></Field>
            <Field label="Jam tutup (WIB)"><Input type="time" step={1800} value={f.close_time} onChange={set("close_time")} /></Field>
            <Field label="Durasi minimal (menit)"><Input inputMode="numeric" value={f.min_rental_minutes} onChange={set("min_rental_minutes")} /></Field>
            <Field label="Durasi maksimal (hari)"><Input inputMode="numeric" value={f.max_rental_days} onChange={set("max_rental_days")} /></Field>
          </>
        ),
      })}
      {Section({
        icon: Timer,
        color: "bg-pink",
        title: "Hold booking & check-in",
        children: (
          <>
            <Field label="Hold sampai jam mulai + (menit)" hint="Booking belum bayar otomatis EXPIRED setelah ini.">
              <Input inputMode="numeric" value={f.hold_minutes_after_start} onChange={set("hold_minutes_after_start")} />
            </Field>
            <Field label="Check-in dibuka sebelum jadwal (menit)">
              <Input inputMode="numeric" value={f.checkin_early_minutes} onChange={set("checkin_early_minutes")} />
            </Field>
          </>
        ),
      })}
      {Section({
        icon: AlarmClock,
        color: "bg-violet",
        title: "Denda keterlambatan",
        children: (
          <>
            <Field label="Toleransi / grace period (menit)"><Input inputMode="numeric" value={f.grace_minutes} onChange={set("grace_minutes")} /></Field>
            <Field label="Denda per jam per unit (Rp)" hint={rupiah(Number(f.late_fee_per_hour) || 0)}>
              <Input inputMode="numeric" value={f.late_fee_per_hour} onChange={set("late_fee_per_hour")} />
            </Field>
          </>
        ),
      })}
      {Section({
        icon: CreditCard,
        color: "bg-emerald-500",
        title: "Pembayaran manual",
        children: (
          <>
            <Field label="Nomor WhatsApp store" hint="Format internasional, mis. 6281234567890">
              <Input inputMode="tel" value={f.whatsapp_number} onChange={set("whatsapp_number")} />
            </Field>
            <Field label="Info rekening transfer">
              <Textarea className="min-h-12" value={f.bank_info} onChange={set("bank_info")} />
            </Field>
            <div className="sm:col-span-2">
              <Alert tone={gatewayEnabled ? "success" : "info"} title={gatewayEnabled ? "QRIS Dinamis aktif" : "Mode pembayaran: MANUAL"}>
                {gatewayEnabled
                  ? "Pembayaran dikonfirmasi otomatis lewat webhook payment gateway."
                  : "QRIS Dinamis (Fase 2) masih nonaktif. Aktifkan lewat env PAYMENT_GATEWAY_ENABLED=true setelah pendaftaran merchant selesai."}
              </Alert>
            </div>
          </>
        ),
      })}
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      <div className="sticky bottom-24 z-10 lg:bottom-4">
        <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
          <Save className="h-5 w-5" /> Simpan pengaturan
        </Button>
      </div>
    </form>
  );
}
