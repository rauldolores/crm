import nextJest from "next/jest.js";

/**
 * Pruebas sobre el compilador de Next, sin Vite.
 *
 * `next/jest` reutiliza la misma configuracion que usa la aplicacion —alias de
 * rutas, transformacion de TypeScript y JSX con SWC, variables de entorno—, de
 * modo que lo que se prueba se compila igual que lo que se despliega.
 *
 * ANDAMIAJE, todavia no en uso. Es el primer tramo de la salida de Vite, y se
 * verifico que funciona: las pruebas puras pasan bajo Jest sin tocar nada mas
 * que sus importaciones.
 *
 * Lo que impide completar la migracion de golpe es que @types/jest y los
 * globales de Vitest redefinen `expect` de forma incompatible, asi que ambos
 * no pueden convivir en el mismo typecheck. La migracion tiene que ser
 * completa o ninguna: hay que reescribir a la vez los nueve archivos de
 * pruebas de componentes que usan vitest-browser-react, cambiando
 * localizadores, esperas y modelo de renderizado de navegador real a DOM
 * simulado. Storybook tambien depende de Vite y habria que migrarlo a
 * @storybook/nextjs o retirarlo.
 */
const crearConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  /**
   * Jest no transforma node_modules por defecto, pero varias dependencias
   * solo publican modulos ESM y fallan al leerse como CommonJS. Se listan las
   * que hacen falta en lugar de transformar todo, que multiplicaria el tiempo
   * de arranque.
   */
  transformIgnorePatterns: [
    "node_modules/(?!(.pnpm/)?(ra-core|ra-i18n-polyglot|ra-supabase-core|ra-language-|@raphiniert|node-polyglot|inflection|jsonexport|query-string|decode-uri-component|split-on-first|filter-obj|nanoid|@supabase|lucide-react)/)",
  ],
};

export default crearConfig(config);
