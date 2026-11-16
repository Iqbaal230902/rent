import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireStaffApi } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { bikeModelSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/booking";

export const GET = handle(async () => {
  await requireStaffApi();
  const models = await prisma.bikeModel.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { units: { orderBy: { serialNumber: "asc" } } },
  });
  return NextResponse.json({ models });
});

export const POST = handle(async (req: Request) => {
  const admin = await requireStaffApi(["ADMIN"]);
  const data = bikeModelSchema.parse(await req.json());
  let slug = slugify(data.name) || "sepeda";
  if (await prisma.bikeModel.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  const model = await prisma.bikeModel.create({ data: { ...data, slug } });
  await audit(prisma, admin.id, "CREATE_MODEL", "bike_model", model.id, { name: model.name });
  return NextResponse.json({ model }, { status: 201 });
});
