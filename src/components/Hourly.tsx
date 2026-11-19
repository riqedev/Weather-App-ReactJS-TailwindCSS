import { useLayoutEffect, useRef, useState } from "react";
import type { Forecast } from "@/lib/weather";
import { weather } from "@/lib/wmo";
import { fmtNum, fmtTemp, fmtWallTime } from "@/lib/format";
import { useLocale, useT } from "@/lib/i18n";
import { Tooltip } from "@/components/ui";

const PAD = { left: 34, right: 10 };
const TEMP_H = 120;
const RAIN_H = 64;

/**
 * Dos gráficos chicos que comparten el eje de horas (temperatura y probabilidad de lluvia) en vez de
 * un gráfico con dos ejes Y: cada uno con su escala, alineados para leerlos juntos.
 */
export function Hourly({ data }: { data: Forecast }) {
  const t = useT();
  const { locale } = useLocale();
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  // Layout effect: medir antes de pintar, para no mostrar un cuadro vacío en el primer frame.
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    setWidth(Math.round(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const start = data.hourly.findIndex((h) => h.wall + 3_600_000 > data.current.wall);
  const hours = data.hourly.slice(Math.max(0, start), Math.max(0, start) + 24);

  const iw = Math.max(0, width - PAD.left - PAD.right);
  const col = iw / Math.max(1, hours.length);
  const cx = (i: number) => PAD.left + i * col + col / 2;

  const temps = hours.map((h) => h.temp);
  const tMin = Math.floor(Math.min(...temps) - 1);
  const tMax = Math.ceil(Math.max(...temps) + 1);
  const ty = (v: number) => 14 + (1 - (v - tMin) / (tMax - tMin)) * (TEMP_H - 28);
  const line = hours.map((h, i) => `${i ? "L" : "M"}${cx(i).toFixed(1)},${ty(h.temp).toFixed(1)}`).join("");
  const ry = (p: number) => RAIN_H - 4 - (p / 100) * (RAIN_H - 12);
  const bw = Math.max(2, col * 0.56);

  // Etiquetas directas: mínima y máxima del tramo (no un número en cada punto).
  const iMax = temps.indexOf(Math.max(...temps));
  const iMin = temps.indexOf(Math.min(...temps));

  return (
    <section className="surface rounded-xl p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold tracking-tight">{t.hourly}</h2>

      {/* Íconos cada 3 horas */}
      <div className="relative mb-1 h-6" aria-hidden="true">
        {width > 0 &&
          hours.map((h, i) => {
            if (i % 3) return null;
            const { Icon } = weather(h.code, h.isDay, locale);
            return <Icon key={h.wall} size={16} className="absolute top-0 -translate-x-1/2 text-muted-foreground" style={{ left: cx(i) }} />;
          })}
      </div>

      <div ref={wrap} className="relative" onPointerLeave={() => setHover(null)}>
        {width > 0 && hours.length > 0 && (
          <svg width={width} height={TEMP_H + RAIN_H + 40} role="img" aria-label={`${t.temperature}, ${t.rainChance}`}>
            {/* Temperatura */}
            {[tMin, Math.round((tMin + tMax) / 2), tMax].map((v) => (
              <g key={v}>
                <line x1={PAD.left} x2={width - PAD.right} y1={ty(v)} y2={ty(v)} className="stroke-grid" />
                <text x={PAD.left - 6} y={ty(v) + 3.5} textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                  {fmtNum(locale, v || 0)}°
                </text>
              </g>
            ))}
            <path d={line} fill="none" className="stroke-series-temp" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {[iMax, iMin].map((i, k) => (
              <text
                key={k}
                x={cx(i)}
                y={ty(temps[i]) + (k === 0 ? -8 : 16)}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-medium tabular-nums"
              >
                {fmtTemp(locale, temps[i])}
              </text>
            ))}

            {/* Lluvia */}
            <g transform={`translate(0, ${TEMP_H + 8})`}>
              {[0, 50, 100].map((v) => (
                <g key={v}>
                  <line x1={PAD.left} x2={width - PAD.right} y1={ry(v)} y2={ry(v)} className={v === 0 ? "stroke-axis" : "stroke-grid"} />
                  <text x={PAD.left - 6} y={ry(v) + 3.5} textAnchor="end" className="fill-muted-foreground text-[10px] tabular-nums">
                    {v}%
                  </text>
                </g>
              ))}
              {hours.map((h, i) =>
                h.pop > 0 ? (
                  <rect key={h.wall} x={cx(i) - bw / 2} y={ry(h.pop)} width={bw} height={ry(0) - ry(h.pop)} rx={2} className="fill-series-rain" />
                ) : null,
              )}
            </g>

            {/* Eje de horas */}
            {hours.map((h, i) =>
              i % 3 === 0 ? (
                <text key={h.wall} x={cx(i)} y={TEMP_H + RAIN_H + 30} textAnchor="middle" className="fill-muted-foreground text-[10px] tabular-nums">
                  {fmtWallTime(h.wall).slice(0, 2)}
                </text>
              ) : null,
            )}

            {hover !== null && (
              <g className="pointer-events-none">
                <line x1={cx(hover)} x2={cx(hover)} y1={8} y2={TEMP_H + RAIN_H + 8} className="stroke-foreground/30" />
                <circle cx={cx(hover)} cy={ty(hours[hover].temp)} r={4.5} className="fill-series-temp stroke-black/40" strokeWidth={2} />
              </g>
            )}

            {hours.map((h, i) => (
              <rect key={h.wall} x={PAD.left + i * col} y={0} width={col} height={TEMP_H + RAIN_H + 16} fill="transparent" onPointerEnter={() => setHover(i)} />
            ))}
          </svg>
        )}
        {hover !== null && hours[hover] && (
          <Tooltip x={cx(hover)} y={ty(hours[hover].temp)}>
            <div className="mb-1 text-muted-foreground">
              {fmtWallTime(hours[hover].wall)}, {weather(hours[hover].code, hours[hover].isDay, locale).label}
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="h-0.5 w-3 rounded bg-series-temp" />
                {t.temperature}
              </span>
              <span className="font-semibold tabular-nums">{fmtTemp(locale, hours[hover].temp)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-series-rain" />
                {t.rainChance}
              </span>
              <span className="font-semibold tabular-nums">{hours[hover].pop}%</span>
            </div>
          </Tooltip>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-3 rounded bg-series-temp" />
          {t.temperature}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-series-rain" />
          {t.rainChance}
        </span>
      </div>
    </section>
  );
}
