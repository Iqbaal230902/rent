"use client";

export async function api<T = Record<string, unknown>>(
  url: string,
  init?: { method?: string; body?: unknown },
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const res = await fetch(url, {
      method: init?.method ?? (init?.body !== undefined ? "POST" : "GET"),
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? `Gagal (${res.status})`, status: res.status };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "Koneksi bermasalah. Coba lagi.", status: 0 };
  }
}
