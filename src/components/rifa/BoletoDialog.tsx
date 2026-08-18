import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Download, Loader2, Share2, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  TOTAL_BOLETO,
  TRAMO_1,
  TRAMO_2,
  actualizarBoleto,
  apartarNumero,
  cop,
  eliminarPago,
  fechaLarga,
  hoyISO,
  liberarBoleto,
  pad2,
  registrarPago,
  resumenDe,
} from "@/lib/rifa";
import type { Fila } from "@/lib/fila";
import { comprobanteBlob, comprobanteDataUrl, nombreArchivo } from "@/lib/comprobante";
import { cn } from "@/lib/utils";

type Props = {
  numero: number | null;
  fila: Fila | null;
  onClose: () => void;
  onChanged: () => void;
  usuario?: string;
};

function TramoBarra({
  titulo,
  valor,
  max,
  completo,
}: {
  titulo: string;
  valor: number;
  max: number;
  completo: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        completo ? "border-estado-pagado bg-estado-pagado/10" : "border-border/70 bg-card/70",
      )}
    >
      <div className="flex items-center justify-between text-xs font-bold tracking-widest">
        <span className={completo ? "text-estado-pagado" : "text-muted-foreground"}>{titulo}</span>
        <span className={completo ? "text-estado-pagado" : "text-gold"}>
          {cop(valor)} / {cop(max)}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full", completo ? "bg-estado-pagado" : "bg-gold")}
          style={{ width: `${Math.min(100, (valor / max) * 100)}%` }}
        />
      </div>
      {completo && (
        <p className="mt-2 flex items-center gap-1 text-xs font-black text-estado-pagado">
          <Check className="size-4" /> COMPLETADO
        </p>
      )}
    </div>
  );
}

export function BoletoDialog({ numero, fila, onClose, onChanged, usuario }: Props) {
  const abierto = numero !== null;
  const boleto = fila?.boleto ?? null;
  const pagos = fila?.pagos ?? [];
  const r = fila?.resumen ?? resumenDe(false, 0);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [notas, setNotas] = useState("");
  const [monto, setMonto] = useState("");
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const [guardando, setGuardando] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [confirmar, setConfirmar] = useState<null | "liberar" | { pagoId: string }>(null);

  useEffect(() => {
    if (!abierto) return;
    setNombre(boleto?.nombre ?? "");
    setTelefono(boleto?.telefono ?? "");
    setFecha(boleto?.fecha ?? hoyISO());
    setNotas(boleto?.notas ?? "");
    setMonto("");
    setFechaPago(hoyISO());
    setPreview(null);
  }, [abierto, boleto?.id, boleto?.nombre, boleto?.telefono, boleto?.fecha, boleto?.notas]);

  const datosComprobante = useMemo(
    () => ({
      numero: numero ?? 0,
      nombre: nombre || boleto?.nombre || "",
      telefono: telefono || boleto?.telefono || "",
      fecha,
      pagado: r.pagado,
    }),
    [numero, nombre, telefono, boleto, fecha, r.pagado],
  );

  const validar = () => {
    if (!nombre.trim()) {
      toast.error("Escribe el nombre del participante");
      return false;
    }
    return true;
  };

  const apartar = async () => {
    if (numero === null || !validar()) return;
    setGuardando(true);
    try {
      await apartarNumero({ numero, nombre, telefono, fecha, notas, usuario });
      toast.success("NÚMERO APARTADO", {
        description: `N° ${pad2(numero)} · ${nombre.toUpperCase()} · Pagado ${cop(0)} · Pendiente ${cop(TOTAL_BOLETO)}`,
      });
      onChanged();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      toast.error(
        msg.includes("duplicate") ? "Ese número ya está ocupado" : "No se pudo apartar el número",
      );
    } finally {
      setGuardando(false);
    }
  };

  const guardarCambios = async () => {
    if (!boleto || !validar()) return;
    setGuardando(true);
    try {
      await actualizarBoleto(
        boleto.id,
        {
          nombre: nombre.trim().toUpperCase(),
          telefono: telefono.trim(),
          fecha,
          notas: notas.trim(),
        },
        usuario,
      );
      toast.success("Datos actualizados");
      onChanged();
    } catch {
      toast.error("No se pudo actualizar");
    } finally {
      setGuardando(false);
    }
  };

  /** Aparta el número (si hace falta) y registra el abono acumulativo. */
  const abonar = async () => {
    if (numero === null || !validar()) return;
    const valor = Math.round(Number(monto.replace(/[^\d]/g, "")));
    if (!valor || valor <= 0) {
      toast.error("El valor del abono debe ser mayor a $0");
      return;
    }
    if (valor > r.pendiente) {
      toast.error(
        `Este boleto tiene un saldo pendiente de ${cop(r.pendiente)}. El valor máximo del boleto es ${cop(TOTAL_BOLETO)}.`,
      );
      return;
    }
    setGuardando(true);
    try {
      let id = boleto?.id;
      if (!id) {
        const creado = await apartarNumero({ numero, nombre, telefono, fecha, notas, usuario });
        id = creado.id;
      }
      await registrarPago({ boleto_id: id, monto: valor, fecha: fechaPago, usuario });
      const nuevo = resumenDe(true, r.pagado + valor);
      toast.success(`ABONO REGISTRADO · ${cop(valor)}`, {
        description: `Pagado ${cop(nuevo.pagado)} · Pendiente ${cop(nuevo.pendiente)} · ${nuevo.estado}`,
      });
      setMonto("");
      onChanged();
    } catch {
      toast.error("No se pudo registrar el abono");
    } finally {
      setGuardando(false);
    }
  };

  const borrarPago = async (pagoId: string) => {
    try {
      await eliminarPago(pagoId, usuario);
      toast.success("Abono eliminado");
      onChanged();
    } catch {
      toast.error("No se pudo eliminar el abono");
    } finally {
      setConfirmar(null);
    }
  };

  const liberar = async () => {
    if (!boleto) return;
    try {
      await liberarBoleto(boleto.id, usuario);
      toast.success(`Número ${pad2(boleto.numero)} liberado`);
      onChanged();
      onClose();
    } catch {
      toast.error("No se pudo liberar el número");
    } finally {
      setConfirmar(null);
    }
  };

  const generar = async () => {
    setGenerando(true);
    try {
      setPreview(await comprobanteDataUrl(datosComprobante));
    } catch {
      toast.error("No se pudo generar el comprobante");
    } finally {
      setGenerando(false);
    }
  };

  const descargar = async () => {
    try {
      const blob = await comprobanteBlob(datosComprobante);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo({
        numero: datosComprobante.numero,
        nombre: datosComprobante.nombre,
      });
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("No se pudo descargar el PNG");
    }
  };

  const compartir = async () => {
    try {
      const blob = await comprobanteBlob(datosComprobante);
      const file = new File(
        [blob],
        nombreArchivo({ numero: datosComprobante.numero, nombre: datosComprobante.nombre }),
        { type: "image/png" },
      );
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Boleto ${pad2(datosComprobante.numero)}` });
      } else {
        await descargar();
        toast.info("Compartir no está disponible aquí: se descargó la imagen");
      }
    } catch {
      /* cancelado por el usuario */
    }
  };

  return (
    <>
      <Dialog open={abierto} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border-gold/50">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-3 text-2xl font-black">
              <span className="bg-gold-plate rounded-md px-3 py-1 tabular-nums">
                {numero !== null ? pad2(numero) : "--"}
              </span>
              <span
                className={cn(
                  "tracking-wide",
                  r.estado === "PAGADO" && "text-estado-pagado",
                  r.estado === "APARTADO" && "text-sky-300",
                )}
              >
                {r.estado}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="JUAN PÉREZ"
                  className="uppercase"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="tel">Teléfono</Label>
                  <Input
                    id="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="3000000000"
                    inputMode="tel"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fecha">Fecha de apartado</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notas">Observación (opcional)</Label>
                <Textarea
                  id="notas"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                />
              </div>

              <dl className="grid grid-cols-3 gap-2 rounded-lg border border-border/70 bg-card/70 p-3 text-center">
                <div>
                  <dt className="text-[10px] font-bold tracking-widest text-muted-foreground">
                    TOTAL DEL BOLETO
                  </dt>
                  <dd className="font-black">{cop(TOTAL_BOLETO)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold tracking-widest text-muted-foreground">
                    TOTAL PAGADO
                  </dt>
                  <dd
                    className={cn(
                      "font-black",
                      r.pagado >= TOTAL_BOLETO ? "text-estado-pagado" : "text-gold",
                    )}
                  >
                    {cop(r.pagado)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold tracking-widest text-muted-foreground">
                    SALDO PENDIENTE
                  </dt>
                  <dd className={cn("font-black", r.pendiente === 0 && "text-estado-pagado")}>
                    {cop(r.pendiente)}
                  </dd>
                </div>
              </dl>

              <div className="grid gap-3 sm:grid-cols-2">
                <TramoBarra
                  titulo="PRIMER TRAMO"
                  valor={r.tramo1}
                  max={TRAMO_1}
                  completo={r.tramo1Completo}
                />
                <TramoBarra
                  titulo="SEGUNDO TRAMO"
                  valor={r.tramo2}
                  max={TRAMO_2}
                  completo={r.tramo2Completo}
                />
              </div>

              {r.estado === "PAGADO" && (
                <p className="flex items-center justify-center gap-2 rounded-lg border border-estado-pagado bg-estado-pagado/10 py-2 font-black tracking-widest text-estado-pagado">
                  <Check className="size-5" /> PAGO COMPLETO {cop(TOTAL_BOLETO)} — PAGADO
                </p>
              )}

              {r.pendiente > 0 && (
                <div className="rounded-lg border border-gold/50 bg-card/70 p-3">
                  <p className="mb-2 text-xs font-bold tracking-widest text-gold">
                    REGISTRAR ABONO (máximo {cop(r.pendiente)})
                  </p>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="monto">Valor del abono</Label>
                      <Input
                        id="monto"
                        value={monto}
                        onChange={(e) => setMonto(e.target.value)}
                        placeholder="10000"
                        inputMode="numeric"
                        className="w-40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fpago">Fecha del abono</Label>
                      <Input
                        id="fpago"
                        type="date"
                        value={fechaPago}
                        onChange={(e) => setFechaPago(e.target.value)}
                        className="w-44"
                      />
                    </div>
                    <Button disabled={guardando} onClick={abonar}>
                      {guardando && <Loader2 className="animate-spin" />} REGISTRAR ABONO
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={guardando}
                      onClick={() => setMonto(String(r.pendiente))}
                    >
                      PAGAR SALDO
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-bold tracking-widest text-muted-foreground">
                  HISTORIAL DE PAGOS
                </p>
                {pagos.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                    Sin pagos registrados.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60 rounded-lg border border-border/70 bg-card/70">
                    {pagos.map((p, i) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <span>
                          Pago {i + 1} — <b className="tabular-nums text-gold">{cop(p.monto)}</b>{" "}
                          <span className="text-muted-foreground">{fechaLarga(p.fecha)}</span>
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setConfirmar({ pagoId: p.id })}
                        >
                          <Trash2 />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {boleto && (
                <p className="text-sm text-muted-foreground">
                  Apartado el {fechaLarga(boleto.fecha)}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {!boleto ? (
                  <>
                    <Button disabled={guardando} onClick={apartar}>
                      {guardando && <Loader2 className="animate-spin" />} APARTAR NÚMERO
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                      CANCELAR
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" disabled={guardando} onClick={guardarCambios}>
                      GUARDAR CAMBIOS
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => setConfirmar("liberar")}
                    >
                      <Trash2 /> LIBERAR NÚMERO
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="marquee-frame overflow-hidden rounded-lg bg-black/60">
                {preview ? (
                  <img
                    src={preview}
                    alt={`Comprobante del boleto ${numero !== null ? pad2(numero) : ""}`}
                    className="w-full"
                  />
                ) : (
                  <div className="flex aspect-[11/16] items-center justify-center p-6 text-center text-xs text-muted-foreground">
                    Genera el comprobante oficial con los datos del participante.
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Button onClick={generar} disabled={generando || !nombre.trim()}>
                  {generando ? <Loader2 className="animate-spin" /> : <Sparkles />} GENERAR
                  COMPROBANTE
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={descargar} disabled={!nombre.trim()}>
                    <Download /> PNG
                  </Button>
                  <Button variant="secondary" onClick={compartir} disabled={!nombre.trim()}>
                    <Share2 /> COMPARTIR
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmar !== null} onOpenChange={(o) => !o && setConfirmar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmar === "liberar" ? "¿Liberar este número?" : "¿Eliminar este abono?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmar === "liberar"
                ? "El boleto dejará de mostrarse en el cartón y el número quedará DISPONIBLE. Los datos y los pagos se conservan en el historial de cambios, donde podrás restaurarlo."
                : "El monto se descontará del total pagado del boleto."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmar === "liberar"
                  ? liberar()
                  : confirmar && borrarPago((confirmar as { pagoId: string }).pagoId)
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
