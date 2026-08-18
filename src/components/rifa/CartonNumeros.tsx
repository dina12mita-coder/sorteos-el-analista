import { pad2, type EstadoBoleto } from "@/lib/rifa";
import type { Fila } from "@/lib/fila";
import { cn } from "@/lib/utils";

const NUMEROS = Array.from({ length: 100 }, (_, i) => i);

const estilos: Record<EstadoBoleto, string> = {
  DISPONIBLE:
    "border-white/35 text-white/85 hover:border-gold hover:text-gold hover:shadow-[var(--glow-gold)]",
  APARTADO: "border-sky-400 text-sky-300 bg-sky-400/12 font-black border-dashed",
  "PRIMER ABONO":
    "border-gold text-primary-foreground bg-gold-plate font-black shadow-[var(--glow-gold)]",
  "PRIMER TRAMO COMPLETADO": "border-orange-400 text-orange-300 bg-orange-400/15 font-black",
  PAGADO:
    "border-estado-pagado text-estado-pagado bg-estado-pagado/12 font-black shadow-[var(--glow-pagado)]",
};

export function CartonNumeros({
  filas,
  resaltados,
  onSelect,
}: {
  filas: Map<number, Fila>;
  resaltados: Set<number> | null;
  onSelect: (numero: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 sm:gap-2.5 lg:grid-cols-10">
      {NUMEROS.map((n) => {
        const fila = filas.get(n);
        const estado: EstadoBoleto = fila?.resumen.estado ?? "DISPONIBLE";
        const atenuado = resaltados !== null && !resaltados.has(n);
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            title={
              fila ? `${pad2(n)} — ${fila.boleto.nombre} (${estado})` : `${pad2(n)} disponible`
            }
            className={cn(
              "aspect-square rounded-full border-2 bg-black/45 text-base font-bold tabular-nums transition-all duration-200 sm:text-lg",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95",
              estilos[estado],
              atenuado && "opacity-20",
            )}
          >
            {pad2(n)}
          </button>
        );
      })}
    </div>
  );
}

export function Leyenda() {
  const items: Array<[EstadoBoleto, string]> = [
    ["DISPONIBLE", "border-white/40 bg-black/40"],
    ["APARTADO", "border-sky-400 border-dashed bg-sky-400/25"],
    ["PRIMER ABONO", "border-gold bg-gold-plate"],
    ["PRIMER TRAMO COMPLETADO", "border-orange-400 bg-orange-400/30"],
    ["PAGADO", "border-estado-pagado bg-estado-pagado/25"],
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold tracking-wide">
      {items.map(([label, cls]) => (
        <span key={label} className="flex items-center gap-2">
          <span className={cn("h-4 w-4 rounded-full border-2", cls)} />
          {label}
        </span>
      ))}
    </div>
  );
}
