import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/errors";
import { requireStaffApi } from "@/lib/auth";
import { cancelBooking } from "@/lib/booking";

const schema = z.object({ reason: z.string().trim().max(200).optional() });

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/admin/bookings/[id]/cancel">) => {
  const staff = await requireStaffApi();
  const { id } = await ctx.params;
  const { reason } = schema.parse(await req.json().catch(() => ({})));
  const b = await cancelBooking(Number(id), reason ?? null, staff);
  return NextResponse.json({ ok: true, status: b.status });
});
