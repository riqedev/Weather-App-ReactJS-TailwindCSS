/**
 * Cliente de Open-Meteo (pronóstico y geocodificación). Gratis, sin API key y con CORS abierto,
 * así que la app corre 100% en el navegador y no hay secretos que esconder.
 */

export interface Place {
  name: string;
  region?: string;
  country?: string;
  lat: number;
  lon: number;
}

export interface Hour {
  /** "Hora de pared" local, en ms (se parsea como UTC para no mezclar zonas). */
  wall: number;
  temp: number;
  pop: number;
  code: number;
  cloud: number;
  cloudLow: number;
  isDay: boolean;
}

export interface Day {
  date: string; // YYYY-MM-DD local
  code: number;
  max: number;
  min: number;
  pop: number;
  sunrise: string;
  sunset: string;
  uvMax: number;
}

export interface Forecast {
  /** Offset UTC de la ubicación, en segundos. */
  offset: number;
  timezone: string;
  current: {
    wall: number;
    temp: number;
    feels: number;
    humidity: number;
    code: number;
    isDay: boolean;
    wind: number;
    windDir: number;
    gusts: number;
    precip: number;
    cloud: number;
    uv: number;
    visibility: number;
  };
  hourly: Hour[];
  daily: Day[];
}

export const DEFAULT_PLACE: Place = { name: "Temuco", region: "Araucanía", country: "Chile", lat: -38.7397, lon: -72.5901 };

const wall = (iso: string) => Date.parse(`${iso.length === 10 ? `${iso}T00:00` : iso}:00Z`);

/** Instante UTC de la medianoche local de `date` (YYYY-MM-DD). */
export const midnightUtc = (date: string, offset: number) => wall(date) - offset * 1000;

export async function searchPlaces(query: string, lang: string, signal?: AbortSignal): Promise<Place[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({ name: query, count: "6", language: lang, format: "json" }).toString();
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`geocoding ${res.status}`);
  const json = (await res.json()) as { results?: { name: string; admin1?: string; country?: string; latitude: number; longitude: number }[] };
  return (json.results ?? []).map((r) => ({
    name: r.name,
    region: r.admin1,
    country: r.country,
    lat: r.latitude,
    lon: r.longitude,
  }));
}

export async function fetchForecast(place: Place, signal?: AbortSignal): Promise<Forecast> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lon),
    timezone: "auto",
    forecast_days: "8",
    wind_speed_unit: "kmh",
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "weather_code",
      "is_day",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "precipitation",
      "cloud_cover",
      "uv_index",
      "visibility",
    ].join(","),
    hourly: ["temperature_2m", "precipitation_probability", "weather_code", "cloud_cover", "cloud_cover_low", "is_day"].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise",
      "sunset",
      "uv_index_max",
    ].join(","),
  }).toString();

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`forecast ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- respuesta columnar de Open-Meteo
  const j: any = await res.json();
  const c = j.current;
  const h = j.hourly;
  const d = j.daily;

  return {
    offset: j.utc_offset_seconds,
    timezone: j.timezone,
    current: {
      wall: wall(c.time),
      temp: c.temperature_2m,
      feels: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      code: c.weather_code,
      isDay: c.is_day === 1,
      wind: c.wind_speed_10m,
      windDir: c.wind_direction_10m,
      gusts: c.wind_gusts_10m,
      precip: c.precipitation,
      cloud: c.cloud_cover,
      uv: c.uv_index ?? 0,
      visibility: c.visibility ?? 0,
    },
    hourly: (h.time as string[]).map((t, i) => ({
      wall: wall(t),
      temp: h.temperature_2m[i],
      pop: h.precipitation_probability[i] ?? 0,
      code: h.weather_code[i],
      cloud: h.cloud_cover[i],
      cloudLow: h.cloud_cover_low[i],
      isDay: h.is_day[i] === 1,
    })),
    daily: (d.time as string[]).map((t, i) => ({
      date: t,
      code: d.weather_code[i],
      max: d.temperature_2m_max[i],
      min: d.temperature_2m_min[i],
      pop: d.precipitation_probability_max[i] ?? 0,
      sunrise: d.sunrise[i],
      sunset: d.sunset[i],
      uvMax: d.uv_index_max[i] ?? 0,
    })),
  };
}

/* ---------- Calidad de la luz en una ventana ---------- */

export type LightQuality = "clear" | "partial" | "overcast" | "rain";

/**
 * Lectura simple y honesta del cielo durante una hora dorada: nubosidad media (total y baja) y
 * probabilidad de lluvia de las horas que toca la ventana. Las nubes altas y medias con hueco en el
 * horizonte son las que se tiñen; las bajas tapan.
 */
export function lightQuality(hours: Hour[], date: string, from: number, to: number) {
  const start = wall(date) + from * 60_000;
  const end = wall(date) + to * 60_000;
  const inWindow = hours.filter((h) => h.wall + 3_600_000 > start && h.wall < end);
  if (inWindow.length === 0) return null;
  const avg = (k: "cloud" | "cloudLow") => inWindow.reduce((a, h) => a + h[k], 0) / inWindow.length;
  const cloud = avg("cloud");
  const low = avg("cloudLow");
  const pop = Math.max(...inWindow.map((h) => h.pop));
  const quality: LightQuality = pop >= 50 ? "rain" : cloud < 20 ? "clear" : cloud <= 75 && low < 50 ? "partial" : "overcast";
  return { cloud, low, pop, quality };
}

/** Rumbo en grados → punto cardinal (8). */
export const cardinal = (deg: number, labels: readonly string[]) => labels[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
