import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireStaffApi } from "@/lib/auth";
import { checkinSchema } from "@/lib/validators";
import { checkIn } from "@/lib/booking";

export const POST = handle(async (req: Request) => {
  const staff = await requireStaffApi();
  const input = checkinSchema.parse(await req.json());
  const b = await checkIn(input, staff);
  return NextResponse.json({ ok: true, status: b.status, code: b.code });
});
