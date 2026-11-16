import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppError, handle } from "@/lib/errors";
import { getAllAvailability, getModelAvailability } from "@/lib/availability";

export const GET = handle(async (req: Request) => {
  const url = new URL(req.url);
  // "+07:00" yang tidak di-encode terbaca sebagai spasi → kembalikan jadi "+".
  const param = (k: string) => (url.searchParams.get(k) ?? "").replace(" ", "+");
  const start = new Date(param("start"));
  const end = new Date(param("end"));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new AppError(400, "Parameter start & end (ISO) wajib dan end harus setelah start.");
  }
  const model = url.searchParams.get("model");
  if (model) {
    const m = await prisma.bikeModel.findFirst({
      where: /^\d+$/.test(model) ? { id: Number(model) } : { slug: model },
      select: { id: true },
    });
    if (!m) throw new AppError(404, "Model tidak ditemukan.");
    return NextResponse.json(await getModelAvailability(prisma, m.id, start, end));
  }
  return NextResponse.json({ availability: await getAllAvailability(start, end) });
});
