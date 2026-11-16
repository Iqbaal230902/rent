import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { BookingDetail } from "./booking";
import { BUSINESS, CATEGORIES, paymentMethodLabel } from "./constants";
import { fmtDateTime, rupiah, fmtDuration } from "./format";

const C = { ink: "#1a1033", muted: "#6b6485", orange: "#FF6B2C", pink: "#FF2E7E", violet: "#7C3AED", lime: "#A3E635", line: "#ECE8F5" };

const s = StyleSheet.create({
  page: { padding: 0, fontSize: 10, color: C.ink, fontFamily: "Helvetica" },
  band: { flexDirection: "row", height: 8 },
  header: { paddingHorizontal: 36, paddingTop: 24, paddingBottom: 18, flexDirection: "row", justifyContent: "space-between" },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  tag: { fontSize: 9, color: C.muted, marginTop: 2 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.violet, textAlign: "right" },
  paid: { marginTop: 6, alignSelf: "flex-end", backgroundColor: "#DCFCE7", color: "#166534", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, fontSize: 9, fontFamily: "Helvetica-Bold" },
  body: { paddingHorizontal: 36 },
  row: { flexDirection: "row", gap: 18 },
  card: { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 12 },
  label: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  value: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  small: { fontSize: 9, color: C.muted, marginTop: 2 },
  table: { marginTop: 18, borderWidth: 1, borderColor: C.line, borderRadius: 10 },
  th: { flexDirection: "row", backgroundColor: "#F7F4FE", paddingVertical: 8, paddingHorizontal: 12, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  tr: { flexDirection: "row", paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderColor: C.line },
  total: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, padding: 14, borderRadius: 10, backgroundColor: C.ink, color: "white" },
  qrWrap: { marginTop: 18, flexDirection: "row", gap: 16, alignItems: "center", borderWidth: 1, borderColor: C.line, borderRadius: 10, padding: 12 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: C.muted, textAlign: "center" },
});

function InvoiceDoc({ b, qr }: { b: BookingDetail; qr: string }) {
  const paid = b.payments.find((p) => p.status === "PAID");
  const durMin = (b.endAt.getTime() - b.startAt.getTime()) / 60000;
  return (
    <Document title={`Invoice ${b.invoice?.invoiceNumber ?? b.code}`} author={BUSINESS.name}>
      <Page size="A4" style={s.page}>
        <View style={s.band}>
          <View style={{ flex: 1, backgroundColor: C.orange }} />
          <View style={{ flex: 1, backgroundColor: C.pink }} />
          <View style={{ flex: 1, backgroundColor: C.violet }} />
          <View style={{ flex: 1, backgroundColor: C.lime }} />
        </View>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>pleazure.cc</Text>
            <Text style={s.tag}>{BUSINESS.name} · {BUSINESS.tagline}</Text>
            <Text style={s.tag}>{BUSINESS.address}</Text>
          </View>
          <View>
            <Text style={s.title}>INVOICE</Text>
            <Text style={{ textAlign: "right", marginTop: 2 }}>{b.invoice?.invoiceNumber}</Text>
            <Text style={s.paid}>LUNAS</Text>
          </View>
        </View>
        <View style={s.body}>
          <View style={s.row}>
            <View style={s.card}>
              <Text style={s.label}>Ditagihkan kepada</Text>
              <Text style={s.value}>{b.customerName}</Text>
              <Text style={s.small}>{b.customerPhone}</Text>
              <Text style={s.small}>{b.customerEmail}</Text>
            </View>
            <View style={s.card}>
              <Text style={s.label}>Kode booking</Text>
              <Text style={s.value}>{b.code}</Text>
              <Text style={s.small}>Terbit: {b.invoice ? fmtDateTime(b.invoice.issuedAt) : "-"}</Text>
              <Text style={s.small}>Dibayar: {paid ? `${paymentMethodLabel(paid.method)} · ${fmtDateTime(paid.paidAt ?? paid.createdAt)}` : "-"}</Text>
            </View>
          </View>

          <View style={s.table}>
            <View style={s.th}>
              <Text style={{ flex: 3, fontFamily: "Helvetica-Bold" }}>Item</Text>
              <Text style={{ flex: 1, fontFamily: "Helvetica-Bold", textAlign: "center" }}>Unit</Text>
              <Text style={{ flex: 1.4, fontFamily: "Helvetica-Bold", textAlign: "right" }}>Jumlah</Text>
            </View>
            <View style={s.tr}>
              <View style={{ flex: 3 }}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Sewa {b.model.name}</Text>
                <Text style={s.small}>{CATEGORIES[b.model.category].label} · {fmtDuration(durMin)}</Text>
                <Text style={s.small}>Ambil: {fmtDateTime(b.startAt)}</Text>
                <Text style={s.small}>Kembali: {fmtDateTime(b.endAt)}</Text>
              </View>
              <Text style={{ flex: 1, textAlign: "center" }}>{b.quantity}</Text>
              <Text style={{ flex: 1.4, textAlign: "right" }}>{rupiah(b.subtotal)}</Text>
            </View>
          </View>

          <View style={s.total}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>Total dibayar</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 14 }}>{rupiah(b.totalAmount)}</Text>
          </View>

          <View style={s.qrWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={qr} style={{ width: 110, height: 110 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.value}>Tunjukkan QR ini di store</Text>
              <Text style={[s.small, { marginTop: 4 }]}>
                Bawa E-KTP asli sebagai jaminan. Staf akan memindai QR, mencatat nomor unit, lalu menyerahkan sepeda.
              </Text>
              <Text style={[s.small, { marginTop: 4 }]}>
                Keterlambatan dikenakan denda per jam setelah masa toleransi. QR tidak berlaku untuk booking yang sudah selesai, dibatalkan, atau kedaluwarsa.
              </Text>
            </View>
          </View>
        </View>
        <Text style={s.footer}>
          {BUSINESS.name} · {BUSINESS.address} · Buka 07.00–22.00 WIB · Instagram @pleazure.cc
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(b: BookingDetail, qrDataUrl: string) {
  return renderToBuffer(<InvoiceDoc b={b} qr={qrDataUrl} />);
}
