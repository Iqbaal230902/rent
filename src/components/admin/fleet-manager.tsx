"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { UnitBadge } from "@/components/ui/badge";
import { BikeVisual } from "@/components/site/bike-art";
import { CATEGORIES, CATEGORY_ORDER, UNIT_STATUS, type Category } from "@/lib/constants";
import { rupiah } from "@/lib/format";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export type FleetModel = {
  id: number;
  name: string;
  slug: string;
  category: Category;
  description: string;
  frameSize: string;
  pricePerHour: number;
  pricePerDay: number;
  isActive: boolean;
  specs: Record<string, string>;
  photos: string[];
  units: { id: number; serialNumber: string; status: string; notes: string; inUseBy: string | null }[];
};

export function FleetManager({ models }: { models: FleetModel[] }) {
  const [creating, setCreating] = useState(false);
  return (
    <div className="grid gap-5">
      {creating ? (
        <ModelForm onClose={() => setCreating(false)} />
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-violet/40 bg-white/60 py-5 font-bold text-violet transition hover:bg-white"
        >
          <Plus className="h-5 w-5" /> Tambah model sepeda
        </button>
      )}
      {models.map((m) => (
        <ModelCard key={m.id} m={m} />
      ))}
    </div>
  );
}

function ModelCard({ m }: { m: FleetModel }) {
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(true);
  const c = CATEGORIES[m.category];
  const ready = m.units.filter((u) => u.status === "AVAILABLE").length;

  if (editing) return <ModelForm initial={m} onClose={() => setEditing(false)} />;

  return (
    <section className={cn("overflow-hidden rounded-3xl bg-white ring-1 ring-line shadow-pop", !m.isActive && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-2xl" style={{ background: `linear-gradient(135deg, ${c.from}22, ${c.to}44)` }}>
          <BikeVisual category={m.category} photos={m.photos} name={m.name} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset", c.chip)}>{c.label}</span>
            {!m.isActive && <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-bold">Nonaktif</span>}
          </div>
          <p className="mt-1 truncate font-display text-xl font-extrabold">{m.name}</p>
          <p className="text-sm text-muted">
            <b className="text-ink">{rupiah(m.pricePerHour)}</b>/jam · <b className="text-ink">{rupiah(m.pricePerDay)}</b>/hari · {ready}/
            {m.units.length} unit siap
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit & tarif
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)} aria-label="Tampilkan unit">
            <ChevronDown className={cn("h-5 w-5 transition", open && "rotate-180")} />
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line bg-cream/40 p-4 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {m.units.map((u) => (
              <UnitRow key={u.id} u={u} />
            ))}
            <AddUnit modelId={m.id} />
          </div>
        </div>
      )}
    </section>
  );
}

function UnitRow({ u }: { u: FleetModel["units"][number] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(u.notes);

  const patch = async (body: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    const r = await api(`/api/admin/units/${u.id}`, { method: "PATCH", body });
    setLoading(false);
    if (!r.ok) return setError(r.error);
    router.refresh();
  };

  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-line">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-sm font-extrabold">{u.serialNumber}</p>
        {u.inUseBy ? (
          <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800 ring-1 ring-inset ring-sky-300">
            Disewa {u.inUseBy}
          </span>
        ) : (
          <UnitBadge status={u.status} />
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <select
          value={u.status}
          disabled={loading}
          onChange={(e) => patch({ status: e.target.value })}
          className="h-9 flex-1 rounded-xl bg-cream px-2 text-xs font-bold ring-1 ring-inset ring-line"
          aria-label={`Status ${u.serialNumber}`}
        >
          {Object.entries(UNIT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <button
          disabled={loading}
          onClick={async () => {
            if (!confirm(`Hapus unit ${u.serialNumber}? Unit dengan riwayat sewa tidak bisa dihapus.`)) return;
            setLoading(true);
            const r = await api(`/api/admin/units/${u.id}`, { method: "DELETE" });
            setLoading(false);
            if (!r.ok) return setError(r.error);
            router.refresh();
          }}
          className="grid h-9 w-9 place-items-center rounded-xl text-rose-600 hover:bg-rose-50"
          aria-label={`Hapus ${u.serialNumber}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => notes !== u.notes && patch({ notes })}
        placeholder="Catatan unit…"
        className="mt-2 h-9 w-full rounded-xl bg-cream/60 px-3 text-xs ring-1 ring-inset ring-line focus:outline-none focus:ring-violet/50"
      />
      {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

function AddUnit({ modelId }: { modelId: number }) {
  const router = useRouter();
  const [serial, setSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid content-start gap-2 rounded-2xl border-2 border-dashed border-line p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const r = await api("/api/admin/units", { body: { modelId, serialNumber: serial } });
        setLoading(false);
        if (!r.ok) return setError(r.error);
        setSerial("");
        router.refresh();
      }}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-muted">Tambah unit</p>
      <div className="flex gap-2">
        <input
          required
          value={serial}
          onChange={(e) => setSerial(e.target.value.toUpperCase())}
          placeholder="No. seri, mis. PLZ-RB-005"
          className="h-9 min-w-0 flex-1 rounded-xl bg-white px-3 font-mono text-xs ring-1 ring-inset ring-line"
        />
        <Button size="sm" variant="ink" loading={loading}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
    </form>
  );
}

function ModelForm({ initial, onClose }: { initial?: FleetModel; onClose: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: initial?.name ?? "",
    category: initial?.category ?? ("ROAD" as Category),
    description: initial?.description ?? "",
    frameSize: initial?.frameSize ?? "",
    pricePerHour: String(initial?.pricePerHour ?? ""),
    pricePerDay: String(initial?.pricePerDay ?? ""),
    isActive: initial?.isActive ?? true,
    specs: Object.entries(initial?.specs ?? {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n"),
    photos: (initial?.photos ?? []).join("\n"),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const specs = Object.fromEntries(
      f.specs
        .split("\n")
        .map((l) => l.split(":"))
        .filter((p) => p.length >= 2 && p[0].trim())
        .map(([k, ...v]) => [k.trim(), v.join(":").trim()]),
    );
    const body = {
      name: f.name,
      category: f.category,
      description: f.description,
      frameSize: f.frameSize,
      pricePerHour: Number(f.pricePerHour),
      pricePerDay: Number(f.pricePerDay),
      isActive: f.isActive,
      specs,
      photos: f.photos.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    const r = initial
      ? await api(`/api/admin/bikes/${initial.id}`, { method: "PATCH", body })
      : await api("/api/admin/bikes", { body });
    setLoading(false);
    if (!r.ok) return setError(r.error);
    onClose();
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white p-5 ring-2 ring-violet/40 shadow-pop">
      <div className="flex items-center justify-between">
        <p className="font-display text-xl font-extrabold">{initial ? `Edit ${initial.name}` : "Model baru"}</p>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Tutup">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Nama model">
          <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Kategori">
          <Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Category })}>
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {CATEGORIES[c].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tarif per jam (Rp)" hint={rupiah(Number(f.pricePerHour) || 0)}>
          <Input required inputMode="numeric" value={f.pricePerHour} onChange={(e) => setF({ ...f, pricePerHour: e.target.value.replace(/\D/g, "") })} />
        </Field>
        <Field label="Tarif per hari (Rp)" hint={rupiah(Number(f.pricePerDay) || 0)}>
          <Input required inputMode="numeric" value={f.pricePerDay} onChange={(e) => setF({ ...f, pricePerDay: e.target.value.replace(/\D/g, "") })} />
        </Field>
        <Field label="Ukuran frame">
          <Input value={f.frameSize} onChange={(e) => setF({ ...f, frameSize: e.target.value })} placeholder="mis. M (170–180 cm)" />
        </Field>
        <Field label="Status model">
          <label className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl bg-cream px-4 text-sm font-semibold">
            <input type="checkbox" className="h-5 w-5 accent-violet" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />
            Tampil di katalog
          </label>
        </Field>
        <Field label="Deskripsi" className="sm:col-span-2">
          <Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <Field label="Spesifikasi" hint="Satu per baris, format Nama: Nilai">
          <Textarea className="font-mono text-sm" value={f.specs} onChange={(e) => setF({ ...f, specs: e.target.value })} placeholder={"Frame: Alloy\nGroupset: Shimano Sora"} />
        </Field>
        <Field label="URL foto" hint="Satu URL per baris (kosong = ilustrasi otomatis)">
          <Textarea className="font-mono text-sm" value={f.photos} onChange={(e) => setF({ ...f, photos: e.target.value })} placeholder="https://…" />
        </Field>
      </div>
      {error && <Alert tone="error" className="mt-4">{error}</Alert>}
      <div className="mt-5 flex gap-2">
        <Button type="submit" loading={loading}>
          Simpan
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
      </div>
    </form>
  );
}
