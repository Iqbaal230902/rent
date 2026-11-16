import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireStaffApi } from "@/lib/auth";
import { confirmPaymentSchema } from "@/lib/validators";
import { confirmManualPayment } from "@/lib/booking";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/admin/bookings/[id]/confirm-payment">) => {
  const staff = await requireStaffApi();
  const { id } = await ctx.params;
  const { method, note } = confirmPaymentSchema.parse(await req.json());
  const { booking, invoice } = await confirmManualPayment(Number(id), method, note ?? null, staff);
  return NextResponse.json({ ok: true, status: booking.status, invoiceNumber: invoice.invoiceNumber });
});
