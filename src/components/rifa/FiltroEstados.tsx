import { useMemo } from "react";
import { pad2, type EstadoBoleto } from "@/lib/rifa";
import type { Fila } from "@/lib/fila";
import { cn } from "@/lib/utils";

export type FiltroEstado = EstadoBoleto | "TODOS";

export const ESTADOS: EstadoBoleto[] = [
  "DISPONIBLE",
  "APARTADO",
  "PRIMER ABONO",
  "PRIMER TRAMO COMPLETADO",
  "PAGADO",
];

const chipActivo: Record<EstadoBoleto, string> = {
  DISPONIBLE: "border-white bg-white/15 text-white",
  APARTADO: "border-sky-400 bg-sky-400/25 text-sky-200",
  "PRIMER ABONO": "border-gold bg-gold-plate text-primary-foreground",
  "PRIMER TRAMO COMPLETADO": "border-orange-400 bg-orange-400/25 text-orange-200",
  PAGADO: "border-estado-pagado bg-estado-pagado/25 text-estado-pagado",
};

const chipInactivo: Record<EstadoBoleto, string> = {
  DISPONIBLE: "border-white/40 bg-black/40 text-white/75 hover:border-white hover:text-white",
  APARTADO:
    "border-sky-400/50 bg-sky-400/8 text-sky-300/80 hover:border-sky-400 hover:text-sky-200",
  "PRIMER ABONO": "border-gold/60 bg-gold/10 text-gold/85 hover:border-gold hover:text-gold",
  "PRIMER TRAMO COMPLETADO":
    "border-orange-400/50 bg-orange-400/8 text-orange-300/80 hover:border-orange-400 hover:text-orange-200",
  PAGADO:
    "border-estado-pagado/50 bg-estado-pagado/8 text-estado-pagado/80 hover:border-estado-pagado hover:text-estado-pagado",
};

const chipNumero: Record<EstadoBoleto, string> = {
  DISPONIBLE: "border-white/50 text-white/80",
  APARTADO: "border-sky-400/60 text-sky-300",
  "PRIMER ABONO": "border-gold/70 text-gold",
  "PRIMER TRAMO COMPLETADO": "border-orange-400/60 text-orange-300",
  PAGADO: "border-estado-pagado/70 text-estado-pagado",
};

export function FiltroEstados({
  filas,
  filtro,
  onChange,
}: {
  filas: Fila[];
  filtro: FiltroEstado;
  onChange: (f: FiltroEstado) => void;
}) {
  const conteos = useMemo(() => {
    const c: Record<EstadoBoleto, number> = {
      DISPONIBLE: 100 - filas.length,
      APARTADO: 0,
      "PRIMER ABONO": 0,
      "PRIMER TRAMO COMPLETADO": 0,
      PAGADO: 0,
    };
    for (const f of filas) c[f.resumen.estado] += 1;
    return c;
  }, [filas]);

  const listado = useMemo(() => {
    const seleccion = filtro === "TODOS" ? filas : filas.filter((f) => f.resumen.estado === filtro);
    const porNombre = new Map<string, Fila[]>();
    for (const f of seleccion) {
      const arr = porNombre.get(f.boleto.nombre) ?? [];
      arr.push(f);
      porNombre.set(f.boleto.nombre, arr);
    }
    return [...porNombre.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [filas, filtro]);

  return (
    <div className="rounded-lg border border-border/70 bg-card/80 p-3 shadow-sm">
      <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
        FILTRAR PARTICIPANTES POR ESTADO
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange("TODOS")}
          aria-pressed={filtro === "TODOS"}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            filtro === "TODOS"
              ? "border-gold bg-gold/20 text-gold"
              : "border-border/70 bg-black/30 text-muted-foreground hover:border-gold/60 hover:text-gold",
          )}
        >
          TODOS
        </button>
        {ESTADOS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            aria-pressed={filtro === e}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              filtro === e ? chipActivo[e] : chipInactivo[e],
            )}
          >
            {e} ({conteos[e]})
          </button>
        ))}
      </div>

      <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {listado.length === 0 ? (
          <p className="rounded-md bg-black/25 px-2 py-3 text-center text-xs text-muted-foreground">
            No hay participantes con este estado.
          </p>
        ) : (
          listado.map(([nombre, fs]) => (
            <div
              key={nombre}
              className="flex items-baseline justify-between gap-2 rounded-md bg-black/30 px-2 py-1.5"
            >
              <span className="truncate text-xs font-bold">{nombre}</span>
              <span className="flex flex-wrap justify-end gap-1">
                {fs
                  .sort((a, b) => a.boleto.numero - b.boleto.numero)
                  .map((f) => (
                    <span
                      key={f.boleto.id}
                      className={cn(
                        "rounded border px-1 py-0.5 text-[10px] font-black tabular-nums",
                        chipNumero[f.resumen.estado],
                      )}
                    >
                      {pad2(f.boleto.numero)}
                    </span>
                  ))}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
