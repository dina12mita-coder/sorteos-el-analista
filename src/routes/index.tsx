import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, LogOut, Search } from "lucide-react";
import { toast } from "sonner";

import cartonAsset from "@/assets/numeros.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartonNumeros, Leyenda } from "@/components/rifa/CartonNumeros";
import { PanelEstadisticas } from "@/components/rifa/PanelEstadisticas";
import { HistorialBoletos } from "@/components/rifa/HistorialBoletos";
import { HistorialAuditoria } from "@/components/rifa/HistorialAuditoria";
import { BoletoDialog } from "@/components/rifa/BoletoDialog";
import { listarBoletos, listarPagos, pad2, resumenDe, sumaPagos, type Pago } from "@/lib/rifa";
import type { Fila } from "@/lib/fila";
import { cartonBlob, nombreCarton } from "@/lib/carton";
import { cerrarSesion, requerirSesion } from "@/lib/sesion.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  loader: () => requerirSesion(),
  head: () => ({
    meta: [
      { title: "Control de Boletos | Sorteos El Analista — Los Favoritos" },
      {
        name: "description",
        content:
          "Administra los 100 números de la rifa Los Favoritos: apartados, abonos acumulativos, estados y comprobantes en PNG.",
      },
      { property: "og:title", content: "Control de Boletos | Sorteos El Analista" },
      {
        property: "og:description",
        content: "Cartón 00–99, abonos acumulativos y comprobantes oficiales descargables.",
      },
    ],
  }),
  component: ControlDeBoletos,
});

function ControlDeBoletos() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const salir = useServerFn(cerrarSesion);
  const { usuario } = Route.useLoaderData();
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [descargando, setDescargando] = useState(false);

  const { data: boletos = [] } = useQuery({ queryKey: ["boletos"], queryFn: listarBoletos });
  const { data: pagos = [] } = useQuery({ queryKey: ["pagos"], queryFn: listarPagos });

  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ["boletos"] });
    queryClient.invalidateQueries({ queryKey: ["pagos"] });
    queryClient.invalidateQueries({ queryKey: ["boletos-eliminados"] });
    queryClient.invalidateQueries({ queryKey: ["auditoria"] });
  };

  useEffect(() => {
    const channel = supabase
      .channel("rifa-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "boletos" }, () => {
        queryClient.invalidateQueries({ queryKey: ["boletos"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pagos" }, () => {
        queryClient.invalidateQueries({ queryKey: ["pagos"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "auditoria" }, () => {
        queryClient.invalidateQueries({ queryKey: ["auditoria"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const filas = useMemo<Fila[]>(() => {
    const porBoleto = new Map<string, Pago[]>();
    for (const p of pagos) {
      const arr = porBoleto.get(p.boleto_id) ?? [];
      arr.push(p);
      porBoleto.set(p.boleto_id, arr);
    }
    return boletos.map((b) => {
      const ps = porBoleto.get(b.id) ?? [];
      return { boleto: b, pagos: ps, resumen: resumenDe(true, sumaPagos(ps)) };
    });
  }, [boletos, pagos]);

  const porNumero = useMemo(() => {
    const m = new Map<number, Fila>();
    for (const f of filas) m.set(f.boleto.numero, f);
    return m;
  }, [filas]);

  const q = busqueda.trim().toLowerCase();
  const coincidencias = useMemo(() => {
    if (!q) return null;
    const s = new Set<number>();
    for (let n = 0; n < 100; n++) {
      const f = porNumero.get(n);
      const texto =
        `${pad2(n)} ${f?.boleto.nombre ?? ""} ${f?.boleto.telefono ?? ""}`.toLowerCase();
      if (texto.includes(q)) s.add(n);
    }
    return s;
  }, [q, porNumero]);

  const historial = useMemo(
    () => (coincidencias ? filas.filter((f) => coincidencias.has(f.boleto.numero)) : filas),
    [filas, coincidencias],
  );

  const onSalir = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await salir({ data: undefined });
    await router.navigate({ to: "/login", replace: true });
  };

  const descargarCarton = async () => {
    setDescargando(true);
    try {
      const blob = await cartonBlob(filas.map((f) => f.boleto.numero));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreCarton();
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Cartón descargado con los números ocupados al día");
    } catch {
      toast.error("No se pudo generar el cartón");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-3 pb-16 sm:px-6">
      <div className="flex flex-wrap justify-end gap-2 pt-3">
        <Button size="sm" onClick={descargarCarton} disabled={descargando}>
          {descargando ? <Loader2 className="animate-spin" /> : <Download />} DESCARGAR CARTÓN
        </Button>
        <Button variant="secondary" size="sm" onClick={onSalir}>
          <LogOut /> CERRAR SESIÓN
        </Button>
      </div>

      <header
        className="mt-2 rounded-xl border-2 border-gold/60 bg-black bg-top bg-no-repeat shadow-[var(--glow-gold)]"
        style={{ backgroundImage: `url(${cartonAsset})`, backgroundSize: "100% auto" }}
        role="img"
        aria-label="Sorteos El Analista — Los Favoritos"
      >
        <div className="aspect-[1080/700]" />
      </header>

      <h1 className="mt-6 text-center text-3xl font-black tracking-[0.15em] text-gold sm:text-4xl">
        CONTROL DE BOLETOS
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[380px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <PanelEstadisticas filas={filas} />
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar número, nombre o teléfono"
              className="pl-9"
              aria-label="Buscar boletos"
            />
          </div>
          <Leyenda />
        </aside>

        <section className="rounded-xl border border-gold/40 bg-black/45 p-3 sm:p-5">
          <CartonNumeros filas={porNumero} resaltados={coincidencias} onSelect={setSeleccion} />
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-black tracking-widest text-gold">HISTORIAL DE BOLETOS</h2>
        <HistorialBoletos filas={historial} onAbrir={setSeleccion} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-black tracking-widest text-gold">HISTORIAL DE CAMBIOS</h2>
        <HistorialAuditoria usuario={usuario} />
      </section>

      <BoletoDialog
        numero={seleccion}
        fila={seleccion === null ? null : (porNumero.get(seleccion) ?? null)}
        onClose={() => setSeleccion(null)}
        onChanged={refrescar}
        usuario={usuario}
      />
    </main>
  );
}
