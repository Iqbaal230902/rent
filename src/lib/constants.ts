// Profil usaha & label tampilan. Aman dipakai di client & server.
export const BUSINESS = {
  name: "Pleazure Cycling Culture",
  short: "pleazure.cc",
  tagline: "Bike · Rent · Service",
  address: "Jl. Baldes No.2, SMI, Sukabumi",
  mapsQuery: "Jl. Baldes No.2 Sukabumi",
  instagram: "https://instagram.com/pleazure.cc",
  threads: "https://www.threads.net/@pleazure.cc",
  tourInstagram: "https://instagram.com/cyclingtour.sukabumi",
} as const;

export type Category = "ROAD" | "MTB" | "EBIKE" | "FOLDING";

export const CATEGORIES: Record<
  Category,
  { label: string; blurb: string; from: string; to: string; chip: string; accent: string }
> = {
  ROAD: {
    label: "Road Bike",
    blurb: "Ringan & ngebut untuk rute aspal Sukabumi.",
    from: "#FF6B2C",
    to: "#FF2E7E",
    chip: "bg-orange-100 text-orange-700 ring-orange-200",
    accent: "text-orange-600",
  },
  MTB: {
    label: "MTB",
    blurb: "Tangguh di trek tanah, kebun teh, dan tanjakan.",
    from: "#16A34A",
    to: "#A3E635",
    chip: "bg-lime-100 text-lime-800 ring-lime-200",
    accent: "text-lime-700",
  },
  EBIKE: {
    label: "E-Bike",
    blurb: "Dibantu motor listrik — santai di tanjakan.",
    from: "#6D28D9",
    to: "#22D3EE",
    chip: "bg-violet-100 text-violet-700 ring-violet-200",
    accent: "text-violet-600",
  },
  FOLDING: {
    label: "Sepeda Lipat",
    blurb: "Praktis untuk keliling kota & masuk bagasi.",
    from: "#F59E0B",
    to: "#F43F5E",
    chip: "bg-amber-100 text-amber-800 ring-amber-200",
    accent: "text-amber-600",
  },
};

export const CATEGORY_ORDER: Category[] = ["ROAD", "MTB", "EBIKE", "FOLDING"];

export type BookingStatusKey =
  | "PENDING_PAYMENT"
  | "PAID"
  | "IN_USE"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED";

export const BOOKING_STATUS: Record<BookingStatusKey, { label: string; badge: string; dot: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Bayar", badge: "bg-amber-100 text-amber-800 ring-amber-300", dot: "bg-amber-500" },
  PAID: { label: "Lunas", badge: "bg-emerald-100 text-emerald-800 ring-emerald-300", dot: "bg-emerald-500" },
  IN_USE: { label: "Sedang Disewa", badge: "bg-sky-100 text-sky-800 ring-sky-300", dot: "bg-sky-500" },
  COMPLETED: { label: "Selesai", badge: "bg-violet-100 text-violet-800 ring-violet-300", dot: "bg-violet-500" },
  EXPIRED: { label: "Kedaluwarsa", badge: "bg-zinc-100 text-zinc-600 ring-zinc-300", dot: "bg-zinc-400" },
  CANCELLED: { label: "Dibatalkan", badge: "bg-rose-100 text-rose-700 ring-rose-300", dot: "bg-rose-500" },
};

export const UNIT_STATUS: Record<string, { label: string; badge: string }> = {
  AVAILABLE: { label: "Siap", badge: "bg-emerald-100 text-emerald-800 ring-emerald-300" },
  MAINTENANCE: { label: "Maintenance", badge: "bg-amber-100 text-amber-800 ring-amber-300" },
  RETIRED: { label: "Pensiun", badge: "bg-zinc-100 text-zinc-600 ring-zinc-300" },
};

export const PAYMENT_METHODS = [
  { value: "TUNAI", label: "Tunai di store" },
  { value: "TRANSFER", label: "Transfer bank" },
  { value: "QRIS_STATIS", label: "QRIS statis toko" },
] as const;

export const COLLATERAL_TYPES = [
  { value: "KTP", label: "E-KTP asli" },
  { value: "SIM", label: "SIM" },
  { value: "LAINNYA", label: "Lainnya" },
] as const;

export function paymentMethodLabel(v?: string | null) {
  if (v === "QRIS_DINAMIS") return "QRIS Dinamis";
  return PAYMENT_METHODS.find((m) => m.value === v)?.label ?? v ?? "-";
}

export function collateralLabel(v?: string | null) {
  return COLLATERAL_TYPES.find((m) => m.value === v)?.label ?? v ?? "-";
}

export function waLink(number: string, text: string) {
  const n = number.replace(/\D/g, "").replace(/^0/, "62");
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}
