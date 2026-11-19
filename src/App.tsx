import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, RotateCw } from "lucide-react";
import { DEFAULT_PLACE, fetchForecast, midnightUtc, type Forecast, type Place } from "@/lib/weather";
import { LOADING_SKY, skyGradient } from "@/lib/sky";
import { lightWindows } from "@/lib/sun";
import { COPY, LOCALE_STORAGE_KEY, LocaleContext, detectLocale, type Locale } from "@/lib/i18n";
import { Search } from "@/components/Search";
import { Current } from "@/components/Current";
import { Light } from "@/components/Light";
import { Hourly } from "@/components/Hourly";
import { Daily } from "@/components/Daily";

const PLACE_KEY = "riqe-weather-place";

const loadPlace = (): Place => {
  try {
    const raw = localStorage.getItem(PLACE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Place;
      if (typeof p.lat === "number" && typeof p.lon === "number" && p.name) return p;
    }
  } catch {
    // Sin storage o dato corrupto: ciudad por defecto.
  }
  return DEFAULT_PLACE;
};

type State = { status: "loading" } | { status: "error" } | { status: "ready"; data: Forecast; place: Place };

export default function App() {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);
  const t = COPY[locale];
  const [place, setPlace] = useState<Place>(loadPlace);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Vale para esta visita.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchForecast(place, ctrl.signal)
      .then((data) => setState({ status: "ready", data, place }))
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ status: "error" });
      });
    return () => ctrl.abort();
  }, [place, attempt]);

  // El fondo es el cielo de la ciudad elegida: tiempo actual, día o noche, y hora dorada si toca.
  const sky = (() => {
    if (state.status !== "ready") return LOADING_SKY;
    const { data, place: p } = state;
    const w = lightWindows(midnightUtc(data.daily[0].date, data.offset), p.lat, p.lon);
    const now = (data.current.wall / 60_000) % 1440;
    const golden = [w.morningGolden, w.eveningGolden].some((g) => g && now >= g[0] && now < g[1]);
    return skyGradient(data.current.code, data.current.isDay, golden);
  })();

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", sky[0]);
  }, [sky]);

  const choose = (p: Place) => {
    setState({ status: "loading" });
    setPlace(p);
    try {
      localStorage.setItem(PLACE_KEY, JSON.stringify(p));
    } catch {
      // Vale para esta visita.
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <div className="sky min-h-dvh" style={{ background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 100%)` }}>
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-8 sm:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">RIQE Weather</span>
              <span className="text-xs text-muted-foreground">{t.tagline}</span>
            </div>
            <button
              type="button"
              onClick={() => setLocale(locale === "es" ? "en" : "es")}
              aria-label={t.switchTo}
              className="pressable h-9 rounded-lg px-3 text-xs font-medium tracking-wide text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 sm:hidden"
            >
              {locale.toUpperCase()}
            </button>
          </div>
          <div className="flex items-center gap-2 sm:w-full sm:max-w-md">
            <Search onPick={choose} />
            <button
              type="button"
              onClick={() => setLocale(locale === "es" ? "en" : "es")}
              aria-label={t.switchTo}
              className="pressable hidden h-10 rounded-lg px-3 text-xs font-medium tracking-wide text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 sm:block"
            >
              {locale.toUpperCase()}
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-5 sm:gap-6" aria-busy={state.status === "loading"}>
          {state.status === "loading" && (
            <div className="flex flex-1 items-center justify-center gap-2 py-24 text-sm text-muted-foreground" role="status">
              <LoaderCircle size={16} aria-hidden="true" className="animate-spin" />
              {t.loading}
            </div>
          )}

          {state.status === "error" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center" role="alert">
              <p className="text-sm">{t.error}</p>
              <button
                type="button"
                onClick={() => {
                  setState({ status: "loading" });
                  setAttempt((a) => a + 1);
                }}
                className="pressable flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm outline-none hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <RotateCw size={14} aria-hidden="true" />
                {t.retry}
              </button>
            </div>
          )}

          {state.status === "ready" && (
            <>
              <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
                <Current place={state.place} data={state.data} />
                <Light data={state.data} lat={state.place.lat} lon={state.place.lon} />
              </div>
              <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
                <Hourly data={state.data} />
                <Daily data={state.data} />
              </div>
            </>
          )}
        </main>

        <footer className="flex flex-col gap-1 pt-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>
            {t.source}{" "}
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline decoration-foreground/30 underline-offset-4 hover:text-foreground">
              Open-Meteo
            </a>{" "}
            (CC BY 4.0)
          </span>
          <span>
            {t.by}{" "}
            <a href="https://riqedev.github.io" className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
              riqedev
            </a>
          </span>
        </footer>
      </div>
      </div>
    </LocaleContext.Provider>
  );
}
