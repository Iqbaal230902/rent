"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/field";
import { PAYMENT_METHODS } from "@/lib/constants";
import { rupiah } from "@/lib/format";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export function ConfirmPaymentPanel({
  bookingId,
  amount,
  expired,
  onDone,
}: {
  bookingId: number;
  amount: number;
  expired?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<string>("TUNAI");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-3">
      {expired && (
        <Alert tone="warn" title="Hold sudah lewat">
          Konfirmasi tetap bisa dilakukan bila unit masih tersedia; sistem akan mengecek ulang stok.
        </Alert>
      )}
      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMethod(m.value)}
            className={cn(
              "rounded-2xl px-2 py-3 text-xs font-bold ring-1 ring-inset transition",
              method === m.value ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink/30",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Input placeholder="Catatan (opsional), mis. ref transfer" value={note} onChange={(e) => setNote(e.target.value)} className="h-11" />
      {error && <Alert tone="error">{error}</Alert>}
      <Button
        variant="success"
        size="lg"
        loading={loading}
        onClick={async () => {
          if (!confirm(`Konfirmasi pembayaran ${rupiah(amount)} via ${PAYMENT_METHODS.find((m) => m.value === method)?.label}?`)) return;
          setLoading(true);
          setError(null);
          const r = await api(`/api/admin/bookings/${bookingId}/confirm-payment`, { body: { method, note: note || undefined } });
          setLoading(false);
          if (!r.ok) return setError(r.error);
          onDone?.();
          router.refresh();
        }}
      >
        <BadgeCheck className="h-5 w-5" /> Konfirmasi Bayar {rupiah(amount)}
      </Button>
    </div>
  );
}

export function CancelBookingButton({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      <Button
        variant="danger"
        size="md"
        loading={loading}
        onClick={async () => {
          const reason = prompt("Alasan pembatalan (opsional):");
          if (reason === null) return;
          setLoading(true);
          setError(null);
          const r = await api(`/api/admin/bookings/${bookingId}/cancel`, { body: { reason: reason || undefined } });
          setLoading(false);
          if (!r.ok) return setError(r.error);
          router.refresh();
        }}
      >
        <Ban className="h-4 w-4" /> Batalkan booking
      </Button>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
