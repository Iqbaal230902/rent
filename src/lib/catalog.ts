import { prisma } from "./db";
import type { Category } from "./constants";

export type PublicModel = {
  id: number;
  slug: string;
  name: string;
  category: Category;
  description: string | null;
  frameSize: string | null;
  specs: Record<string, string>;
  photos: string[];
  pricePerHour: number;
  pricePerDay: number;
  totalUnits: number;
};

export async function getPublicModels(): Promise<PublicModel[]> {
  const models = await prisma.bikeModel.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { pricePerHour: "asc" }],
    include: { _count: { select: { units: { where: { status: "AVAILABLE" } } } } },
  });
  return models.map((m) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    category: m.category,
    description: m.description,
    frameSize: m.frameSize,
    specs: (m.specs ?? {}) as Record<string, string>,
    photos: Array.isArray(m.photos) ? (m.photos as string[]) : [],
    pricePerHour: m.pricePerHour,
    pricePerDay: m.pricePerDay,
    totalUnits: m._count.units,
  }));
}
