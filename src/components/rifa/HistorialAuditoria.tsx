import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw } from "lucide-react";
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
import {
  fechaHoraLarga,
  listarAuditoria,
  listarBoletosEliminados,
  pad2,
  restaurarBoleto,
  type Auditoria,
} from "@/lib/rifa";
import { cn } from "@/lib/utils";

const colorAccion: Record<string, string> = {
  APARTAR: "border-gold text-gold",
  ABONO: "border-estado-pagado text-estado-pagado",
  EDITAR: "border-white/40 text-foreground",
  BORRAR_ABONO: "border-orange-400 text-orange-300",
  LIBERAR: "border-destructive text-destructive",
  RESTAURAR: "border-estado-pagado text-estado-pagado",
};

export function HistorialAuditoria({ usuario }: { usuario?: string }) {
  const queryClient = useQueryClient();
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null);

  const { data: auditoria = [] } = useQuery({
    queryKey: ["auditoria"],
    queryFn: () => listarAuditoria(),
  });
  const { data: eliminados = [] } = useQuery({
    queryKey: ["boletos-eliminados"],
    queryFn: listarBoletosEliminados,
  });

  const eliminadosPorId = useMemo(() => new Map(eliminados.map((b) => [b.id, b])), [eliminados]);

  const restaurar = async (b: Auditoria) => {
    if (!b.boleto_id) return;
    setRestaurandoId(b.boleto_id);
    try {
      await restaurarBoleto(b.boleto_id, usuario);
      toast.success(
        b.numero !== null ? `Número ${pad2(b.numero)} restaurado` : "Boleto restaurado",
      );
      queryClient.invalidateQueries({ queryKey: ["boletos"] });
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
      queryClient.invalidateQueries({ queryKey: ["boletos-eliminados"] });
      queryClient.invalidateQueries({ queryKey: ["auditoria"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo restaurar el número");
    } finally {
      setRestaurandoId(null);
    }
  };

  if (auditoria.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
        Todavía no hay cambios registrados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/70 bg-card/70">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>N°</TableHead>
            <TableHead>Detalle</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auditoria.map((a) => {
            const restorable =
              a.accion === "LIBERAR" && a.boleto_id !== null && eliminadosPorId.has(a.boleto_id);
            return (
              <TableRow key={a.id}>
                <TableCell className="tabular-nums whitespace-nowrap">
                  {fechaHoraLarga(a.created_at)}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-bold whitespace-nowrap",
                      colorAccion[a.accion] ?? "border-white/40 text-foreground",
                    )}
                  >
                    {a.accion}
                  </span>
                </TableCell>
                <TableCell className="font-black tabular-nums text-gold">
                  {a.numero !== null ? pad2(a.numero) : "—"}
                </TableCell>
                <TableCell className="max-w-md truncate">{a.detalle || "—"}</TableCell>
                <TableCell className="whitespace-nowrap">{a.usuario || "—"}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {restorable && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={restaurandoId === a.boleto_id}
                      onClick={() => restaurar(a)}
                    >
                      {restaurandoId === a.boleto_id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <RotateCcw />
                      )}{" "}
                      RESTAURAR
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
