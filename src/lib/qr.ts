import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import QRCode from "qrcode";
import { authSecret } from "./secret";

// Isi QR: "PLZ1.<kode booking>.<tanda tangan HMAC>".
// Bukan ID berurutan & tidak bisa dipalsukan tanpa AUTH_SECRET.
const PREFIX = "PLZ1";

function sign(code: string) {
  return createHmac("sha256", authSecret()).update(`qr:${code}`).digest("base64url").slice(0, 22);
}

export function qrPayloadFor(code: string) {
  return `${PREFIX}.${code}.${sign(code)}`;
}

/**
 * Terima hasil scan QR ATAU kode booking yang diketik manual (cadangan bila kamera gagal).
 * Mengembalikan kode booking, atau null bila QR palsu.
 */
export function parseScanInput(raw: string): { code: string; viaQr: boolean } | null {
  const input = raw.trim();
  if (input.startsWith(`${PREFIX}.`)) {
    const [, code, sig] = input.split(".");
    if (!code || !sig) return null;
    const expected = Buffer.from(sign(code));
    const got = Buffer.from(sig);
    if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
    return { code, viaQr: true };
  }
  const code = input.toUpperCase().replace(/\s+/g, "");
  if (/^PLZ-[A-Z0-9]{6}$/.test(code)) return { code, viaQr: false };
  return null;
}

export async function qrDataUrl(text: string, size = 320) {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1a1033", light: "#ffffff" },
  });
}

/** Token publik acak 128 bit untuk link invoice/status. */
export function newPublicToken() {
  return randomBytes(16).toString("hex");
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa 0/O/1/I
export function newBookingCode() {
  const bytes = randomBytes(6);
  let s = "";
  for (const b of bytes) s += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `PLZ-${s}`;
}
