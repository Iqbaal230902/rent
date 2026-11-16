import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { quoteSchema } from "@/lib/validators";
import { computeQuote, validateRentalWindow } from "@/lib/pricing";
import { getSettings, rulesFrom } from "@/lib/settings";
import { getModelAvailability } from "@/lib/availability";

export const POST = handle(async (req: Request) => {
  const input = quoteSchema.parse(await req.json());
  const model = await prisma.bikeModel.findFirst({ where: { id: input.modelId, isActive: true } });
  if (!model) throw new AppError(404, "Model tidak ditemukan.");
  const settings = await getSettings();
  const windowError = validateRentalWindow(input.start, input.end, rulesFrom(settings));
  const quote = computeQuote({ ...input, pricePerHour: model.pricePerHour, pricePerDay: model.pricePerDay });
  const availability = windowError ? null : await getModelAvailability(prisma, model.id, input.start, input.end);
  return NextResponse.json({ quote, availability, windowError });
});
