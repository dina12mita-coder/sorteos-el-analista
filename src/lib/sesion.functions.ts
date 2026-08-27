import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

type SesionData = { usuario?: string };

const AUTH_USER = "analista";
const AUTH_PASS = "Gm29507978";
const SECRET = "sorteos-secret-key-2024-prod";

function sessCfg() {
  return {
    password: SECRET,
    name: "sorteos-sesion",
    maxAge: 60 * 60 * 12,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

export const iniciarSesion = createServerFn({ method: "POST" })
  .inputValidator((data: { usuario: string; password: string }) => data)
  .handler(async ({ data }) => {
    const user = (data?.usuario ?? "").trim().toLowerCase();
    const pass = data?.password ?? "";

    if (user === AUTH_USER && pass === AUTH_PASS) {
      try {
        const s = await useSession<SesionData>(sessCfg());
        await s.update({ usuario: AUTH_USER });
      } catch (e) {
        // session errors ignored
      }
      return { ok: true as const };
    }

    return { ok: false as const };
  });

export const cerrarSesion = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const s = await useSession<SesionData>(sessCfg());
    await s.clear();
  } catch (e) {
    // ignore
  }
  return { ok: true as const };
});

export const requerirSesion = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const s = await useSession<SesionData>(sessCfg());
    if (s.data.usuario) {
      return { usuario: s.data.usuario };
    }
  } catch (e) {
    // ignore
  }
  throw redirect({ to: "/login" });
});

export const sesionActiva = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const s = await useSession<SesionData>(sessCfg());
    return { activa: Boolean(s.data.usuario) };
  } catch {
    return { activa: false };
  }
});
