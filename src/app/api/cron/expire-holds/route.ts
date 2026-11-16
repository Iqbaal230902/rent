import { NextResponse } from "next/server";
import { expireHolds } from "@/lib/booking";

// Dipanggil tiap 1 menit oleh Vercel Cron / cron VPS:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://domain/api/cron/expire-holds
// Catatan: ketersediaan stok tetap benar meski cron telat, karena hold yang lewat
// tidak dihitung dan booking di-expire juga secara lazy saat dibaca.
async function run(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const expired = await expireHolds();
  return NextResponse.json({ ok: true, expired, at: new Date().toISOString() });
}

export const GET = run;
export const POST = run;
