import { manualProvider } from "./manual";
import { qrisDinamisProvider } from "./qris-dinamis";
import type { PaymentProvider } from "./types";

export * from "./types";

/** Feature flag: QRIS Dinamis hanya aktif bila PAYMENT_GATEWAY_ENABLED="true". */
export function isGatewayEnabled() {
  return process.env.PAYMENT_GATEWAY_ENABLED === "true";
}

export function getPaymentProvider(): PaymentProvider {
  return isGatewayEnabled() ? qrisDinamisProvider : manualProvider;
}
