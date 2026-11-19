import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ title, hint, action, children, className }: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface min-w-0 rounded-xl p-5 sm:p-6", className)}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {hint && <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Tooltip flotante. Valor primero, etiqueta después; texto en tinta, nunca en el color de la serie. */
export function Tooltip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-20 min-w-36 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
      style={{ left: x, top: y - 10 }}
    >
      {children}
    </div>
  );
}

export const Swatch = ({ className }: { className: string }) => (
  <span aria-hidden="true" className={cn("inline-block size-2.5 shrink-0 rounded-[3px]", className)} />
);
