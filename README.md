# Sorteos El Analista — Los Favoritos · Control de Boletos

Sistema de administración de la rifa **Sorteos El Analista — Los Favoritos**: gestiona los
100 números (00–99), apartados, abonos acumulativos, estados, estadísticas y comprobantes
oficiales descargables en PNG, con persistencia y sincronización en tiempo real vía Supabase.

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19) + [Nitro](https://v3.nitro.build/) — SSR y server functions.
- [Vite](https://vite.dev) + [Tailwind CSS 4](https://tailwindcss.com) + componentes shadcn/ui (Radix).
- [Supabase](https://supabase.com) — Postgres, persistencia y **realtime** entre dispositivos.
- Generación de comprobante/cartón en Canvas sobre el arte oficial (1100×1600).

## Funcionalidades

- Cartón 00–99 con 5 estados: **DISPONIBLE, APARTADO, PRIMER ABONO, PRIMER TRAMO COMPLETADO, PAGADO**.
- Precios: primer tramo **$40.000**, segundo tramo **$35.000**, total **$75.000** (abonos acumulativos).
- Registro de participantes, abonos con fecha, edición y **borrado lógico** (liberar número).
- **Historial de cambios (auditoría)**: cada apartado, abono, edición, liberación y restauración queda registrado con fecha, usuario y detalle; los números liberados pueden restaurarse.
- Comprobante oficial por boleto y cartón general descargables como PNG.
- Panel de estadísticas, buscador por número/nombre/teléfono e historial de boletos.
- Actualización en tiempo real: los cambios se reflejan al instante en todos los dispositivos abiertos.
- Login con sesión propia (cookie httpOnly + CSRF) y diseño responsive (móvil → escritorio).

## Requisitos

- Node.js 20+
- Un proyecto [Supabase](https://supabase.com) propio
- Una cuenta de [Vercel](https://vercel.com) (para desplegar)

## Configuración local

1. Instala dependencias:

   ```sh
   npm install
   ```

2. Copia `.env.example` a `.env` y completa los valores:

   ```sh
   cp .env.example .env
   ```

   Variables necesarias:

   | Variable                        | Dónde se usa | Nota                                                         |
   | ------------------------------- | ------------ | ------------------------------------------------------------ |
   | `SUPABASE_URL`                  | servidor     | URL del proyecto Supabase                                    |
   | `SUPABASE_PUBLISHABLE_KEY`      | servidor     | clave pública (nueva API `sb_publishable_…`)                 |
   | `VITE_SUPABASE_URL`             | navegador    | misma URL                                                    |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | navegador    | clave pública; **solo** valores públicos con prefijo `VITE_` |   | `SESSION_SECRET` | servidor | secreto para firmar la cookie de sesión (**mínimo 32 caracteres**; genera uno con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
   | `APP_USUARIO` / `APP_PASSWORD` | servidor | credenciales del login |

   `SUPABASE_SERVICE_ROLE_KEY` solo es necesaria si usas operaciones admin desde el servidor;
   nunca debe tener prefijo `VITE_`.

3. Arranca el dev server:

   ```sh
   npm run dev
   ```

## Base de datos (Supabase)

La app usa dos tablas (`boletos`, `pagos`) y una de auditoría (`auditoria`). Aplica la
migración en el SQL editor de tu proyecto Supabase:

- `supabase/migrations/20260817_borrado_logico_auditoria.sql` — añade el borrado lógico
  (`eliminado`), el índice único parcial por número activo y la tabla `auditoria`.

### Realtime

Para que el cartón se actualice en tiempo real entre dispositivos:

1. En Supabase → **Database → Replication**, habilita la publicación `supabase_realtime`
   para las tablas `boletos`, `pagos` y `auditoria`.
2. La migración ya intenta añadir `auditoria` a la publicación automáticamente.

### Seguridad (RLS)

Las lecturas/escrituras usan la _publishable key_ desde el navegador, por lo que **debes**
configurar políticas [RLS](https://supabase.com/docs/guides/database/row-level-security)
en las tablas para que solo usuarios autorizados puedan leer/escribir. Las políticas no
están versionadas en este repo: créalas en el dashboard o con `supabase db push`.

## Despliegue en Vercel

1. Sube el proyecto a un repositorio de GitHub/GitLab/Bitbucket.
2. En [vercel.com/new](https://vercel.com/new), importa el repositorio.
   Vercel detecta **TanStack Start** automáticamente (`vercel.json` fuerza el preset).
3. En **Project → Settings → Environment Variables**, añade las mismas variables del
   `.env.example` (todas las que empiezan con `VITE_` van al navegador; el resto quedan
   solo en el servidor).
4. Deploy. Cada push a `main` genera un nuevo despliegue.

Para vincular tu dominio: **Project → Settings → Domains** y añade el dominio.

### Producción actual

- **App:** https://sorteos-el-analista.vercel.app
- **Repo:** https://github.com/dina12mita-coder/sorteos-el-analista
- **Supabase:** proyecto `Rifa management app` (`emjnqrldgkimthkwlnow`) — el login del panel
  se configura con `APP_USUARIO` / `APP_PASSWORD` en las variables de entorno de Vercel.

Comandos útiles:

```sh
npm run dev        # desarrollo
npm run build      # build de producción (TanStack Start + Nitro)
npm run preview    # servidor local del build
npm run lint       # eslint
```

## Estructura

```
src/
  routes/            # rutas (login, panel principal, root shell)
  components/rifa/   # cartón, panel de estadísticas, historial, auditoría, diálogo de boleto
  lib/               # lógica de negocio, canvas (cartón/comprobante), sesión
  integrations/      # cliente Supabase
  assets/            # arte oficial (numeros.png, boleta.png)
supabase/migrations/ # SQL de base de datos
```

Los diseños de cartón y comprobante son los **materiales oficiales de la rifa** y no deben
rediseñarse: la app solo sobrepone los datos dinámicos (número, participante, abonos).



