import path from "node:path";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";

// Four test projects (https://vitest.dev/guide/projects.html):
//   - "app":       React/DOM unit tests, run in a real browser (Playwright/Chromium).
//   - "server":    módulos de `src/lib/server` que leen `process.env` (claves de
//                  proveedores). No pueden correr en "app": ahí `process.env` se
//                  compila a `{}` y `vi.stubEnv` no tiene nada sobre lo que actuar.
//   - "claude":    agent-harness hook tests, plain Node integration tests that spawn
//                  the .claude/hooks/*.mjs hooks as subprocesses. No DOM, no browser.
//   - "functions": Supabase Edge Function tests. Written for Deno with JSR imports;
//                  Node-only here, with the jsr:/npm: specifiers aliased to their
//                  installed npm equivalents. Aliases are scoped to this project.
// Run everything with `npm run test:unit:app`, or a single suite with
// `npm run test:unit:claude` / `npm run test:unit:functions` (neither boots a browser).
export default defineConfig({
  test: {
    // Un proyecto sin archivos de prueba no es un fallo: hoy le pasa a
    // "functions", cuyas unicas pruebas eran del webhook de correo entrante
    // que se retiro. Sin esto, `npm run test:unit:functions` sale con 1 y
    // tumba el workflow de CI.
    passWithNoTests: true,
    projects: [
      {
        plugins: [react()],
        // La configuracion se lee de `process.env.NEXT_PUBLIC_*`, que Next
        // sustituye al compilar. Estas pruebas corren sobre Vite en un
        // navegador real, donde `process` no existe, asi que se declara vacio:
        // cada prueba monta sus propios datos y no depende del entorno.
        define: {
          "process.env": "{}",
        },
        optimizeDeps: {
          exclude: ["playwright", "playwright-core"],
        },
        resolve: {
          preserveSymlinks: true,
          alias: {
            "@": path.resolve(__dirname, "./src"),
          },
        },
        test: {
          name: "app",
          globals: true,
          browser: {
            headless: true,
            provider: playwright(),
            enabled: true,
            instances: [
              {
                browser: "chromium",
                ...(process.env.CI && {
                  launch: { channel: "chromium-headless-shell" },
                }),
              },
            ],
            commands: {
              // Uses Chrome DevTools Protocol to override the timezone at runtime,
              // since process.env.TZ has no effect in a real browser environment.
              async setTimezone({ context, page }, timezoneId: string) {
                const session = await context.newCDPSession(page);
                await session.send("Emulation.setTimezoneOverride", {
                  timezoneId,
                });
                await session.detach();
              },
            },
          },
          exclude: [
            "**/node_modules/**",
            "doc/**",
            "supabase/**",
            ".supabase-e2e/**",
            "e2e/**/*.spec.{ts,tsx}",
            // Harness hook tests are Node-only (they import node:fs / node:path
            // and spawn subprocesses); they run under the "claude" project below.
            ".claude/**",
            // Código que solo corre en el servidor y lee process.env, que aquí
            // se sustituye por {} para el navegador: va al proyecto "server".
            "src/lib/server/ia/**",
            "src/lib/server/tickets/**",
            "src/lib/server/duplicados/**",
            // Usa node:crypto (firma de los avisos de KontrolIA Auth).
            "src/lib/server/integraciones/**",
            "src/lib/server/deals/**",
            "src/lib/server/companies/**",
            "src/lib/server/automatizaciones/**",
            "src/lib/server/importacion/**",
            // Módulo de facturación: usa node:crypto y process.env.
            "src/lib/server/facturacion/**",
            // Tiempos de soporte: código del servidor, se prueba en Node.
            "src/lib/server/soporte/**",
            "src/lib/server/whatsapp/**",
            // Cada carpeta del proyecto "server" tiene que estar aquí también:
            // si solo se incluye allá, sus pruebas corren dos veces, una de
            // ellas en el navegador.
            "src/lib/server/accionesMasivas/**",
            "src/lib/server/afiliados/**",
            "src/lib/server/bandeja/**",
            "src/lib/server/reparto/**",
            "src/lib/server/correo/comercial.test.ts",
            "src/lib/miDia/**",
          ],
          server: {
            deps: {
              external: [/playwright/],
            },
          },
        },
      },
      {
        resolve: {
          preserveSymlinks: true,
          alias: {
            "@": path.resolve(__dirname, "./src"),
          },
        },
        test: {
          // Módulos de servidor que leen process.env (claves de proveedores).
          // El proyecto "app" corre en un navegador de verdad, donde
          // process.env se compila a {} y `vi.stubEnv` no puede hacer nada.
          name: "server",
          globals: true,
          environment: "node",
          include: [
            "src/lib/miDia/**/*.test.ts",
            "src/lib/server/ia/**/*.test.ts",
            "src/lib/server/tickets/**/*.test.ts",
            "src/lib/server/duplicados/**/*.test.ts",
            "src/lib/server/integraciones/**/*.test.ts",
            "src/lib/server/deals/**/*.test.ts",
            "src/lib/server/companies/**/*.test.ts",
            "src/lib/server/automatizaciones/**/*.test.ts",
            "src/lib/server/importacion/**/*.test.ts",
            "src/lib/server/facturacion/**/*.test.ts",
            "src/lib/server/soporte/**/*.test.ts",
            "src/lib/server/whatsapp/**/*.test.ts",
            "src/lib/server/accionesMasivas/**/*.test.ts",
            "src/lib/server/afiliados/**/*.test.ts",
            "src/lib/server/bandeja/**/*.test.ts",
            "src/lib/server/reparto/**/*.test.ts",
            "src/lib/server/correo/comercial.test.ts",
          ],
          exclude: ["**/node_modules/**"],
        },
      },
      {
        test: {
          name: "claude",
          environment: "node",
          // .claude/ is repo-wide tooling, not part of this app — it stays at
          // the true repo root (two levels up), unlike everything else here.
          include: ["../../.claude/**/*.test.mjs"],
          // These tests spawn `node` subprocesses and do real git/worktree work,
          // so they need more headroom than the default 5s.
          testTimeout: 30000,
          hookTimeout: 30000,
        },
      },
      {
        // Map the Deno imports to the installed npm packages so Vitest can run
        // these Deno-targeted tests in Node without a Deno runtime. These aliases
        // only apply to this project.
        resolve: {
          alias: {
            "jsr:@supabase/supabase-js@2": path.resolve(
              __dirname,
              "node_modules/@supabase/supabase-js",
            ),
            "npm:tldts": path.resolve(__dirname, "node_modules/tldts"),
            "npm:pgsql-ast-parser@^12": "pgsql-ast-parser",
          },
        },
        test: {
          name: "functions",
          globals: true,
          environment: "node",
          include: ["supabase/functions/**/*.test.ts"],
          exclude: ["**/node_modules/**", ".supabase-e2e/**"],
          // Hoy no queda ninguna: las únicas eran del webhook de correo
          // entrante, retirado. El proyecto se queda montado porque sus alias
          // de `jsr:`/`npm:` son lo que permite probar código de Deno en Node,
          // y merge_contacts y delete_note_attachments siguen sin pruebas.
        },
      },
    ],
  },
});
