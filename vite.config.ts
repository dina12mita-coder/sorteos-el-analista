import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// TanStack Start + Nitro: Vercel detecta el framework automáticamente
// (preset "tanstack-start") y compila el servidor a Vercel Functions.
export default defineConfig({
  plugins: [tanstackStart(), nitro(), viteReact(), tailwindcss(), tsConfigPaths()],
});
