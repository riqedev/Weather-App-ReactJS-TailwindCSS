import { useMemo, useState } from "react";
import { Sunrise, Sunset } from "lucide-react";
import type { Forecast } from "@/lib/weather";
import { lightQuality, midnightUtc } from "@/lib/weather";
import { daySpans, lightWindows, type Phase } from "@/lib/sun";
import { fmtIsoTime, fmtMin, fmtNum } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const PHASE_CLASS: Record<Phase, string> = {
  night: "bg-foreground/15",
  blue: "bg-blue-hour",
  golden: "bg-golden-hour",
  day: "bg-foreground/5",
};

export function Light({ data, lat, lon }: { data: Forecast; lat: number; lon: number }) {
  const t = useT();
  const { locale } = useLocale();
  const [which, setWhich] = useState<0 | 1>(0);
  const day = data.daily[which];

  const { spans, windows } = useMemo(() => {
    const m0 = midnightUtc(day.date, data.offset);
    return { spans: daySpans(m0, lat, lon), windows: lightWindows(m0, lat, lon) };
  }, [day.date, data.offset, lat, lon]);

  const nowMin = which === 0 ? (data.current.wall / 60_000) % 1440 : null;

  const rows = [
    { key: "morning", label: t.morning, blue: windows.morningBlue, golden: windows.morningGolden },
    { key: "evening", label: t.evening, blue: windows.eveningBlue, golden: windows.eveningGolden },
  ] as const;

  return (
    <section className="surface flex flex-col gap-5 rounded-xl p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{t.light}</h2>
          <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">{t.lightHint}</p>
        </div>
        <div role="tablist" aria-label={t.light} className="flex rounded-lg border border-border p-0.5">
          {([t.today, t.tomorrow] as const).map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={which === i}
              onClick={() => setWhich(i as 0 | 1)}
              className={cn(
                "pressable h-8 rounded-md px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                which === i ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Línea del día: noche, azul, dorada y día, con la hora actual marcada */}
      <div>
        <div className="relative flex h-7 overflow-hidden rounded-md" role="img" aria-label={`${t.blueHour}, ${t.goldenHour}`}>
          {spans.map((s) => (
            <span
              key={`${s.phase}-${s.from}`}
              className={cn("h-full border-r-2 border-card last:border-r-0", PHASE_CLASS[s.phase])}
              style={{ width: `${((s.to - s.from) / 1440) * 100}%` }}
            />
          ))}
          {nowMin !== null && (
            <span aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${(nowMin / 1440) * 100}%` }} />
          )}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground tabular-nums">
          {["00", "06", "12", "18", "24"].map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {(["night", "blue", "golden", "day"] as const).map((p) => (
            <span key={p} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cn("size-2.5 rounded-[3px] ring-1 ring-border", PHASE_CLASS[p])} />
              {{ night: t.night, blue: t.blueHour, golden: t.goldenHour, day: t.daylight }[p]}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <span className="flex items-center gap-2">
          <Sunrise size={16} aria-hidden="true" className="text-muted-foreground" />
          {t.sunrise} <span className="font-medium tabular-nums">{fmtIsoTime(day.sunrise)}</span>
        </span>
        <span className="flex items-center gap-2">
          <Sunset size={16} aria-hidden="true" className="text-muted-foreground" />
          {t.sunset} <span className="font-medium tabular-nums">{fmtIsoTime(day.sunset)}</span>
        </span>
      </div>

      {/* Ventanas con su pronóstico de nubes: el texto es el canal principal, el color solo acompaña */}
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => {
          const q = r.golden ? lightQuality(data.hourly, day.date, r.golden[0], r.golden[1]) : null;
          return (
            <div key={r.key} className="flex flex-col gap-2.5 rounded-lg border border-border p-3.5">
              <span className="text-sm font-medium">{r.label}</span>
              <dl className="flex flex-col gap-1.5 text-sm">
                {r.blue && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-blue-hour" />
                      {t.blueHour}
                    </dt>
                    <dd className="tabular-nums">
                      {fmtMin(r.blue[0])}–{fmtMin(r.blue[1])}
                    </dd>
                  </div>
                )}
                {r.golden && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-golden-hour" />
                      {t.goldenHour}
                    </dt>
                    <dd className="tabular-nums">
                      {fmtMin(r.golden[0])}–{fmtMin(r.golden[1])}
                    </dd>
                  </div>
                )}
              </dl>
              <p className="border-t border-border pt-2.5 text-xs leading-relaxed text-muted-foreground">
                {q ? (
                  <>
                    <span className="font-medium text-foreground tabular-nums">
                      {fmtNum(locale, q.cloud)}% {t.cloudCover}.
                    </span>{" "}
                    {t.quality[q.quality]}
                  </>
                ) : (
                  t.noData
                )}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
