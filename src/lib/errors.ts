import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

/** Bungkus handler route agar error dikembalikan sebagai JSON yang rapi. */
export function handle<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Input tidak valid.", issues: err.issues },
      { status: 400 },
    );
  }
  console.error("[api] unexpected error", err);
  return NextResponse.json({ error: "Terjadi kesalahan di server. Coba lagi." }, { status: 500 });
}
