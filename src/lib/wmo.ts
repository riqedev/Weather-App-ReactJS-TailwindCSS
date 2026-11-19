import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "./i18n.ts";

/** Códigos de tiempo WMO que usa Open-Meteo → texto e ícono. */
const TABLE: { codes: number[]; es: string; en: string; day: LucideIcon; night?: LucideIcon }[] = [
  { codes: [0], es: "Despejado", en: "Clear", day: Sun, night: Moon },
  { codes: [1], es: "Mayormente despejado", en: "Mainly clear", day: CloudSun, night: CloudMoon },
  { codes: [2], es: "Parcialmente nublado", en: "Partly cloudy", day: CloudSun, night: CloudMoon },
  { codes: [3], es: "Nublado", en: "Overcast", day: Cloud },
  { codes: [45, 48], es: "Niebla", en: "Fog", day: CloudFog },
  { codes: [51, 53, 55], es: "Llovizna", en: "Drizzle", day: CloudDrizzle },
  { codes: [56, 57], es: "Llovizna helada", en: "Freezing drizzle", day: CloudDrizzle },
  { codes: [61, 63], es: "Lluvia", en: "Rain", day: CloudRain },
  { codes: [65], es: "Lluvia intensa", en: "Heavy rain", day: CloudRain },
  { codes: [66, 67], es: "Lluvia helada", en: "Freezing rain", day: CloudRain },
  { codes: [71, 73], es: "Nieve", en: "Snow", day: CloudSnow },
  { codes: [75, 77], es: "Nieve intensa", en: "Heavy snow", day: CloudSnow },
  { codes: [80, 81], es: "Chubascos", en: "Showers", day: CloudRain },
  { codes: [82], es: "Chubascos fuertes", en: "Heavy showers", day: CloudRain },
  { codes: [85, 86], es: "Chubascos de nieve", en: "Snow showers", day: CloudSnow },
  { codes: [95], es: "Tormenta eléctrica", en: "Thunderstorm", day: CloudLightning },
  { codes: [96, 99], es: "Tormenta con granizo", en: "Thunderstorm with hail", day: CloudHail },
];

export function weather(code: number, isDay: boolean, locale: Locale) {
  const row = TABLE.find((r) => r.codes.includes(code)) ?? TABLE[3];
  return { label: row[locale], Icon: !isDay && row.night ? row.night : row.day };
}
