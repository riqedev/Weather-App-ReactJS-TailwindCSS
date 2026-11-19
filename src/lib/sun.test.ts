import { test } from "node:test";
import assert from "node:assert/strict";
import { crossing, daySpans, lightWindows, sunElevation } from "./sun.ts";

/** Medianoche local en UTC para una fecha y un offset (segundos). */
const midnight = (iso: string, offsetSec: number) => Date.parse(`${iso}T00:00:00Z`) - offsetSec * 1000;
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// Referencias de Open-Meteo (amanecer/atardecer = sol a −0,833°).
const CASES = [
  { name: "Temuco", lat: -38.7397, lon: -72.5901, date: "2026-11-19", offset: -10800, sunrise: "06:24", sunset: "20:47" },
  { name: "Reikiavik", lat: 64.1, lon: -21.9, date: "2026-11-19", offset: 0, sunrise: "10:08", sunset: "16:16" },
];

const diff = (a: string, b: string) => {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return Math.abs(ah * 60 + am - (bh * 60 + bm));
};

for (const c of CASES) {
  test(`amanecer y atardecer de ${c.name} a ±3 min de Open-Meteo`, () => {
    const m0 = midnight(c.date, c.offset);
    const rise = crossing(m0, c.lat, c.lon, -0.833, true)!;
    const set = crossing(m0, c.lat, c.lon, -0.833, false)!;
    assert.ok(diff(hhmm(rise), c.sunrise) <= 3, `amanecer ${hhmm(rise)} vs ${c.sunrise}`);
    assert.ok(diff(hhmm(set), c.sunset) <= 3, `atardecer ${hhmm(set)} vs ${c.sunset}`);
  });
}

test("el sol está alto al mediodía en verano austral y bajo en la noche", () => {
  const m0 = midnight("2026-12-21", -10800);
  assert.ok(sunElevation(m0 + 13.5 * 3600_000, -38.74, -72.59) > 65);
  assert.ok(sunElevation(m0 + 2 * 3600_000, -38.74, -72.59) < -20);
});

test("los tramos cubren el día completo en orden", () => {
  const spans = daySpans(midnight("2026-11-19", -10800), -38.74, -72.59);
  assert.equal(spans[0].from, 0);
  assert.equal(spans.at(-1)!.to, 1440);
  for (let i = 1; i < spans.length; i++) assert.equal(spans[i].from, spans[i - 1].to);
  assert.deepEqual(
    spans.map((s) => s.phase),
    ["night", "blue", "golden", "day", "golden", "blue", "night"],
  );
});

test("hora dorada de la tarde termina después del atardecer y antes de la azul", () => {
  const m0 = midnight("2026-11-19", -10800);
  const w = lightWindows(m0, -38.74, -72.59);
  const set = crossing(m0, -38.74, -72.59, -0.833, false)!;
  assert.ok(w.eveningGolden![0] < set && w.eveningGolden![1] > set);
  assert.equal(w.eveningGolden![1], w.eveningBlue![0]);
});
