import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

type SesionData = { usuario?: string };

const USUARIO = "analista";
const PASSWORD = "Gm29507978";
const SECRET = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0";

function config() {
  return {
    password: SECRET,
    name: "sorteos-ses",
    maxAge: 60 * 60 * 24,
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
    const ok = data.usuario === USUARIO && data.password === PASSWORD;
    if (!ok) return { ok: false as const };
    try {
      const session = await useSession<SesionData>(config());
      await session.update({ usuario: data.usuario });
    } catch (e) {
      console.error("session error:", e);
    }
    return { ok: true as const };
  });

export const cerrarSesion = createServerFn({ method: "POST" }).handler(
  async () => {
    try {
      const session = await useSession<SesionData>(config());
      await session.clear();
    } catch {}
    return { ok: true as const };
  },
);

export const requerirSesion = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const session = await useSession<SesionData>(config());
      if (!session.data?.usuario) throw redirect({ to: "/login" });
      return { usuario: session.data.usuario };
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "isRedirect" in (e as Record<string, unknown>)
      )
        throw e;
      throw redirect({ to: "/login" });
    }
  },
);

export const sesionActiva = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const session = await useSession<SesionData>(config());
      return { activa: Boolean(session.data?.usuario) };
    } catch {
      return { activa: false };
    }
  },
);
