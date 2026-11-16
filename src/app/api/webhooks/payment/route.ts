import { NextResponse } from "next/server";
import { getPaymentProvider, isGatewayEnabled } from "@/lib/payment";

// Fase 2 (DITUNDA): endpoint notifikasi payment gateway.
// Selama PAYMENT_GATEWAY_ENABLED !== "true", endpoint ini menolak semua request.
export async function POST(req: Request) {
  if (!isGatewayEnabled()) {
    return NextResponse.json({ error: "Payment gateway belum aktif." }, { status: 404 });
  }
  const res = await getPaymentProvider().handleNotification(req);
  return NextResponse.json(res.body, { status: res.status });
}
