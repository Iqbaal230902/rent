import { AppError, handle } from "@/lib/errors";
import { findBookingByToken } from "@/lib/views";
import { qrDataUrl, qrPayloadFor } from "@/lib/qr";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";

export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/invoices/[token]/pdf">) => {
  const { token } = await ctx.params;
  const b = await findBookingByToken(token);
  if (!b || !b.invoice) throw new AppError(404, "Invoice belum tersedia.");
  const qr = await qrDataUrl(qrPayloadFor(b.code), 300);
  const pdf = await renderInvoicePdf(b, qr);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${b.invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
});
