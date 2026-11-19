import type { Locale } from "./i18n.ts";

const tag = (l: Locale) => (l === "es" ? "es-CL" : "en-US");

export const fmtNum = (l: Locale, n: number, digits = 0) =>
  new Intl.NumberFormat(tag(l), { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);

/** Redondea y evita el "-0°" que deja Math.round(-0.3). */
export const fmtTemp = (l: Locale, n: number) => `${fmtNum(l, Math.round(n) || 0)}°`;

/** Minutos desde medianoche → "HH:MM". */
export const fmtMin = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`;

/** "Hora de pared" (ms parseados como UTC) → "HH:MM". */
export const fmtWallTime = (wall: number) => new Date(wall).toISOString().slice(11, 16);

/** "2026-11-19T06:24" → "06:24". */
export const fmtIsoTime = (iso: string) => iso.slice(11, 16);

export const fmtWeekday = (l: Locale, date: string, style: "short" | "long" = "short") =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString(tag(l), { weekday: style, timeZone: "UTC" });

export const fmtDate = (l: Locale, wall: number) =>
  new Date(wall).toLocaleDateString(tag(l), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export const placeLabel = (p: { name: string; region?: string; country?: string }) =>
  [p.name, p.region && p.region !== p.name ? p.region : undefined, p.country].filter(Boolean).join(", ");
