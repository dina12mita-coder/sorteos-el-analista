import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

type SesionData = { usuario?: string };

// Hardcoded credentials - works on Vercel without env vars
const AUTH_USER = "analista";
const AUTH_PASS = "Gm29507978";
const AUTH_SECRET = "sorteos-el-analista-secret-2024-production-key";

function getSessionConfig() {
  return {
    password: AUTH_SECRET,
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
    const inputUser = (data.usuario || "").trim().toLowerCase();
    const inputPass = data.password || "";

    if (inputUser === AUTH_USER.toLowerCase() && inputPass === AUTH_PASS) {
      const session = await useSession<SesionData>(getSessionConfig());
      await session.update({ usuario: AUTH_USER });
      return { ok: true as const };
    }

    return { ok: false as const };
  });

export const cerrarSesion = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<SesionData>(getSessionConfig());
  await session.clear();
  return { ok: true as const };
});

/** Protege las pantallas internas: redirige a /login si no hay sesión. */
export const requerirSesion = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<SesionData>(getSessionConfig());
  if (!session.data.usuario) throw redirect({ to: "/login" });
  return { usuario: session.data.usuario };
});

export const sesionActiva = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<SesionData>(getSessionConfig());
  return { activa: Boolean(session.data.usuario) };
});
