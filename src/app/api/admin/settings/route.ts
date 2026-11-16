import { NextResponse } from "next/server";
import { AppError, handle } from "@/lib/errors";
import { requireStaffApi } from "@/lib/auth";
import { settingsSchema } from "@/lib/validators";
import { getSettings, saveSettings } from "@/lib/settings";
import { hhmmToMinutes } from "@/lib/time";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/booking";

export const GET = handle(async () => {
  await requireStaffApi();
  return NextResponse.json({ settings: await getSettings() });
});

export const PUT = handle(async (req: Request) => {
  const admin = await requireStaffApi(["ADMIN"]);
  const data = settingsSchema.parse(await req.json());
  const current = await getSettings();
  const open = data.open_time ?? current.openTime;
  const close = data.close_time ?? current.closeTime;
  if (hhmmToMinutes(close) <= hhmmToMinutes(open)) throw new AppError(400, "Jam tutup harus setelah jam buka.");
  await saveSettings(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])));
  await audit(prisma, admin.id, "UPDATE_SETTINGS", "settings", null, data);
  return NextResponse.json({ settings: await getSettings() });
});
