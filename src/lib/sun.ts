/**
 * Elevación del sol (aproximación de bajo costo del NOAA/Almanac, error < 0,2° en 1950–2050).
 * Alcanza para ubicar horas doradas y azules al minuto; no es para astronomía de precisión.
 */
const RAD = Math.PI / 180;
const J2000 = 946_728_000_000; // 2000-01-01T12:00:00Z

export function sunElevation(utcMs: number, lat: number, lon: number) {
  const d = (utcMs - J2000) / 86_400_000;
  const g = (357.529 + 0.98560028 * d) * RAD; // anomalía media
  const q = 280.459 + 0.98564736 * d; // longitud media
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD; // longitud eclíptica
  const e = (23.439 - 0.00000036 * d) * RAD; // oblicuidad
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)); // ascensión recta
  const dec = Math.asin(Math.sin(e) * Math.sin(L)); // declinación
  const gmst = (18.697374558 + 24.06570982441908 * d) * 15; // tiempo sidéreo en grados
  const ha = (gmst + lon) * RAD - ra; // ángulo horario
  const phi = lat * RAD;
  return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha)) / RAD;
}

/** Bandas de luz por elevación solar. Convención fotográfica habitual. */
export type Phase = "night" | "blue" | "golden" | "day";
export const phaseOf = (elev: number): Phase =>
  elev < -6 ? "night" : elev < -4 ? "blue" : elev < 6 ? "golden" : "day";

export interface Span {
  phase: Phase;
  /** Minutos desde la medianoche local. */
  from: number;
  to: number;
}

/**
 * Divide un día local (minutos 0–1440) en tramos de luz.
 * `midnightUtc` = instante UTC de la medianoche local de ese día.
 */
export function daySpans(midnightUtc: number, lat: number, lon: number): Span[] {
  const spans: Span[] = [];
  // Cada minuto m cubre [m, m+1), así los tramos quedan contiguos y suman 1440.
  for (let m = 0; m < 1440; m++) {
    const p = phaseOf(sunElevation(midnightUtc + (m + 0.5) * 60_000, lat, lon));
    const last = spans.at(-1);
    if (last && last.phase === p) last.to = m + 1;
    else spans.push({ phase: p, from: m, to: m + 1 });
  }
  return spans;
}

/** Minuto local en que el sol cruza `elev` subiendo (amanecer) o bajando (atardecer). */
export function crossing(midnightUtc: number, lat: number, lon: number, elev: number, rising: boolean) {
  let prev = sunElevation(midnightUtc, lat, lon);
  for (let m = 1; m <= 1440; m++) {
    const cur = sunElevation(midnightUtc + m * 60_000, lat, lon);
    if (rising ? prev < elev && cur >= elev : prev > elev && cur <= elev) return m;
    prev = cur;
  }
  return null;
}

/** Horas doradas y azules de mañana y tarde. Puede faltar alguna en latitudes extremas. */
export interface LightWindows {
  morningBlue?: [number, number];
  morningGolden?: [number, number];
  eveningGolden?: [number, number];
  eveningBlue?: [number, number];
}

export function lightWindows(midnightUtc: number, lat: number, lon: number): LightWindows {
  const spans = daySpans(midnightUtc, lat, lon);
  const out: LightWindows = {};
  const noon = 720;
  for (const s of spans) {
    const morning = s.from < noon;
    if (s.phase === "blue") out[morning ? "morningBlue" : "eveningBlue"] = [s.from, s.to];
    if (s.phase === "golden") out[morning ? "morningGolden" : "eveningGolden"] = [s.from, s.to];
  }
  return out;
}
