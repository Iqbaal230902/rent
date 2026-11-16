import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { AppError, handle } from "@/lib/errors";
import { requireStaffApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { unitUpdateSchema } from "@/lib/validators";
import { audit, setUnitStatus } from "@/lib/booking";

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/admin/units/[id]">) => {
  const admin = await requireStaffApi(["ADMIN"]);
  const id = Number((await ctx.params).id);
  const data = unitUpdateSchema.parse(await req.json());
  if (data.status) await setUnitStatus(id, data.status, admin);
  if (data.notes !== undefined || data.serialNumber) {
    try {
      await prisma.bikeUnit.update({
        where: { id },
        data: {
          ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
          ...(data.serialNumber ? { serialNumber: data.serialNumber.toUpperCase() } : {}),
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new AppError(409, "Nomor seri sudah dipakai unit lain.");
      }
      throw e;
    }
    await audit(prisma, admin.id, "UPDATE_UNIT", "bike_unit", id, data);
  }
  const unit = await prisma.bikeUnit.findUnique({ where: { id } });
  return NextResponse.json({ unit });
});

export const DELETE = handle(async (_req: Request, ctx: RouteContext<"/api/admin/units/[id]">) => {
  const admin = await requireStaffApi(["ADMIN"]);
  const id = Number((await ctx.params).id);
  const used = await prisma.bookingUnit.count({ where: { unitId: id } });
  if (used > 0) throw new AppError(409, "Unit punya riwayat sewa; ubah statusnya ke Pensiun (RETIRED) saja.");
  const unit = await prisma.bikeUnit.findUnique({ where: { id } });
  if (unit?.status === "AVAILABLE") {
    await setUnitStatus(id, "RETIRED", admin); // pakai pengaman booking aktif yang sama
  }
  await prisma.bikeUnit.delete({ where: { id } });
  await audit(prisma, admin.id, "DELETE_UNIT", "bike_unit", id);
  return NextResponse.json({ ok: true });
});
