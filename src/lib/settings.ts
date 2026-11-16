import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type { RentalRules } from "./pricing";

export const SETTING_DEFAULTS = {
  open_time: "07:00",
  close_time: "22:00",
  hold_minutes_after_start: "30",
  checkin_early_minutes: "30",
  grace_minutes: "15",
  late_fee_per_hour: "15000",
  max_rental_days: "7",
  min_rental_minutes: "60",
  whatsapp_number: "6281234567890",
  bank_info: "BCA 1234567890 a.n. Pleazure Cycling Culture",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

export type Settings = {
  openTime: string;
  closeTime: string;
  holdMinutesAfterStart: number;
  checkinEarlyMinutes: number;
  graceMinutes: number;
  lateFeePerHour: number;
  maxRentalDays: number;
  minRentalMinutes: number;
  whatsappNumber: string;
  bankInfo: string;
};

type Db = Prisma.TransactionClient;

export async function getSettings(db: Db = prisma): Promise<Settings> {
  const rows = await db.setting.findMany();
  const map: Record<string, string> = { ...SETTING_DEFAULTS };
  for (const r of rows) map[r.key] = r.value;
  const num = (k: SettingKey) => {
    const n = Number(map[k]);
    return Number.isFinite(n) ? n : Number(SETTING_DEFAULTS[k]);
  };
  return {
    openTime: map.open_time,
    closeTime: map.close_time,
    holdMinutesAfterStart: num("hold_minutes_after_start"),
    checkinEarlyMinutes: num("checkin_early_minutes"),
    graceMinutes: num("grace_minutes"),
    lateFeePerHour: num("late_fee_per_hour"),
    maxRentalDays: num("max_rental_days"),
    minRentalMinutes: num("min_rental_minutes"),
    whatsappNumber: map.whatsapp_number,
    bankInfo: map.bank_info,
  };
}

export function rulesFrom(s: Settings): RentalRules {
  return {
    openTime: s.openTime,
    closeTime: s.closeTime,
    maxRentalDays: s.maxRentalDays,
    minRentalMinutes: s.minRentalMinutes,
  };
}

export async function saveSettings(patch: Partial<Record<SettingKey, string>>) {
  await prisma.$transaction(
    Object.entries(patch).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } }),
    ),
  );
}
