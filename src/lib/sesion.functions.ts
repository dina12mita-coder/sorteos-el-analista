import { createServerFn } from "@tanstack/react-start";
import {
  getCookie,
  setCookie,
  deleteCookie,
} from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

type SesionData = { usuario?: string };

const USUARIO = "analista";
const PASSWORD = "Gm29507978";
const SECRET = process.env.SESSION_SECRET || "sorteos2026";
const COOKIE = "ses";

function sign(val: string): string {
  const sig = createHmac("sha256", SECRET).update(val).digest("hex");
  return val + "." + sig;
}

function unsign(signed: string): string | null {
  const i = signed.lastIndexOf(".");
  if (i < 0) return null;
  const val = signed.slice(0, i);
  const sig = signed.slice(i + 1);
  const expected = createHmac("sha256", SECRET).update(val).digest("hex");
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return val;
}

export const iniciarSesion = createServerFn({ method: "POST" })
  .validator((data: { usuario: string; password: string }) => data)
  .handler(async ({ data }) => {
    if (data.usuario === USUARIO && data.password === PASSWORD) {
      const token = sign(data.usuario);
      setCookie(COOKIE, token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return { ok: true as const };
    }
    return { ok: false as const };
  });

export const cerrarSesion = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(COOKIE, { path: "/" });
  return { ok: true as const };
});

export const requerirSesion = createServerFn({ method: "GET" }).handler(async () => {
  const cookie = getCookie(COOKIE);
  if (!cookie) throw redirect({ to: "/login" });
  const usuario = unsign(cookie);
  if (!usuario) throw redirect({ to: "/login" });
  return { usuario };
});

export const sesionActiva = createServerFn({ method: "GET" }).handler(async () => {
  const cookie = getCookie(COOKIE);
  if (!cookie) return { activa: false };
  return { activa: Boolean(unsign(cookie)) };
});
