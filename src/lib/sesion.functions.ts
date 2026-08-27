import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";

const USUARIO = "analista";
const PASSWORD = "Gm29507978";
const COOKIE_NAME = "sorteos_ses";

export const iniciarSesion = createServerFn({ method: "POST" })
  .inputValidator((data: { usuario: string; password: string }) => data)
  .handler(async ({ data }) => {
    console.log("=== LOGIN ATTEMPT ===");
    console.log("received usuario:", JSON.stringify(data.usuario));
    console.log("received password:", JSON.stringify(data.password));
    console.log("expected usuario:", USUARIO);
    console.log("expected password:", PASSWORD);

    const userMatch = data.usuario === USUARIO;
    const passMatch = data.password === PASSWORD;
    console.log("userMatch:", userMatch, "passMatch:", passMatch);

    if (userMatch && passMatch) {
      try {
        setCookie(COOKIE_NAME, "1", {
          path: "/",
          maxAge: 86400,
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        });
        console.log("setCookie called OK");
      } catch (e) {
        console.error("setCookie FAILED:", e);
      }
      return { ok: true as const };
    }
    console.log("Login FAILED - wrong credentials");
    return { ok: false as const };
  });

export const cerrarSesion = createServerFn({ method: "POST" }).handler(async () => {
  try {
    deleteCookie(COOKIE_NAME, { path: "/" });
  } catch {}
  return { ok: true } as const;
});

export const requerirSesion = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const c = getCookie(COOKIE_NAME);
    console.log("=== REQUIRE SESSION === cookie:", c);
    if (!c) throw redirect({ to: "/login" });
    return { usuario: USUARIO };
  } catch (e) {
    if (e && typeof e === "object" && "isRedirect" in e) throw e;
    console.error("requireSesion error:", e);
    throw redirect({ to: "/login" });
  }
});

export const sesionActiva = createServerFn({ method: "GET" }).handler(async () => {
  const c = getCookie(COOKIE_NAME);
  return { activa: !!c };
});
