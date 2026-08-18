import { Download, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TOTAL_BOLETO, TRAMO_1, TRAMO_2, cop, fechaLarga, pad2 } from "@/lib/rifa";
import type { Fila } from "@/lib/fila";
import { comprobanteBlob, nombreArchivo } from "@/lib/comprobante";

const colorEstado = (estado: string) =>
  estado === "PAGADO"
    ? "border-estado-pagado text-estado-pagado"
    : estado === "APARTADO"
      ? "border-sky-400 text-sky-300"
      : estado === "PRIMER TRAMO COMPLETADO"
        ? "border-orange-400 text-orange-300"
        : "border-gold text-gold";

export function HistorialBoletos({
  filas,
  onAbrir,
}: {
  filas: Fila[];
  onAbrir: (numero: number) => void;
}) {
  const descargar = async (f: Fila) => {
    try {
      const blob = await comprobanteBlob({
        numero: f.boleto.numero,
        nombre: f.boleto.nombre,
        telefono: f.boleto.telefono,
        fecha: f.boleto.fecha,
        pagado: f.resumen.pagado,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo(f.boleto);
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("No se pudo generar el comprobante");
    }
  };

  if (filas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
        Todavía no hay boletos registrados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/70 bg-card/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N°</TableHead>
            <TableHead>Participante</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>1er tramo</TableHead>
            <TableHead>2do tramo</TableHead>
            <TableHead>Total pagado</TableHead>
            <TableHead>Pendiente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((f) => {
            const r = f.resumen;
            return (
              <TableRow key={f.boleto.id}>
                <TableCell className="font-black tabular-nums text-gold">
                  {pad2(f.boleto.numero)}
                </TableCell>
                <TableCell className="font-semibold">{f.boleto.nombre}</TableCell>
                <TableCell className="tabular-nums">{f.boleto.telefono || "—"}</TableCell>
                <TableCell className="tabular-nums">{fechaLarga(f.boleto.fecha)}</TableCell>
                <TableCell
                  className={`tabular-nums ${r.tramo1Completo ? "font-bold text-estado-pagado" : ""}`}
                >
                  {cop(r.tramo1)} / {cop(TRAMO_1)}
                </TableCell>
                <TableCell
                  className={`tabular-nums ${r.tramo2Completo ? "font-bold text-estado-pagado" : ""}`}
                >
                  {cop(r.tramo2)} / {cop(TRAMO_2)}
                </TableCell>
                <TableCell className="tabular-nums font-bold">{cop(r.pagado)}</TableCell>
                <TableCell
                  className={`tabular-nums ${r.pendiente === 0 ? "text-estado-pagado" : ""}`}
                >
                  {cop(r.pendiente)}
                </TableCell>
                <TableCell>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-bold whitespace-nowrap ${colorEstado(r.estado)}`}
                  >
                    {r.estado}
                  </span>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => onAbrir(f.boleto.numero)}>
                    <Pencil /> VER / EDITAR
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => descargar(f)}>
                    <Download /> COMPROBANTE
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
        Valor del puesto {cop(TOTAL_BOLETO)} · Primer tramo {cop(TRAMO_1)} · Segundo tramo{" "}
        {cop(TRAMO_2)}
      </p>
    </div>
  );
}
