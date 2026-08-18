import { supabase } from "@/integrations/supabase/client";

/** Estructura definitiva de precios. */
export const TRAMO_1 = 40000;
export const TRAMO_2 = 35000;
export const TOTAL_BOLETO = 75000; // TRAMO_1 + TRAMO_2

export type Boleto = {
  id: string;
  numero: number;
  nombre: string;
  telefono: string;
  fecha: string;
  notas: string;
  eliminado: boolean;
  created_at: string;
  updated_at: string;
};

export type Pago = {
  id: string;
  boleto_id: string;
  monto: number;
  fecha: string;
  nota: string;
  created_at: string;
};

export type Auditoria = {
  id: string;
  boleto_id: string | null;
  numero: number | null;
  accion: string;
  detalle: string | null;
  usuario: string | null;
  created_at: string;
};

export type EstadoBoleto =
  "DISPONIBLE" | "APARTADO" | "PRIMER ABONO" | "PRIMER TRAMO COMPLETADO" | "PAGADO";

export type Resumen = {
  pagado: number;
  pendiente: number;
  tramo1: number;
  tramo2: number;
  tramo1Completo: boolean;
  tramo2Completo: boolean;
  estado: EstadoBoleto;
};

export function resumenDe(existe: boolean, pagado: number): Resumen {
  const total = Math.max(0, Math.min(TOTAL_BOLETO, pagado));
  const tramo1 = Math.min(total, TRAMO_1);
  const tramo2 = Math.max(0, total - TRAMO_1);
  const tramo1Completo = tramo1 >= TRAMO_1;
  const tramo2Completo = tramo2 >= TRAMO_2;

  let estado: EstadoBoleto;
  if (!existe) estado = "DISPONIBLE";
  else if (total <= 0) estado = "APARTADO";
  else if (total < TRAMO_1) estado = "PRIMER ABONO";
  else if (total < TOTAL_BOLETO) estado = "PRIMER TRAMO COMPLETADO";
  else estado = "PAGADO";

  return {
    pagado: total,
    pendiente: TOTAL_BOLETO - total,
    tramo1,
    tramo2,
    tramo1Completo,
    tramo2Completo,
    estado,
  };
}

export const sumaPagos = (pagos: Pago[]) => pagos.reduce((t, p) => t + p.monto, 0);

export const pad2 = (n: number) => n.toString().padStart(2, "0");

export const cop = (n: number) =>
  "$" + new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);

export const fechaLarga = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export const fechaHoraLarga = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

/** Número de un boleto, para enlazar la auditoría aunque el boleto esté liberado. */
async function numeroDeBoleto(boletoId: string): Promise<number | null> {
  try {
    const { data } = await supabase
      .from("boletos")
      .select("numero")
      .eq("id", boletoId)
      .maybeSingle();
    return data?.numero ?? null;
  } catch {
    return null;
  }
}

/** Registro de auditoría best-effort: nunca debe hacer fallar la operación principal. */
async function registrarAuditoria(input: {
  boleto_id?: string | null;
  numero?: number | null;
  accion: string;
  detalle?: string;
  usuario?: string | undefined;
}) {
  try {
    const { error } = await supabase.from("auditoria").insert({
      boleto_id: input.boleto_id ?? null,
      numero: input.numero ?? null,
      accion: input.accion,
      detalle: (input.detalle ?? "").trim(),
      usuario: (input.usuario ?? "").trim() || null,
    });
    if (error) console.error("[auditoria] No se pudo registrar:", error.message);
  } catch (e) {
    console.error("[auditoria] No se pudo registrar:", e);
  }
}

export async function listarBoletos(): Promise<Boleto[]> {
  const { data, error } = await supabase
    .from("boletos")
    .select("*")
    .eq("eliminado", false)
    .order("numero");
  if (error) throw error;
  return (data ?? []) as Boleto[];
}

export async function listarPagos(): Promise<Pago[]> {
  const { data, error } = await supabase
    .from("pagos")
    .select("*")
    .order("fecha")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Pago[];
}

export async function listarBoletosEliminados(): Promise<Boleto[]> {
  const { data, error } = await supabase
    .from("boletos")
    .select("*")
    .eq("eliminado", true)
    .order("numero");
  if (error) throw error;
  return (data ?? []) as Boleto[];
}

export async function listarAuditoria(limit = 200): Promise<Auditoria[]> {
  const { data, error } = await supabase
    .from("auditoria")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Auditoria[];
}

/** Aparta un número (sin dinero) y devuelve el boleto creado. */
export async function apartarNumero(input: {
  numero: number;
  nombre: string;
  telefono: string;
  fecha: string;
  notas?: string;
  usuario?: string | undefined;
}): Promise<Boleto> {
  const { data, error } = await supabase
    .from("boletos")
    .insert({
      numero: input.numero,
      nombre: input.nombre.trim().toUpperCase(),
      telefono: input.telefono.trim(),
      fecha: input.fecha,
      notas: (input.notas ?? "").trim(),
    })
    .select()
    .single();
  if (error) throw error;
  await registrarAuditoria({
    boleto_id: data.id,
    numero: input.numero,
    accion: "APARTAR",
    detalle: input.nombre.trim().toUpperCase(),
    usuario: input.usuario,
  });
  return data as Boleto;
}

export async function actualizarBoleto(
  id: string,
  patch: Partial<Pick<Boleto, "nombre" | "telefono" | "fecha" | "notas">>,
  usuario?: string | undefined,
) {
  const { data: prev } = await supabase.from("boletos").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("boletos").update(patch).eq("id", id);
  if (error) throw error;
  if (prev) {
    const etiquetas = {
      nombre: "nombre",
      telefono: "teléfono",
      fecha: "fecha",
      notas: "observación",
    } as const;
    const cambios = (Object.keys(etiquetas) as Array<keyof typeof etiquetas>).filter(
      (k) => patch[k] !== undefined && patch[k] !== prev[k],
    );
    await registrarAuditoria({
      boleto_id: id,
      numero: prev.numero,
      accion: "EDITAR",
      detalle: cambios.length
        ? `Datos actualizados: ${cambios.map((c) => etiquetas[c]).join(", ")}`
        : "Datos actualizados",
      usuario,
    });
  }
}

/** Libera un número: borrado lógico. El boleto y sus pagos se conservan para auditoría. */
export async function liberarBoleto(id: string, usuario?: string) {
  const { data: prev } = await supabase.from("boletos").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("boletos").update({ eliminado: true }).eq("id", id);
  if (error) throw error;
  if (prev) {
    await registrarAuditoria({
      boleto_id: id,
      numero: prev.numero,
      accion: "LIBERAR",
      detalle: prev.nombre,
      usuario,
    });
  }
}

/** Devuelve un número liberado al cartón, salvo que ya haya sido reasignado. */
export async function restaurarBoleto(id: string, usuario?: string) {
  const { data: prev } = await supabase.from("boletos").select("*").eq("id", id).maybeSingle();
  if (!prev) throw new Error("El boleto ya no existe");
  const { data: ocupado } = await supabase
    .from("boletos")
    .select("id")
    .eq("numero", prev.numero)
    .eq("eliminado", false)
    .neq("id", id)
    .maybeSingle();
  if (ocupado) throw new Error("Ese número ya fue reasignado a otro participante");
  const { error } = await supabase.from("boletos").update({ eliminado: false }).eq("id", id);
  if (error) throw error;
  await registrarAuditoria({
    boleto_id: id,
    numero: prev.numero,
    accion: "RESTAURAR",
    detalle: prev.nombre,
    usuario,
  });
}

export async function registrarPago(input: {
  boleto_id: string;
  monto: number;
  fecha: string;
  nota?: string;
  usuario?: string | undefined;
}) {
  const { error } = await supabase.from("pagos").insert({
    boleto_id: input.boleto_id,
    monto: Math.round(input.monto),
    fecha: input.fecha,
    nota: (input.nota ?? "").trim(),
  });
  if (error) throw error;
  await registrarAuditoria({
    boleto_id: input.boleto_id,
    numero: await numeroDeBoleto(input.boleto_id),
    accion: "ABONO",
    detalle: `Abono de ${cop(Math.round(input.monto))}`,
    usuario: input.usuario,
  });
}

export async function eliminarPago(id: string, usuario?: string) {
  const { data: pago } = await supabase.from("pagos").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("pagos").delete().eq("id", id);
  if (error) throw error;
  if (pago) {
    await registrarAuditoria({
      boleto_id: pago.boleto_id,
      numero: await numeroDeBoleto(pago.boleto_id),
      accion: "BORRAR_ABONO",
      detalle: `Abono de ${cop(pago.monto)} eliminado`,
      usuario,
    });
  }
}
