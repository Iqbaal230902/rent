import { z } from "zod";

const isoDate = z
  .string({ error: "Tanggal wajib diisi." })
  .refine((s) => !Number.isNaN(Date.parse(s)), "Format tanggal tidak valid.")
  .transform((s) => new Date(s));

export const quoteSchema = z.object({
  modelId: z.coerce.number().int().positive(),
  start: isoDate,
  end: isoDate,
  quantity: z.coerce.number().int().min(1, "Minimal 1 unit.").max(10, "Maksimal 10 unit per booking."),
});

export const bookingSchema = quoteSchema.extend({
  customerName: z.string().trim().min(2, "Nama minimal 2 huruf.").max(120),
  customerPhone: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^(\+62|62|0)8\d{7,12}$/, "Nomor WhatsApp tidak valid (contoh: 0812xxxxxxx).")),
  customerEmail: z.email("Email tidak valid.").max(190),
  notes: z.string().trim().max(255).optional(),
  agree: z.literal(true, { error: "Setujui syarat & ketentuan terlebih dahulu." }),
});

export const confirmPaymentSchema = z.object({
  method: z.enum(["TUNAI", "TRANSFER", "QRIS_STATIS"], { error: "Pilih metode pembayaran." }),
  note: z.string().trim().max(255).optional(),
});

export const checkinSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  unitIds: z.array(z.coerce.number().int().positive()).min(1, "Pilih unit yang diserahkan."),
  collateralType: z.enum(["KTP", "SIM", "LAINNYA"], { error: "Pilih jenis jaminan." }),
  collateralNote: z.string().trim().max(255).optional(),
});

export const checkoutSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  damageFee: z.coerce.number().int().min(0).max(100_000_000).default(0),
  damageNote: z.string().trim().max(255).optional(),
  settlementMethod: z.enum(["TUNAI", "TRANSFER", "QRIS_STATIS"]).nullish(),
  collateralReturned: z.boolean(),
  maintenanceUnitIds: z.array(z.coerce.number().int().positive()).optional(),
});

export const bikeModelSchema = z.object({
  name: z.string().trim().min(2, "Nama model minimal 2 huruf.").max(120),
  category: z.enum(["ROAD", "MTB", "EBIKE", "FOLDING"]),
  description: z.string().trim().max(2000).optional().default(""),
  frameSize: z.string().trim().max(40).optional().default(""),
  pricePerHour: z.coerce.number().int().min(1000, "Tarif per jam minimal Rp 1.000."),
  pricePerDay: z.coerce.number().int().min(1000, "Tarif per hari minimal Rp 1.000."),
  specs: z.record(z.string(), z.string()).default({}),
  photos: z.array(z.url("URL foto tidak valid.")).max(8).default([]),
  isActive: z.boolean().default(true),
});

export const unitCreateSchema = z.object({
  modelId: z.coerce.number().int().positive(),
  serialNumber: z.string().trim().min(3, "Nomor seri minimal 3 karakter.").max(80),
  notes: z.string().trim().max(255).optional(),
});

export const unitUpdateSchema = z.object({
  status: z.enum(["AVAILABLE", "MAINTENANCE", "RETIRED"]).optional(),
  notes: z.string().trim().max(255).nullish(),
  serialNumber: z.string().trim().min(3).max(80).optional(),
});

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam HH:MM.");
export const settingsSchema = z
  .object({
    open_time: hhmm,
    close_time: hhmm,
    hold_minutes_after_start: z.coerce.number().int().min(0).max(240),
    checkin_early_minutes: z.coerce.number().int().min(0).max(240),
    grace_minutes: z.coerce.number().int().min(0).max(240),
    late_fee_per_hour: z.coerce.number().int().min(0).max(10_000_000),
    max_rental_days: z.coerce.number().int().min(1).max(30),
    min_rental_minutes: z.coerce.number().int().min(30).max(1440),
    whatsapp_number: z.string().trim().regex(/^\+?\d{9,15}$/, "Nomor WhatsApp hanya angka, mis. 6281234567890."),
    bank_info: z.string().trim().min(3).max(255),
  })
  .partial();

export const loginSchema = z.object({
  email: z.email("Email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});
