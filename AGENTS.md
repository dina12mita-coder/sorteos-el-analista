# Guía del proyecto

App TanStack Start (React 19) + Supabase para administrar la rifa
**Sorteos El Analista — Los Favoritos** (cartón 00–99, abonos, comprobantes PNG).

## Reglas importantes

- **No rediseñar** los materiales oficiales (`src/assets/numeros.png`, `boleta.png`).
  La generación de cartón/comprobante se hace por Canvas sobreponiendo solo los datos
  dinámicos; las coordenadas están medidas en `src/lib/carton.ts` y `src/lib/comprobante.ts`.
- **Precios**: primer tramo $40.000, segundo tramo $35.000, total $75.000
  (constantes en `src/lib/rifa.ts`). No cambiar sin confirmar con el cliente.
- **No borrar físicamente boletos**: usa `liberarBoleto`/`restaurarBoleto` (borrado lógico).
  Toda escritura debe registrar auditoría (`src/lib/rifa.ts` → `registrarAuditoria`).
- Los nombres van en mayúsculas y los montos se formatean en pesos colombianos.
- `src/routes/routeTree.gen.ts` es autogenerado: no editarlo a mano.
- Los archivos en `src/integrations/supabase/` son la capa de cliente; no romper su API.

## Comandos

```sh
npm run dev        # desarrollo
npm run build      # build de producción
npm run lint       # eslint
```

## Entorno

Las variables requeridas están en `.env.example`. `VITE_` = navegador, resto = servidor.
La sesión usa cookie propia (`SESSION_SECRET`, `APP_USUARIO`, `APP_PASSWORD`).
