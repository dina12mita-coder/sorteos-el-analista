import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";

type SesionData = { usuario?: string };

function config() {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) {
    throw new Error(
      "Falta la variable de entorno SESSION_SECRET. Defínela en .env (local) o en Vercel.",
    );
  }
  return {
    password: secret,
    name: "sorteos-sesion",
    maxAge: 60 * 60 * 12,
    cookie: {
      httpOnly: true,
      // secure solo en producción: en http://localhost la cookie no se guardaría.
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function coincide(a: string, b: string) {
  const x = createHash("sha256").update(a, "utf8").digest();
  const y = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(x, y);
}

export const iniciarSesion = createServerFn({ method: "POST" })
  .inputValidator((data: { usuario: string; password: string }) => data)
  .handler(async ({ data }) => {
    const usuario = process.env["APP_USUARIO"] ?? "";
    const password = process.env["APP_PASSWORD"] ?? "";
    if (!usuario || !password) {
      console.error("Faltan APP_USUARIO/APP_PASSWORD en el entorno: el login queda deshabilitado.");
    }
    const ok =
      usuario.length > 0 &&
      coincide(data.usuario.trim(), usuario) &&
      coincide(data.password, password);
    if (!ok) return { ok: false as const };
    const session = await useSession<SesionData>(config());
    await session.update({ usuario });
    return { ok: true as const };
  });

export const cerrarSesion = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<SesionData>(config());
  await session.clear();
  return { ok: true as const };
});

/** Protege las pantallas internas: redirige a /login si no hay sesión. */
export const requerirSesion = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<SesionData>(config());
  if (!session.data.usuario) throw redirect({ to: "/login" });
  return { usuario: session.data.usuario };
});

export const sesionActiva = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<SesionData>(config());
  return { activa: Boolean(session.data.usuario) };
});
