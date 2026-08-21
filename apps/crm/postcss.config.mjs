/**
 * Tailwind v4 bajo Next.
 *
 * La versión de Vite usa el plugin `@tailwindcss/vite`, que Next no ejecuta:
 * su tubería de CSS pasa por PostCSS. Sin este adaptador, los `@import` de
 * Tailwind y sus complementos no se resuelven y la compilación falla.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
