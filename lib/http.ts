import { NextResponse } from "next/server";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (message: string, status = 400, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error: message, ...extra }, { status });

const ALLOWED = ["image/jpeg", "image/png", "image/webp"] as const;
export type Media = (typeof ALLOWED)[number];

export function parseDataUrl(dataUrl: unknown): { media: Media; base64: string } | null {
  if (typeof dataUrl !== "string") return null;
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  if (m[2].length > 5_500_000) return null; // ~4 MB
  return { media: m[1] as Media, base64: m[2] };
}
