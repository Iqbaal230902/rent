import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/errors";

export const GET = handle(async () => {
  const models = await prisma.bikeModel.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { pricePerHour: "asc" }],
    include: { _count: { select: { units: { where: { status: "AVAILABLE" } } } } },
  });
  return NextResponse.json({
    bikes: models.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      category: m.category,
      description: m.description,
      frameSize: m.frameSize,
      specs: m.specs,
      photos: m.photos,
      pricePerHour: m.pricePerHour,
      pricePerDay: m.pricePerDay,
      totalUnits: m._count.units,
    })),
  });
});
