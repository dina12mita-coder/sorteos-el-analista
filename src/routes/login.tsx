import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, LockKeyhole } from "lucide-react";

import cartonAsset from "@/assets/numeros.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { iniciarSesion } from "@/lib/sesion.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión | Sorteos El Analista — Los Favoritos" },
      {
        name: "description",
        content:
          "Acceso privado al sistema de control de boletos de la rifa Sorteos El Analista — Los Favoritos.",
      },
      { property: "og:title", content: "Iniciar sesión | Sorteos El Analista" },
      {
        property: "og:description",
        content: "Acceso privado al control de boletos de Los Favoritos.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const router = useRouter();
  const entrar = useServerFn(iniciarSesion);
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const { ok } = await entrar({ data: { usuario, password } });
      if (ok) await router.navigate({ to: "/" });
      else setError("Usuario o contraseña incorrectos.");
    } catch {
      setError("Usuario o contraseña incorrectos.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div
          className="mb-6 rounded-xl border-2 border-gold/60 bg-black bg-top bg-no-repeat shadow-[var(--glow-gold)]"
          style={{ backgroundImage: `url(${cartonAsset})`, backgroundSize: "100% auto" }}
          role="img"
          aria-label="Sorteos El Analista — Los Favoritos"
        >
          <div className="aspect-[1080/420]" />
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-gold/40 bg-card/80 p-6"
        >
          <h1 className="flex items-center gap-2 text-2xl font-black tracking-widest text-gold">
            <LockKeyhole className="size-6" /> INICIAR SESIÓN
          </h1>
          <div className="space-y-1.5">
            <Label htmlFor="usuario">Usuario</Label>
            <Input
              id="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm font-bold text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={cargando}>
            {cargando && <Loader2 className="animate-spin" />} ENTRAR
          </Button>
        </form>
      </div>
    </main>
  );
}
