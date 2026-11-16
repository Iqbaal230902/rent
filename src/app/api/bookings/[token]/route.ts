import { NextResponse } from "next/server";
import { AppError, handle } from "@/lib/errors";
import { findBookingByToken, publicBookingJson } from "@/lib/views";
import { getPaymentProvider } from "@/lib/payment";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";

export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/bookings/[token]">) => {
  const { token } = await ctx.params;
  const b = await findBookingByToken(token);
  if (!b) throw new AppError(404, "Booking tidak ditemukan.");
  const payment =
    b.status === "PENDING_PAYMENT" ? await getPaymentProvider().getInstruction(b, await getSettings(), prisma) : null;
  return NextResponse.json(
    { ...publicBookingJson(b), payment, invoiceUrl: b.invoice ? `/api/invoices/${token}/pdf` : null },
    { headers: { "Cache-Control": "no-store" } },
  );
});
