import { Droplet } from "lucide-react";
import type { Forecast } from "@/lib/weather";
import { weather } from "@/lib/wmo";
import { fmtTemp, fmtWeekday } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

/** 7 días con barra de rango: todas en la misma escala, para comparar días de un vistazo. */
export function Daily({ data }: { data: Forecast }) {
  const t = useT();
  const { locale } = useLocale();
  const days = data.daily.slice(0, 7);
  const lo = Math.min(...days.map((d) => d.min));
  const hi = Math.max(...days.map((d) => d.max));
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;

  return (
    <section className="surface rounded-xl p-5 sm:p-6">
      <h2 className="mb-3 text-base font-semibold tracking-tight">{t.daily}</h2>
      <ul className="flex flex-col">
        {days.map((d, i) => {
          const { label, Icon } = weather(d.code, true, locale);
          return (
            <li key={d.date} className="grid grid-cols-[4.25rem_1.5rem_3rem_2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2 border-b border-border py-2.5 text-sm last:border-b-0">
              <span className="font-medium first-letter:uppercase">{i === 0 ? t.today : fmtWeekday(locale, d.date)}</span>
              <Icon size={18} aria-label={label} className="text-muted-foreground" />
              <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                {d.pop >= 10 && (
                  <>
                    <Droplet size={11} aria-hidden="true" />
                    {d.pop}%
                  </>
                )}
              </span>
              <span className="text-right text-muted-foreground tabular-nums" aria-label={`${t.low} ${fmtTemp(locale, d.min)}`}>
                {fmtTemp(locale, d.min)}
              </span>
              <span className="relative h-1.5 rounded-full bg-foreground/10" aria-hidden="true">
                <span
                  className="absolute inset-y-0 rounded-full bg-foreground/60"
                  style={{ left: `${pct(d.min)}%`, width: `${Math.max(4, pct(d.max) - pct(d.min))}%` }}
                />
                {i === 0 && (
                  <span
                    className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground ring-2 ring-card"
                    style={{ left: `${pct(Math.min(d.max, Math.max(d.min, data.current.temp)))}%` }}
                  />
                )}
              </span>
              <span className="font-medium tabular-nums" aria-label={`${t.high} ${fmtTemp(locale, d.max)}`}>
                {fmtTemp(locale, d.max)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
