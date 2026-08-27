import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

const USUARIO = "analista";
const PASSWORD = "Gm29507978";
const COOKIE = "sorteos_sesion";

export const iniciarSesion = createServerFn({ method: "POST" })
  .validator((data: { usuario: string; password: string }) => data)
  .handler(async ({ data }) => {
    const ok = data.usuario === USUARIO && data.password === PASSWORD;
    if (ok) {
      setCookie(COOKIE, "ok", {
        path: "/",
        maxAge: 86400,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      });
    }
    return { ok };
  });

export const cerrarSesion = createServerFn({ method: "POST" }).handler(
  async () => {
    deleteCookie(COOKIE, { path: "/" });
    return { ok: true } as const;
  },
);

export const requerirSesion = createServerFn({ method: "GET" }).handler(
  async () => {
    const c = getCookie(COOKIE);
    if (!c) throw redirect({ to: "/login" });
    return { usuario: USUARIO };
  },
);

export const sesionActiva = createServerFn({ method: "GET" }).handler(
  async () => {
    const c = getCookie(COOKIE);
    return { activa: !!c };
  },
);
