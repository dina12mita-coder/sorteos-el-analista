import boletaAsset from "@/assets/boleta.png";
import { TRAMO_1, TRAMO_2, cop, fechaLarga, pad2, resumenDe, type Boleto } from "./rifa";

/**
 * Boleto individual generado sobre la plantilla oficial (1100 x 1600).
 * Solo se redibujan las zonas dinamicas medidas sobre el arte:
 *  - recuadro del numero          x 423-688  y 713-883
 *  - recuadro del participante    x 180-928  y 981-1074
 *  - insignias de abonos          x 137-421 / 637-921  y 1154-1210
 */
const W = 1100;
const H = 1600;

const NUM_BOX = { x: 421, y: 711, w: 269, h: 174, r: 16 };
const NOMBRE_BOX = { x: 178, y: 979, w: 752, h: 97, r: 46 };
const BADGE_1 = { x: 135, y: 1152, w: 288, h: 60, r: 12 };
const BADGE_2 = { x: 635, y: 1152, w: 288, h: 60, r: 12 };
const DATO_LABEL_Y = 772;
const DATO_VALOR_Y = 812;

const ORO = "#efb02a";
const BLANCO = "#ffffff";
const VERDE = "#28b463";
const TINTA = "#2b2b2b";
const WHATSAPP_VERDE = "#25D366";
const NEGRO = "#000000";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function texto(
  ctx: CanvasRenderingContext2D,
  t: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = "center",
  weight = 900,
  maxW?: number,
) {
  let s = size;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  do {
    ctx.font = `${weight} ${s}px Montserrat, "Arial Black", sans-serif`;
    if (!maxW || ctx.measureText(t).width <= maxW) break;
    s -= 2;
  } while (s > 12);
  ctx.fillText(t, x, y);
}

let plantilla: HTMLImageElement | null = null;

async function cargarPlantilla(): Promise<HTMLImageElement> {
  if (plantilla) return plantilla;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = boletaAsset;
  await img.decode();
  plantilla = img;
  return img;
}

async function cargarFuentes() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all([
    document.fonts.load('900 140px "Montserrat"'),
    document.fonts.load('900 40px "Montserrat"'),
    document.fonts.load('700 26px "Montserrat"'),
  ]);
  await document.fonts.ready;
}

export type DatosComprobante = {
  numero: number;
  nombre: string;
  telefono?: string;
  fecha: string;
  pagado: number;
};

function insignia(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number; r: number },
  valor: number,
  max: number,
) {
  const completo = valor >= max;
  ctx.fillStyle = completo ? VERDE : ORO;
  roundRect(ctx, box.x, box.y, box.w, box.h, box.r);
  ctx.fill();
  const etiqueta = completo ? `${cop(max)} ✓` : valor > 0 ? `ABONADO ${cop(valor)}` : "PENDIENTE";
  texto(
    ctx,
    etiqueta,
    box.x + box.w / 2,
    box.y + box.h / 2 + 2,
    36,
    completo ? BLANCO : TINTA,
    "center",
    900,
    box.w - 26,
  );
}

export async function renderComprobante(d: DatosComprobante): Promise<HTMLCanvasElement> {
  const [img] = await Promise.all([cargarPlantilla(), cargarFuentes()]);
  const r = resumenDe(true, d.pagado);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, W, H);

  // Numero de boleto
  ctx.fillStyle = BLANCO;
  roundRect(ctx, NUM_BOX.x, NUM_BOX.y, NUM_BOX.w, NUM_BOX.h, NUM_BOX.r);
  ctx.fill();
  texto(
    ctx,
    pad2(d.numero),
    NUM_BOX.x + NUM_BOX.w / 2,
    NUM_BOX.y + NUM_BOX.h / 2 + 4,
    140,
    TINTA,
    "center",
    900,
    NUM_BOX.w - 36,
  );

  // Participante
  ctx.fillStyle = BLANCO;
  roundRect(ctx, NOMBRE_BOX.x, NOMBRE_BOX.y, NOMBRE_BOX.w, NOMBRE_BOX.h, NOMBRE_BOX.r);
  ctx.fill();
  texto(
    ctx,
    d.nombre.trim().toUpperCase() || "—",
    NOMBRE_BOX.x + NOMBRE_BOX.w / 2,
    NOMBRE_BOX.y + NOMBRE_BOX.h / 2 + 2,
    62,
    TINTA,
    "center",
    900,
    NOMBRE_BOX.w - 44,
  );

  // Fecha y telefono a los lados del numero
  const dato = (cx: number, label: string, valor: string) => {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundRect(ctx, cx - 150, DATO_LABEL_Y - 32, 300, 92, 16);
    ctx.fill();
    texto(ctx, label, cx, DATO_LABEL_Y, 22, ORO, "center", 800, 270);
    texto(ctx, valor, cx, DATO_VALOR_Y, 30, BLANCO, "center", 900, 270);
  };
  if (d.telefono) dato(232, "TELÉFONO", d.telefono);
  dato(878, "FECHA", fechaLarga(d.fecha));

  // Abonos
  insignia(ctx, BADGE_1, r.tramo1, TRAMO_1);
  insignia(ctx, BADGE_2, r.tramo2, TRAMO_2);

  // Panel inferior: tramos de pago (ocupa toda la seccion baja)
  panelTramos(ctx, r);

  // Pie: contactos de responsables y WhatsApp
  pieContacto(ctx);

  return canvas;
}

function panelTramos(ctx: CanvasRenderingContext2D, r: ReturnType<typeof resumenDe>) {
  const P = { x: 70, y: 1232, w: 960, h: 280, r: 26 };

  ctx.save();
  ctx.fillStyle = "#0a0a0a";
  roundRect(ctx, P.x, P.y, P.w, P.h, P.r);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ORO;
  ctx.stroke();

  texto(ctx, "TRAMOS DE PAGO", P.x + P.w / 2, P.y + 34, 30, ORO, "center", 900, P.w - 60);

  // Totales
  const celdas: Array<[string, string, string]> = [
    ["TOTAL DEL BOLETO", cop(TRAMO_1 + TRAMO_2), BLANCO],
    ["TOTAL PAGADO", cop(r.pagado), r.pendiente === 0 ? VERDE : ORO],
    ["SALDO PENDIENTE", cop(r.pendiente), r.pendiente === 0 ? VERDE : BLANCO],
  ];
  const cw = (P.w - 80) / 3;
  celdas.forEach(([label, valor, color], i) => {
    const cx = P.x + 40 + cw * i;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(ctx, cx + 6, P.y + 50, cw - 12, 70, 14);
    ctx.fill();
    texto(ctx, label, cx + cw / 2, P.y + 72, 18, ORO, "center", 800, cw - 30);
    texto(ctx, valor, cx + cw / 2, P.y + 102, 32, color, "center", 900, cw - 30);
  });

  // Barras de tramos
  const barra = (y: number, titulo: string, valor: number, max: number) => {
    const completo = valor >= max;
    const bx = P.x + 46;
    const bw = P.w - 92;
    texto(ctx, titulo, bx, y, 20, completo ? VERDE : BLANCO, "left", 900, 420);
    texto(
      ctx,
      completo ? `${cop(max)}  ✓ COMPLETADO` : `${cop(valor)} / ${cop(max)}`,
      bx + bw,
      y,
      20,
      completo ? VERDE : ORO,
      "right",
      900,
      460,
    );
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    roundRect(ctx, bx, y + 16, bw, 14, 7);
    ctx.fill();
    const p = Math.max(0, Math.min(1, valor / max));
    if (p > 0) {
      ctx.fillStyle = completo ? VERDE : ORO;
      roundRect(ctx, bx, y + 16, Math.max(14, bw * p), 14, 7);
      ctx.fill();
    }
  };
  barra(P.y + 142, "PRIMER TRAMO", r.tramo1, TRAMO_1);
  barra(P.y + 186, "SEGUNDO TRAMO", r.tramo2, TRAMO_2);

  // Estado
  const estadoColor = r.estado === "PAGADO" ? VERDE : ORO;
  ctx.fillStyle = r.estado === "PAGADO" ? "rgba(40,180,99,0.18)" : "rgba(239,176,42,0.14)";
  roundRect(ctx, P.x + 40, P.y + 218, P.w - 80, 42, 12);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = estadoColor;
  ctx.stroke();
  texto(
    ctx,
    `ESTADO: ${r.estado}`,
    P.x + P.w / 2,
    P.y + 240,
    24,
    estadoColor,
    "center",
    900,
    P.w - 120,
  );

  ctx.restore();
}

function iconoWhatsApp(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;
  ctx.fillStyle = WHATSAPP_VERDE;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BLANCO;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.floor(size * 0.45)}px Montserrat, Arial, sans-serif`;
  ctx.fillText("WA", cx, cy + 1);
}

function pieContacto(ctx: CanvasRenderingContext2D) {
  const yStart = 1515;
  const yEnd = 1590;
  const h = yEnd - yStart;

  ctx.save();
  // Fondo negro para cubrir el texto original y la zona inferior de los recibos
  ctx.fillStyle = NEGRO;
  roundRect(ctx, 0, yStart, W, h, 20);
  ctx.fill();

  const contactos = [
    { numero: "+57 301 8482802", responsable: "GERSON MALDONADO" },
    { numero: "+58 424-7603087", responsable: "JESÚS VALERO" },
  ];

  const iconSize = 26;
  const leftIconX = 90;
  const leftNumX = 126;
  const rightLabelX = 620;
  const rightNameX = 790;
  const startY = yStart + 32;
  const lineHeight = 34;

  contactos.forEach((c, i) => {
    const y = startY + i * lineHeight;
    iconoWhatsApp(ctx, leftIconX, y - iconSize / 2, iconSize);
    texto(ctx, c.numero, leftNumX, y, 24, BLANCO, "left", 900, 420);
    texto(ctx, "RESPONSABLE:", rightLabelX, y, 20, ORO, "left", 800, 150);
    texto(ctx, c.responsable, rightNameX, y, 24, BLANCO, "left", 900, 290);
  });

  ctx.restore();
}

export async function comprobanteDataUrl(d: DatosComprobante) {
  const c = await renderComprobante(d);
  return c.toDataURL("image/png");
}

export async function comprobanteBlob(d: DatosComprobante) {
  const c = await renderComprobante(d);
  return await new Promise<Blob>((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo generar la imagen"))), "image/png"),
  );
}

export function nombreArchivo(b: Pick<Boleto, "numero" | "nombre">) {
  return `boleto-${pad2(b.numero)}-${b.nombre.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}.png`;
}
