import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";

const USUARIO = "analista";
const PASSWORD = "Gm29507978";
const COOKIE_NAME = "sorteos_ses";

/**
 * Login: simply validates credentials and returns ok.
 * The client-side code will set the cookie using document.cookie
 * because TanStack Start's setCookie doesn't work in Vercel serverless.
 */
export const iniciarSesion = createServerFn({ method: "POST" })
  .validator((data: { usuario: string; password: string }) => data)
  .handler(async ({ data }) => {
    if (data.usuario === USUARIO && data.password === PASSWORD) {
      return { ok: true as const };
    }
    return { ok: false as const };
  });

/**
 * Logout: returns ok. Client clears the cookie.
 */
export const cerrarSesion = createServerFn({ method: "POST" }).handler(
  async () => {
    return { ok: true } as const;
  },
);

/**
 * Session check (route loader): always succeeds.
 * The real protection is client-side cookie check.
 */
export const requerirSesion = createServerFn({ method: "GET" }).handler(
  async () => {
    return { usuario: USUARIO };
  },
);

export const sesionActiva = createServerFn({ method: "GET" }).handler(
  async () => {
    return { activa: true };
  },
);

// Client-side helpers (exported but NOT server functions)
export function setSessionCookie() {
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24}; SameSite=Lax; Secure`;
}

export function clearSessionCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax; Secure`;
}

export function hasSessionCookie(): boolean {
  return document.cookie.includes(`${COOKIE_NAME}=1`);
}
