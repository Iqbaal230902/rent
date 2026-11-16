// Seed data contoh untuk pengembangan. Tarif & jumlah unit masih placeholder —
// sesuaikan dengan PRICELIST asli (lihat Pertanyaan Terbuka di PRD).
import { PrismaClient, type BikeCategory, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

const MODELS: {
  name: string;
  slug: string;
  category: BikeCategory;
  description: string;
  frameSize: string;
  pricePerHour: number;
  pricePerDay: number;
  units: number;
  specs: Record<string, string>;
}[] = [
  {
    name: "Strada Alloy R3",
    slug: "strada-alloy-r3",
    category: "ROAD",
    description: "Road bike alloy ringan untuk pemula hingga menengah. Nyaman untuk rute Sukabumi–Cisaat.",
    frameSize: "M (170–180 cm)",
    pricePerHour: 25000,
    pricePerDay: 150000,
    units: 4,
    specs: { Frame: "Alloy 6061", Groupset: "Shimano Sora 2×9", Rem: "Rim brake", Berat: "± 9,8 kg" },
  },
  {
    name: "Strada Carbon R7",
    slug: "strada-carbon-r7",
    category: "ROAD",
    description: "Frame carbon & groupset 105 untuk yang ingin kecepatan lebih di rute Selabintana.",
    frameSize: "M/L (172–185 cm)",
    pricePerHour: 40000,
    pricePerDay: 250000,
    units: 2,
    specs: { Frame: "Carbon T700", Groupset: "Shimano 105 2×11", Rem: "Hydraulic disc", Berat: "± 8,2 kg" },
  },
  {
    name: "Trail MTB 27.5",
    slug: "trail-mtb-275",
    category: "MTB",
    description: "Hardtail serbaguna untuk trek kebun teh Goalpara dan jalur tanah ringan.",
    frameSize: "M (165–178 cm)",
    pricePerHour: 20000,
    pricePerDay: 120000,
    units: 5,
    specs: { Frame: "Alloy", Suspensi: "Fork 100 mm", Drivetrain: "1×10", Ban: "27.5 × 2.25\"" },
  },
  {
    name: "Enduro MTB 29",
    slug: "enduro-mtb-29",
    category: "MTB",
    description: "Full suspension untuk turunan teknis dan trek Gunung Gede–Pangrango bawah.",
    frameSize: "L (175–188 cm)",
    pricePerHour: 35000,
    pricePerDay: 220000,
    units: 2,
    specs: { Frame: "Alloy full-sus", Suspensi: "150/140 mm", Drivetrain: "1×12", Ban: "29 × 2.4\"" },
  },
  {
    name: "Volt City E-Bike",
    slug: "volt-city-ebike",
    category: "EBIKE",
    description: "E-bike perkotaan dengan pedal assist 5 level — tanjakan jadi santai.",
    frameSize: "One size (155–185 cm)",
    pricePerHour: 45000,
    pricePerDay: 275000,
    units: 3,
    specs: { Motor: "250 W hub", Baterai: "36V 10Ah", Jarak: "± 50 km", Assist: "5 level" },
  },
  {
    name: "Volt Trekking E-Bike",
    slug: "volt-trekking-ebike",
    category: "EBIKE",
    description: "E-bike trekking dengan baterai besar untuk tur seharian keliling Sukabumi.",
    frameSize: "M/L (165–188 cm)",
    pricePerHour: 55000,
    pricePerDay: 330000,
    units: 2,
    specs: { Motor: "250 W mid-drive", Baterai: "36V 14Ah", Jarak: "± 80 km", Assist: "5 level" },
  },
  {
    name: "Lipat Urban 20\"",
    slug: "lipat-urban-20",
    category: "FOLDING",
    description: "Sepeda lipat 20 inci, lincah untuk city ride & gampang masuk bagasi mobil.",
    frameSize: "One size (150–185 cm)",
    pricePerHour: 15000,
    pricePerDay: 90000,
    units: 4,
    specs: { Frame: "Alloy", Gear: "1×8", Ban: "20 × 1.5\"", Berat: "± 11 kg" },
  },
  {
    name: "Lipat Mini 16\"",
    slug: "lipat-mini-16",
    category: "FOLDING",
    description: "Super ringkas, cocok untuk keliling taman kota dan kafe.",
    frameSize: "One size (145–180 cm)",
    pricePerHour: 15000,
    pricePerDay: 85000,
    units: 3,
    specs: { Frame: "Alloy", Gear: "1×3", Ban: "16 × 1.35\"", Berat: "± 9,5 kg" },
  },
];

const SERIAL_PREFIX: Record<BikeCategory, string> = { ROAD: "RB", MTB: "MT", EBIKE: "EB", FOLDING: "FD" };

const token = () => randomBytes(16).toString("hex");
const H = 3600_000;
function wib(dayOffset: number, hhmm: string) {
  const now = new Date(Date.now() + 7 * H);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset));
  const ymd = d.toISOString().slice(0, 10);
  return new Date(`${ymd}T${hhmm}:00+07:00`);
}

async function main() {
  console.log("🌱 Seeding…");
  await prisma.auditLog.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingUnit.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.bikeUnit.deleteMany();
  await prisma.bikeModel.deleteMany();
  await prisma.webhookEvent.deleteMany();

  const adminHash = await bcrypt.hash("admin12345", 10);
  const staffHash = await bcrypt.hash("staf12345", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pleazure.cc" },
    update: { passwordHash: adminHash, role: "ADMIN", isActive: true },
    create: { name: "Admin Pleazure", email: "admin@pleazure.cc", passwordHash: adminHash, role: "ADMIN" },
  });
  const staff = await prisma.user.upsert({
    where: { email: "staf@pleazure.cc" },
    update: { passwordHash: staffHash, role: "STAFF", isActive: true },
    create: { name: "Staf Front Desk", email: "staf@pleazure.cc", passwordHash: staffHash, role: "STAFF" },
  });

  const counters: Record<string, number> = {};
  const models: Prisma.BikeModelGetPayload<{ include: { units: true } }>[] = [];
  for (const m of MODELS) {
    const { units, ...data } = m;
    const prefix = SERIAL_PREFIX[m.category];
    const model = await prisma.bikeModel.create({
      data: {
        ...data,
        photos: [],
        units: {
          create: Array.from({ length: units }, () => {
            counters[prefix] = (counters[prefix] ?? 0) + 1;
            return { serialNumber: `PLZ-${prefix}-${String(counters[prefix]).padStart(3, "0")}` };
          }),
        },
      },
      include: { units: true },
    });
    models.push(model);
  }
  // satu unit maintenance sebagai contoh
  await prisma.bikeUnit.update({
    where: { id: models[2].units[4].id },
    data: { status: "MAINTENANCE", notes: "Ganti kampas rem" },
  });

  // ---- contoh booking di berbagai status ----
  const road = models[0];
  const mtb = models[2];
  const ebike = models[4];
  const fold = models[6];
  const now = new Date();

  const mk = async (opts: {
    code: string;
    model: (typeof models)[number];
    qty: number;
    start: Date;
    end: Date;
    status: "PENDING_PAYMENT" | "PAID" | "IN_USE" | "COMPLETED" | "EXPIRED";
    name: string;
    phone: string;
    unitIdx?: number[];
  }) => {
    const hours = Math.max(1, Math.ceil((opts.end.getTime() - opts.start.getTime()) / H));
    const perUnit =
      Math.floor(hours / 24) * opts.model.pricePerDay + Math.min((hours % 24) * opts.model.pricePerHour, opts.model.pricePerDay);
    const total = perUnit * opts.qty;
    const paid = ["PAID", "IN_USE", "COMPLETED"].includes(opts.status);
    const b = await prisma.booking.create({
      data: {
        code: opts.code,
        publicToken: token(),
        customerName: opts.name,
        customerPhone: opts.phone,
        customerEmail: `${opts.name.split(" ")[0].toLowerCase()}@contoh.id`,
        modelId: opts.model.id,
        quantity: opts.qty,
        startAt: opts.start,
        endAt: opts.end,
        status: opts.status,
        holdExpiresAt: opts.status === "PENDING_PAYMENT" ? new Date(opts.start.getTime() + 30 * 60_000) : null,
        subtotal: total,
        totalAmount: total,
        paidAt: paid ? new Date(opts.start.getTime() - 20 * 60_000) : null,
        expiredAt: opts.status === "EXPIRED" ? new Date(opts.start.getTime() + 30 * 60_000) : null,
        createdAt: new Date(opts.start.getTime() - 26 * H),
        units: {
          create: Array.from({ length: opts.qty }, (_, i) => ({
            startAt: opts.start,
            endAt: opts.end,
            unitId:
              opts.status === "IN_USE" || opts.status === "COMPLETED"
                ? opts.model.units[opts.unitIdx?.[i] ?? i].id
                : null,
          })),
        },
      },
    });
    if (paid) {
      const paidAt = b.paidAt!;
      await prisma.payment.create({
        data: {
          bookingId: b.id,
          gateway: "MANUAL",
          method: "TRANSFER",
          gatewayOrderId: `MAN-${b.code}-seed`,
          amount: total,
          status: "PAID",
          paidAt,
          confirmedById: staff.id,
        },
      });
      const ym = new Date(paidAt.getTime() + 7 * H).toISOString().slice(0, 7).replace("-", "");
      await prisma.invoice.create({
        data: { bookingId: b.id, invoiceNumber: `INV-${ym}-${String(b.id).padStart(5, "0")}`, issuedAt: paidAt },
      });
    }
    if (opts.status === "IN_USE" || opts.status === "COMPLETED") {
      const done = opts.status === "COMPLETED";
      await prisma.rental.create({
        data: {
          bookingId: b.id,
          checkedInById: staff.id,
          checkedInAt: new Date(opts.start.getTime() + 5 * 60_000),
          collateralType: "KTP",
          checkedOutById: done ? staff.id : null,
          checkedOutAt: done ? new Date(opts.end.getTime() + 40 * 60_000) : null,
          lateMinutes: done ? 40 : 0,
          lateFee: done ? 15000 * opts.qty : 0,
          settlementMethod: done ? "TUNAI" : null,
          collateralReturned: done,
        },
      });
    }
    return b;
  };

  await mk({ code: "PLZ-DEMO01", model: road, qty: 2, start: wib(-1, "08:00"), end: wib(-1, "12:00"), status: "COMPLETED", name: "Raka Pratama", phone: "081211110001" });
  await mk({ code: "PLZ-DEMO02", model: fold, qty: 1, start: wib(-1, "15:00"), end: wib(-1, "18:00"), status: "EXPIRED", name: "Nadia Putri", phone: "081211110002" });
  await mk({
    code: "PLZ-DEMO03",
    model: ebike,
    qty: 1,
    start: new Date(now.getTime() - 5 * H),
    end: new Date(now.getTime() - 1 * H),
    status: "IN_USE",
    name: "Dimas Saputra",
    phone: "081211110003",
  });
  await mk({
    code: "PLZ-DEMO04",
    model: mtb,
    qty: 2,
    start: new Date(now.getTime() - 2 * H),
    end: new Date(now.getTime() + 3 * H),
    status: "IN_USE",
    name: "Komunitas Gowes Cikole",
    phone: "081211110004",
  });
  await mk({ code: "PLZ-DEMO05", model: road, qty: 1, start: wib(1, "07:00"), end: wib(1, "11:00"), status: "PAID", name: "Sinta Maharani", phone: "081211110005" });
  await mk({ code: "PLZ-DEMO06", model: ebike, qty: 2, start: wib(1, "09:00"), end: wib(1, "15:00"), status: "PENDING_PAYMENT", name: "Bayu Firmansyah", phone: "081211110006" });
  await mk({ code: "PLZ-DEMO07", model: mtb, qty: 1, start: wib(2, "08:00"), end: wib(3, "08:00"), status: "PAID", name: "Galih Ramadhan", phone: "081211110007" });

  void admin;
  console.log("✅ Selesai. Login admin: admin@pleazure.cc / admin12345 · staf: staf@pleazure.cc / staf12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
