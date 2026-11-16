import { NextResponse } from "next/server";
import { AppError, handle } from "@/lib/errors";
import { bookingSchema } from "@/lib/validators";
import { createBooking } from "@/lib/booking";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const POST = handle(async (req: Request) => {
  if (!rateLimit(`booking:${clientIp(req)}`, 8, 60_000)) {
    throw new AppError(429, "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.");
  }
  const input = bookingSchema.parse(await req.json());
  const { booking, instruction } = await createBooking({
    modelId: input.modelId,
    quantity: input.quantity,
    start: input.start,
    end: input.end,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail.toLowerCase(),
    notes: input.notes,
  });
  return NextResponse.json(
    {
      code: booking.code,
      token: booking.publicToken,
      status: booking.status,
      totalAmount: booking.totalAmount,
      holdExpiresAt: booking.holdExpiresAt,
      payment: instruction,
      statusUrl: `/booking/${booking.publicToken}`,
    },
    { status: 201 },
  );
});
