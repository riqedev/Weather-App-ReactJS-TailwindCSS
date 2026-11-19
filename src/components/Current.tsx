import type { ReactNode } from "react";
import { ArrowUp, CloudRain, Cloud, Droplets, Eye, Sun, Wind } from "lucide-react";
import type { Forecast, Place } from "@/lib/weather";
import { cardinal } from "@/lib/weather";
import { weather } from "@/lib/wmo";
import { fmtDate, fmtNum, fmtTemp, fmtWallTime, placeLabel } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";

const Detail = ({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {icon}
      {label}
    </span>
    <span className="text-sm font-medium tabular-nums">{children}</span>
  </div>
);

const uvLevel = (uv: number) => (uv < 3 ? 0 : uv < 6 ? 1 : uv < 8 ? 2 : uv < 11 ? 3 : 4);

export function Current({ place, data }: { place: Place; data: Forecast }) {
  const t = useT();
  const { locale } = useLocale();
  const c = data.current;
  const today = data.daily[0];
  const { label, Icon } = weather(c.code, c.isDay, locale);

  return (
    <section className="surface flex flex-col gap-6 rounded-xl p-5 sm:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{placeLabel(place)}</h1>
        <p className="text-sm text-muted-foreground first-letter:uppercase">
          {fmtDate(locale, c.wall)}, {fmtWallTime(c.wall)} ({t.localTime.toLowerCase()})
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="flex items-center gap-4">
          <Icon size={56} strokeWidth={1.25} aria-hidden="true" className="text-foreground" />
          <span className="text-6xl font-semibold tracking-tighter tabular-nums">{fmtTemp(locale, c.temp)}</span>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-base font-medium">{label}</span>
          <span className="text-muted-foreground">
            {t.feels} {fmtTemp(locale, c.feels)}
          </span>
          <span className="flex gap-3 text-muted-foreground tabular-nums">
            <span>
              {t.high} {fmtTemp(locale, today.max)}
            </span>
            <span>
              {t.low} {fmtTemp(locale, today.min)}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Detail icon={<Droplets size={13} aria-hidden="true" />} label={t.humidity}>
          {fmtNum(locale, c.humidity)}%
        </Detail>
        <Detail icon={<Wind size={13} aria-hidden="true" />} label={t.wind}>
          <span className="inline-flex items-center gap-1">
            {/* La flecha apunta hacia donde sopla el viento (el dato es de dónde viene). */}
            <ArrowUp size={13} aria-hidden="true" style={{ transform: `rotate(${c.windDir + 180}deg)` }} />
            {fmtNum(locale, c.wind)} km/h {cardinal(c.windDir, t.cardinals)}
          </span>
          <span className="block text-xs font-normal text-muted-foreground">
            {t.gusts} {fmtNum(locale, c.gusts)} km/h
          </span>
        </Detail>
        <Detail icon={<CloudRain size={13} aria-hidden="true" />} label={t.precip}>
          {fmtNum(locale, c.precip, 1)} mm
        </Detail>
        <Detail icon={<Sun size={13} aria-hidden="true" />} label={t.uv}>
          {fmtNum(locale, c.uv, 1)} <span className="font-normal text-muted-foreground">({t.uvLevels[uvLevel(c.uv)]})</span>
        </Detail>
        <Detail icon={<Cloud size={13} aria-hidden="true" />} label={t.clouds}>
          {fmtNum(locale, c.cloud)}%
        </Detail>
        <Detail icon={<Eye size={13} aria-hidden="true" />} label={t.visibility}>
          {c.visibility >= 10_000 ? "> 10 km" : `${fmtNum(locale, c.visibility / 1000, 1)} km`}
        </Detail>
      </div>
    </section>
  );
}
