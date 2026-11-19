import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, LocateFixed, MapPin, Search as SearchIcon } from "lucide-react";
import { searchPlaces, type Place } from "@/lib/weather";
import { placeLabel } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/** Combobox de ciudades (patrón ARIA 1.2): escribir, ↑/↓ para moverse, Enter para elegir, Esc para cerrar. */
export function Search({ onPick }: { onPick: (p: Place) => void }) {
  const t = useT();
  const { locale } = useLocale();
  const id = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await searchPlaces(q, locale, ctrl.signal);
        setResults(found);
        setActive(0);
        setOpen(true);
      } catch {
        if (!ctrl.signal.aborted) setResults([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [query, locale]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const pick = (p: Place) => {
    onPick(p);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  const locate = () => {
    setGeoError(false);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        pick({ name: t.myLocationName, lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setGeoError(true);
      },
      { timeout: 10_000, maximumAge: 600_000 },
    );
  };

  const showList = open && query.trim().length >= 2 && !loading;

  return (
    <div ref={wrap} className="relative w-full sm:max-w-md">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            role="combobox"
            aria-label={t.search}
            aria-expanded={showList}
            aria-controls={`${id}-list`}
            aria-activedescendant={showList && results[active] ? `${id}-opt-${active}` : undefined}
            aria-autocomplete="list"
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length < 2) setResults([]);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && results[active]) {
                e.preventDefault();
                pick(results[active]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            className="h-10 w-full rounded-lg border border-border bg-card pr-9 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          />
          {loading && (
            <LoaderCircle size={15} aria-hidden="true" className="absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          aria-label={t.myLocation}
          title={t.myLocation}
          className="pressable grid size-10 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-60"
        >
          {locating ? <LoaderCircle size={16} aria-hidden="true" className="animate-spin" /> : <LocateFixed size={16} aria-hidden="true" />}
        </button>
      </div>

      {showList && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={t.search}
          className="absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-xl"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">{t.noResults}</li>
          ) : (
            results.map((p, i) => (
              <li
                key={`${p.lat},${p.lon}`}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onPointerEnter={() => setActive(i)}
                onClick={() => pick(p)}
                className={cn("flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm", i === active && "bg-muted")}
              >
                <MapPin size={14} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                <span className="truncate">{placeLabel(p)}</span>
              </li>
            ))
          )}
        </ul>
      )}
      {geoError && (
        <p role="alert" className="mt-1.5 text-xs text-muted-foreground">
          {t.geoDenied}
        </p>
      )}
    </div>
  );
}
