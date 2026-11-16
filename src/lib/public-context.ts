import { getSettings, rulesFrom } from "./settings";
import { defaultWindow, toWibDateInput } from "./time";

export async function getPublicContext() {
  const settings = await getSettings();
  const now = new Date();
  return {
    settings,
    rules: rulesFrom(settings),
    todayDate: toWibDateInput(now),
    initialWindow: defaultWindow(settings.openTime, settings.closeTime, now),
  };
}
