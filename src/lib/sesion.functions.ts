import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

type SesionData = { usuario?: string };

const SECRET = "sorteos2026key";

function getCfg() {
  return {
    password: SECRET,
    name: "sorteos-ses",
    maxAge: 60 * 60 * 12,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
    },
  };
}

export const iniciarSesion = createServerFn({ method: "POST" })
  .inputValidator((data: { usuario: string; password: string }) => data)
  .handler(async ({ data }) => {
    if (data.usuario === "analista" && data.password === "Gm29507978") {
      const session = await useSession<SesionData>(getCfg());
      await session.update({ usuario: data.usuario });
      return { ok: true as const };
    }
    return { ok: false as const };
  });

export const cerrarSesion = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<SesionData>(getCfg());
  await session.clear();
  return { ok: true as const };
});

export const requerirSesion = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<SesionData>(getCfg());
  if (!session.data.usuario) throw redirect({ to: "/login" });
  return { usuario: session.data.usuario };
});

export const sesionActiva = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<SesionData>(getCfg());
  return { activa: Boolean(session.data.usuario) };
});
