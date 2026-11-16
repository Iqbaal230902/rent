import { NextResponse } from "next/server";
import { AppError, handle } from "@/lib/errors";
import { requireStaffApi } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validators";
import { checkOut, previewCheckout } from "@/lib/booking";

export const GET = handle(async (req: Request) => {
  await requireStaffApi();
  const id = Number(new URL(req.url).searchParams.get("bookingId"));
  if (!id) throw new AppError(400, "bookingId wajib.");
  return NextResponse.json(await previewCheckout(id));
});

export const POST = handle(async (req: Request) => {
  const staff = await requireStaffApi();
  const input = checkoutSchema.parse(await req.json());
  const b = await checkOut(input, staff);
  return NextResponse.json({ ok: true, status: b.status, code: b.code });
});
