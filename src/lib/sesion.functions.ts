import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

type SesionData = { usuario?: string };

const SESSION_SECRET = "sorteos-analista-2026-prod-key-abc123";

function getCookieConfig() {
  return {
    password: SESSION_SECRET,
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
    const ok =
      data.usuario === "analista" && data.password === "Gm29507978";

    if (!ok) {
      return { ok: false as const };
    }

    const session = await useSession<SesionData>(getCookieConfig());
    await session.update({ usuario: "analista" });
    return { ok: true as const };
  });

export const cerrarSesion = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<SesionData>(getCookieConfig());
  await session.clear();
  return { ok: true as const };
});

export const requerirSesion = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<SesionData>(getCookieConfig());
  if (!session.data.usuario) throw redirect({ to: "/login" });
  return { usuario: session.data.usuario };
});

export const sesionActiva = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<SesionData>(getCookieConfig());
  return { activa: Boolean(session.data.usuario) };
});
