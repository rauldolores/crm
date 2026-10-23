#!/usr/bin/env node

import { globSync } from "glob";
import fs from "node:fs";
import path from "node:path";

const registryPath = "registry.json";
const basePath = "src";
// Los patrones de glob deben usar barras normales en todas las plataformas: en
// Windows `path.join` genera backslashes, que glob interpreta como escapes y no
// como separadores, devolviendo cero resultados y vaciando el registry.
const crmComponentsPath = path.posix.join(basePath, "components", "crm");
const supabaseComponentsPath = path.posix.join(
  basePath,
  "components",
  "supabase",
);
const hooksPath = path.posix.join(basePath, "hooks");
const libPath = path.posix.join(basePath, "lib");

const excludedHooks = [
  "filter-context.tsx",
  "saved-queries.tsx",
  "use-mobile.ts",
  "useSupportCreateSuggestion.tsx",
];

const excludedLibFiles = [
  "field.type.ts",
  "genericMemo.ts",
  "i18nProvider.ts",
  "sanitizeInputRestProps.ts",
  "utils.ts",
];

const testFilePattern = "**/*.{test,spec}.*";
const storyFilePattern = "**/*.stories.*";

// Lo mismo para las cuatro rutas. Antes solo los componentes ignoraban las
// pruebas, así que el registry publicaba los .test.ts de src/lib y src/hooks.
//
// `__screenshots__` es donde vitest guarda la captura de una prueba fallida,
// en una carpeta con nombre de archivo (`__screenshots__/x.test.ts/…png`).
// Está en .gitignore, pero el glob no lo lee: sin excluirla, el registry se
// llenaba de esas carpetas cada vez que alguien tenía una prueba roja, y el
// archivo quedaba modificado sin que nadie lo hubiera tocado.
const ignorados = [testFilePattern, storyFilePattern, "**/__screenshots__/**"];

// `nodir`: el patrón **/*.ts* también encaja con una CARPETA llamada
// `x.test.ts` (justo las de las capturas). Solo interesan archivos.
const soloArchivos = { ignore: ignorados, nodir: true };

// glob devuelve los resultados con el separador nativo, asi que en Windows
// llegan con backslashes. El registry se publica y se versiona, por lo que sus
// rutas deben ser identicas en cualquier plataforma: siempre con barras.
const globPosix = (pattern, options) =>
  globSync(pattern, options)
    .map((match) => match.split(path.sep).join(path.posix.sep))
    .sort();

const crmComponents = globPosix(
  path.posix.join(crmComponentsPath, "**", "*.ts*"),
  soloArchivos,
);
const supabaseComponents = globPosix(
  path.posix.join(supabaseComponentsPath, "**", "*.ts*"),
  soloArchivos,
);
const hooks = globPosix(
  path.posix.join(hooksPath, "**", "*.ts*"),
  soloArchivos,
).filter((hook) => {
  return !excludedHooks.includes(path.basename(hook));
});
const libFiles = globPosix(
  path.posix.join(libPath, "**", "*.ts*"),
  soloArchivos,
).filter((file) => {
  return !excludedLibFiles.includes(path.basename(file));
});
const changelogPath = "CHANGELOG.md";

const registryContent = JSON.parse(fs.readFileSync(registryPath, "utf-8"));

const files = [
  ...crmComponents.map((path) => {
    return {
      path,
      type: "registry:component",
    };
  }),
  ...supabaseComponents.map((path) => {
    return {
      path,
      type: "registry:component",
    };
  }),
  ...hooks.map((path) => {
    return {
      path,
      type: "registry:hook",
    };
  }),
  ...libFiles.map((path) => {
    return {
      path,
      type: "registry:lib",
    };
  }),
  {
    path: changelogPath,
    type: "registry:file",
    target: "~/CHANGELOG.md",
  },
];

const newRegistryContent = {
  ...registryContent,
  items: registryContent.items.map((item) => {
    if (item.name === "vinqulia") {
      return {
        ...item,
        files,
      };
    }

    return item;
  }),
};

// El salto de linea final es obligatorio: sin el, Prettier marca el archivo
// cada vez que se regenera y `make lint` falla tras cada commit.
fs.writeFileSync(
  registryPath,
  `${JSON.stringify(newRegistryContent, null, 2)}\n`,
  "utf-8",
);
