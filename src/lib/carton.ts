import numerosAsset from "@/assets/numeros.png";
import { pad2 } from "./rifa";

/**
 * Carton publico 00-99 sobre la plantilla oficial (1100 x 1679).
 * Para el publico solo existen dos estados: DISPONIBLE u OCUPADO.
 * Cualquier numero apartado o con algun abono se marca OCUPADO.
 */
const W = 1100;
const ARTE_H = 1679;
const LEYENDA_H = 190;
const H = ARTE_H + LEYENDA_H;

/** Centros medidos sobre el arte oficial. */
const COL_0 = 168.5;
const COL_STEP = 83.4;
const ROW_0 = 705;
const ROW_STEP = 91.3;
const RADIO = 37;

const ROJO = "#c81d25";
const ROJO_OSCURO = "#7d0f16";
const ORO = "#efb02a";
const BLANCO = "#ffffff";

let plantilla: HTMLImageElement | null = null;

async function cargarPlantilla(): Promise<HTMLImageElement> {
  if (plantilla) return plantilla;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = numerosAsset;
  await img.decode();
  plantilla = img;
  return img;
}

async function cargarFuentes() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all([
    document.fonts.load('900 34px "Montserrat"'),
    document.fonts.load('800 26px "Montserrat"'),
  ]);
  await document.fonts.ready;
}

function centro(n: number) {
  const fila = Math.floor(n / 10);
  const col = n % 10;
  return { x: COL_0 + COL_STEP * col, y: ROW_0 + ROW_STEP * fila };
}

function marcarOcupado(ctx: CanvasRenderingContext2D, n: number) {
  const { x, y } = centro(n);
  const g = ctx.createLinearGradient(x, y - RADIO, x, y + RADIO);
  g.addColorStop(0, ROJO);
  g.addColorStop(1, ROJO_OSCURO);
  ctx.beginPath();
  ctx.arc(x, y, RADIO, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.stroke();

  // El numero del puesto va encima del circulo rojo.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '900 40px Montserrat, "Arial Black", sans-serif';
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = BLANCO;
  ctx.fillText(pad2(n), x, y + 1);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

// Los contactos (WhatsApp + responsables) ya vienen en la plantilla oficial;
// la banda inferior solo agrega la leyenda y el contador.
function leyenda(ctx: CanvasRenderingContext2D, ocupados: number) {
  ctx.fillStyle = "#050508";
  ctx.fillRect(0, ARTE_H, W, LEYENDA_H);
  ctx.strokeStyle = ORO;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, ARTE_H + 1.5, W - 3, LEYENDA_H - 3);

  const cy = ARTE_H + 48;
  ctx.textBaseline = "middle";

  // Disponible
  ctx.beginPath();
  ctx.arc(88, cy, 22, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.font = '800 26px Montserrat, "Arial Black", sans-serif';
  ctx.fillStyle = BLANCO;
  ctx.fillText("DISPONIBLE", 122, cy);

  // Ocupado
  ctx.beginPath();
  ctx.arc(392, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = ROJO;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.stroke();
  ctx.fillStyle = BLANCO;
  ctx.fillText("OCUPADO", 426, cy);

  ctx.textAlign = "right";
  ctx.font = '800 23px Montserrat, "Arial Black", sans-serif';
  ctx.fillStyle = ORO;
  ctx.fillText(`${ocupados}/100 OCUPADOS`, W - 36, cy);

  // Separador
  ctx.strokeStyle = "rgba(239,176,42,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(36, ARTE_H + 84);
  ctx.lineTo(W - 36, ARTE_H + 84);
  ctx.stroke();
}

export async function renderCarton(ocupados: Iterable<number>): Promise<HTMLCanvasElement> {
  const [img] = await Promise.all([cargarPlantilla(), cargarFuentes()]);
  const set = new Set<number>(ocupados);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, W, ARTE_H);

  for (const n of set) {
    if (n >= 0 && n <= 99) marcarOcupado(ctx, n);
  }
  leyenda(ctx, set.size);

  return canvas;
}

export async function cartonDataUrl(ocupados: Iterable<number>) {
  const c = await renderCarton(ocupados);
  return c.toDataURL("image/png");
}

export async function cartonBlob(ocupados: Iterable<number>) {
  const c = await renderCarton(ocupados);
  return await new Promise<Blob>((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error("No se pudo generar el cartón"))), "image/png"),
  );
}

export function nombreCarton() {
  const d = new Date();
  return `carton-los-favoritos-${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}.png`;
}
