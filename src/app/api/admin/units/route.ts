import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { AppError, handle } from "@/lib/errors";
import { requireStaffApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { unitCreateSchema } from "@/lib/validators";
import { audit } from "@/lib/booking";

export const POST = handle(async (req: Request) => {
  const admin = await requireStaffApi(["ADMIN"]);
  const data = unitCreateSchema.parse(await req.json());
  try {
    const unit = await prisma.bikeUnit.create({
      data: { modelId: data.modelId, serialNumber: data.serialNumber.toUpperCase(), notes: data.notes || null },
    });
    await audit(prisma, admin.id, "CREATE_UNIT", "bike_unit", unit.id, { serial: unit.serialNumber });
    return NextResponse.json({ unit }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AppError(409, "Nomor seri sudah dipakai unit lain.");
    }
    throw e;
  }
});
