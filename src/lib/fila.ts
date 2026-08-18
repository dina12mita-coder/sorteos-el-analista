import type { Boleto, Pago, Resumen } from "./rifa";

export type Fila = {
  boleto: Boleto;
  pagos: Pago[];
  resumen: Resumen;
};
