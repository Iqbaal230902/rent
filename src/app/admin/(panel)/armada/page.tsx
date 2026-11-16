import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageTitle } from "@/components/admin/page-title";
import { FleetManager, type FleetModel } from "@/components/admin/fleet-manager";

export const metadata: Metadata = { title: "Armada & tarif" };

export default async function FleetPage() {
  await requireStaffPage(["ADMIN"]);
  const models = await prisma.bikeModel.findMany({
    orderBy: [{ isActive: "desc" }, { category: "asc" }, { name: "asc" }],
    include: {
      units: {
        orderBy: { serialNumber: "asc" },
        include: { bookingUnits: { where: { booking: { status: "IN_USE" } }, select: { booking: { select: { code: true } } } } },
      },
    },
  });
  const data: FleetModel[] = models.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    category: m.category,
    description: m.description ?? "",
    frameSize: m.frameSize ?? "",
    pricePerHour: m.pricePerHour,
    pricePerDay: m.pricePerDay,
    isActive: m.isActive,
    specs: (m.specs ?? {}) as Record<string, string>,
    photos: Array.isArray(m.photos) ? (m.photos as string[]) : [],
    units: m.units.map((u) => ({
      id: u.id,
      serialNumber: u.serialNumber,
      status: u.status,
      notes: u.notes ?? "",
      inUseBy: u.bookingUnits[0]?.booking.code ?? null,
    })),
  }));
  const total = data.reduce((a, m) => a + m.units.length, 0);
  return (
    <>
      <PageTitle title="Armada & tarif" subtitle={`${data.length} model · ${total} unit fisik`} />
      <FleetManager models={data} />
    </>
  );
}
