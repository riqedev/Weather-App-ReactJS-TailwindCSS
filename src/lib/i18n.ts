import { createContext, useContext } from "react";

export type Locale = "es" | "en";
export const LOCALE_STORAGE_KEY = "riqe-weather-locale";

export const detectLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
  } catch {
    // Storage bloqueado: idioma del navegador.
  }
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
};

const es = {
  tagline: "Pronóstico y luz para fotografía",
  search: "Buscar ciudad",
  searchPlaceholder: "Buscar ciudad…",
  noResults: "Sin resultados para esa búsqueda.",
  myLocation: "Usar mi ubicación",
  myLocationName: "Mi ubicación",
  locating: "Ubicando…",
  geoDenied: "No se pudo obtener tu ubicación. Revisa el permiso del navegador.",
  switchTo: "Switch to English",

  now: "Ahora",
  feels: "Sensación",
  high: "Máx.",
  low: "Mín.",
  localTime: "Hora local",
  humidity: "Humedad",
  wind: "Viento",
  gusts: "ráfagas",
  precip: "Precipitación",
  uv: "Índice UV",
  clouds: "Nubosidad",
  visibility: "Visibilidad",
  uvLevels: ["Bajo", "Moderado", "Alto", "Muy alto", "Extremo"],
  cardinals: ["N", "NE", "E", "SE", "S", "SO", "O", "NO"],

  light: "Luz para fotografía",
  lightHint: "Horas doradas y azules según la posición del sol, con la nubosidad pronosticada en cada una.",
  today: "Hoy",
  tomorrow: "Mañana",
  sunrise: "Salida del sol",
  sunset: "Puesta del sol",
  morning: "Mañana",
  evening: "Tarde",
  blueHour: "Hora azul",
  goldenHour: "Hora dorada",
  night: "Noche",
  daylight: "Día",
  cloudCover: "nubosidad",
  quality: {
    clear: "Despejado: luz cálida y sombras marcadas, cielo sin textura.",
    partial: "Nubes parciales: buena chance de color en el cielo.",
    overcast: "Cubierto: luz suave y pareja, poco color.",
    rain: "Probable lluvia.",
  },
  noData: "Sin pronóstico por hora para esta ventana.",

  hourly: "Próximas 24 horas",
  temperature: "Temperatura",
  rainChance: "Probabilidad de lluvia",
  daily: "Próximos 7 días",

  loading: "Cargando pronóstico…",
  error: "No se pudo cargar el pronóstico.",
  retry: "Reintentar",
  source: "Datos de",
  by: "Hecho por",
};

const en: typeof es = {
  tagline: "Weather and light for photography",
  search: "Search city",
  searchPlaceholder: "Search city…",
  noResults: "No results for that search.",
  myLocation: "Use my location",
  myLocationName: "My location",
  locating: "Locating…",
  geoDenied: "Couldn't get your location. Check the browser permission.",
  switchTo: "Cambiar a español",

  now: "Now",
  feels: "Feels like",
  high: "H",
  low: "L",
  localTime: "Local time",
  humidity: "Humidity",
  wind: "Wind",
  gusts: "gusts",
  precip: "Precipitation",
  uv: "UV index",
  clouds: "Cloud cover",
  visibility: "Visibility",
  uvLevels: ["Low", "Moderate", "High", "Very high", "Extreme"],
  cardinals: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],

  light: "Light for photography",
  lightHint: "Golden and blue hours from the sun's position, with the forecast cloud cover for each one.",
  today: "Today",
  tomorrow: "Tomorrow",
  sunrise: "Sunrise",
  sunset: "Sunset",
  morning: "Morning",
  evening: "Evening",
  blueHour: "Blue hour",
  goldenHour: "Golden hour",
  night: "Night",
  daylight: "Daylight",
  cloudCover: "cloud cover",
  quality: {
    clear: "Clear: warm light and hard shadows, a plain sky.",
    partial: "Partly cloudy: a good chance of color in the sky.",
    overcast: "Overcast: soft, even light with little color.",
    rain: "Rain likely.",
  },
  noData: "No hourly forecast for this window.",

  hourly: "Next 24 hours",
  temperature: "Temperature",
  rainChance: "Chance of rain",
  daily: "Next 7 days",

  loading: "Loading forecast…",
  error: "Couldn't load the forecast.",
  retry: "Retry",
  source: "Data by",
  by: "Made by",
};

export type Copy = typeof es;
export const COPY: Record<Locale, Copy> = { es, en };

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const LocaleContext = createContext<LocaleState>({ locale: "es", setLocale: () => {} });
export const useLocale = () => useContext(LocaleContext);
export const useT = () => COPY[useLocale().locale];
