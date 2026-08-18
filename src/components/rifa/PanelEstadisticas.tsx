import { TOTAL_BOLETO, cop } from "@/lib/rifa";
import type { Fila } from "@/lib/fila";

export function PanelEstadisticas({ filas }: { filas: Fila[] }) {
  const pagados = filas.filter((f) => f.resumen.estado === "PAGADO").length;
  const apartados = filas.filter((f) => f.resumen.estado === "APARTADO").length;
  const enAbono = filas.length - pagados - apartados;
  const disponibles = 100 - filas.length;
  const recibido = filas.reduce((t, f) => t + f.resumen.pagado, 0);
  // Saldo pendiente solo de boletos asignados (no incluye números sin vender).
  const pendiente = filas.reduce((t, f) => t + f.resumen.pendiente, 0);
  const potencial = 100 * TOTAL_BOLETO;

  const items = [
    { label: "TOTAL DE NÚMEROS", valor: "100", tono: "text-foreground" },
    { label: "DISPONIBLES", valor: String(disponibles), tono: "text-foreground" },
    { label: "APARTADOS", valor: String(apartados), tono: "text-sky-300" },
    { label: "CON ABONOS", valor: String(enAbono), tono: "text-gold" },
    { label: "PAGADOS", valor: String(pagados), tono: "text-estado-pagado" },
    { label: "VALOR DEL PUESTO", valor: cop(TOTAL_BOLETO), tono: "text-foreground" },
    { label: "DINERO RECIBIDO", valor: cop(recibido), tono: "text-estado-pagado" },
    { label: "DINERO PENDIENTE", valor: cop(pendiente), tono: "text-marquee" },
    { label: "POTENCIAL TOTAL", valor: cop(potencial), tono: "text-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
      {items.map((i) => (
        <div
          key={i.label}
          className="rounded-lg border border-border/70 bg-card/80 px-3 py-2.5 shadow-sm"
        >
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{i.label}</p>
          <p className={`mt-0.5 truncate text-xl font-black tabular-nums ${i.tono}`}>{i.valor}</p>
        </div>
      ))}
    </div>
  );
}
