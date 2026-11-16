import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireStaffApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bikeModelSchema } from "@/lib/validators";
import { audit } from "@/lib/booking";

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/admin/bikes/[id]">) => {
  const admin = await requireStaffApi(["ADMIN"]);
  const id = Number((await ctx.params).id);
  const data = bikeModelSchema.partial().parse(await req.json());
  const before = await prisma.bikeModel.findUniqueOrThrow({ where: { id } });
  const model = await prisma.bikeModel.update({ where: { id }, data });
  const priceChanged = data.pricePerHour !== undefined || data.pricePerDay !== undefined;
  await audit(prisma, admin.id, priceChanged ? "UPDATE_RATES" : "UPDATE_MODEL", "bike_model", id, {
    before: { pricePerHour: before.pricePerHour, pricePerDay: before.pricePerDay, isActive: before.isActive },
    after: { pricePerHour: model.pricePerHour, pricePerDay: model.pricePerDay, isActive: model.isActive },
  });
  return NextResponse.json({ model });
});
