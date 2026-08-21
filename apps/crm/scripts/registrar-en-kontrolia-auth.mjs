#!/usr/bin/env node
/**
 * Registra Vinqulia en una instalación de KontrolIA Auth.
 *
 * Hace tres cosas, y todas son idempotentes: se puede volver a ejecutar sin
 * duplicar nada.
 *
 *   1. Da de alta la aplicación `crm`.
 *   2. Registra su catálogo de permisos (src/lib/kontrolia-auth/permissions-catalog.ts,
 *      que es la única fuente de verdad: este script no lleva su propia copia).
 *   3. Crea el cliente OAuth público (PKCE) con los redirect_uri indicados.
 *
 * Equivale a lo que hace `registerApplication()` de @kontrolia/db, pero contra
 * la API REST en lugar de Postgres directo, así que no hace falta la cadena de
 * conexión ni añadir el paquete `pg`. Además evita un fallo conocido de esa
 * función: sigue insertando `applications.api_key_hash`, columna que la
 * migración 0040 eliminó, por lo que hoy falla contra el esquema actual.
 *
 * El service role key NO se pasa por argumento ni queda en el historial del
 * shell: se pide por entrada estándar.
 *
 *   node scripts/registrar-en-kontrolia-auth.mjs \
 *     --auth-url https://<proyecto>.supabase.co \
 *     --redirect http://localhost:3001/oauth/callback \
 *     --redirect https://midominio.com/oauth/callback
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const SLUG = "crm";
const NOMBRE = "Vinqulia";
const CATALOGO = "src/lib/kontrolia-auth/permissions-catalog.ts";

function leerArgumentos() {
  const args = process.argv.slice(2);
  const opciones = { authUrl: "", redirects: [], entorno: "production" };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--auth-url") opciones.authUrl = args[++i];
    else if (args[i] === "--redirect") opciones.redirects.push(args[++i]);
    else if (args[i] === "--entorno") opciones.entorno = args[++i];
  }

  if (!opciones.authUrl) {
    console.error(
      "Falta --auth-url (la URL del proyecto Supabase de KontrolIA Auth).",
    );
    process.exit(1);
  }
  if (opciones.redirects.length === 0) {
    console.error("Falta al menos un --redirect (la URL de retorno del CRM).");
    process.exit(1);
  }
  return opciones;
}

/**
 * Extrae el catálogo del archivo TypeScript sin compilarlo. Se hace por
 * expresión regular a propósito: añadir un transpilador solo para leer una
 * lista de constantes no compensa, y si el formato cambia el script falla de
 * forma ruidosa en lugar de registrar permisos incompletos.
 */
function leerCatalogo() {
  const ruta = path.resolve(process.cwd(), CATALOGO);
  const texto = fs.readFileSync(ruta, "utf-8");
  const patron =
    /\{\s*resource:\s*"([^"]+)",\s*action:\s*"([^"]+)",\s*description:\s*"([^"]+)"\s*\}/g;
  const permisos = [...texto.matchAll(patron)].map((m) => ({
    resource: m[1],
    action: m[2],
    description: m[3],
    key: `${SLUG}.${m[1]}.${m[2]}`,
  }));

  if (permisos.length === 0) {
    throw new Error(
      `No se pudo extraer ningún permiso de ${CATALOGO}. ¿Cambió su formato?`,
    );
  }
  return permisos;
}

function preguntarOculto(pregunta) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    // Se desactiva el eco para que la clave no quede visible en pantalla.
    const alEscribir = rl._writeToOutput;
    rl._writeToOutput = function (texto) {
      if (texto.includes(pregunta)) alEscribir.call(rl, texto);
    };
    rl.question(pregunta, (respuesta) => {
      rl._writeToOutput = alEscribir;
      rl.output.write("\n");
      rl.close();
      resolve(respuesta.trim());
    });
  });
}

async function llamar(url, clave, { metodo = "GET", cuerpo, esquema } = {}) {
  const cabeceras = {
    apikey: clave,
    Authorization: `Bearer ${clave}`,
    "Content-Type": "application/json",
    Prefer: "return=representation,resolution=merge-duplicates",
  };
  if (esquema) {
    cabeceras["Accept-Profile"] = esquema;
    cabeceras["Content-Profile"] = esquema;
  }

  const respuesta = await fetch(url, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await respuesta.text();
  let datos;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = texto;
  }

  if (!respuesta.ok) {
    const detalle = datos?.message || datos?.error || texto;
    throw new Error(`${metodo} ${url} -> ${respuesta.status}: ${detalle}`);
  }
  return datos;
}

async function main() {
  const { authUrl, redirects, entorno } = leerArgumentos();
  const base = authUrl.replace(/\/$/, "");
  const permisos = leerCatalogo();

  console.log(`\nKontrolIA Auth: ${base}`);
  console.log(`Aplicación:     ${NOMBRE} (${SLUG}, ${entorno})`);
  console.log(`Permisos:       ${permisos.length}`);
  console.log(`Retornos:       ${redirects.join(", ")}\n`);
  console.log(
    "Necesito el service role key del proyecto (Settings -> API -> service_role).",
  );
  console.log("No se guarda en ningún archivo ni se muestra en pantalla.\n");

  const clave = await preguntarOculto("service role key: ");
  if (!clave) {
    console.error("No se recibió la clave. Cancelado.");
    process.exit(1);
  }

  // 1. Aplicación
  const [aplicacion] = await llamar(
    `${base}/rest/v1/applications?on_conflict=slug`,
    clave,
    {
      metodo: "POST",
      esquema: "kontrolia_auth",
      cuerpo: [{ name: NOMBRE, slug: SLUG, environment: entorno }],
    },
  );
  console.log(`✔ Aplicación registrada (id: ${aplicacion.id})`);

  // 2. Permisos
  await llamar(`${base}/rest/v1/permissions?on_conflict=key`, clave, {
    metodo: "POST",
    esquema: "kontrolia_auth",
    cuerpo: permisos.map((p) => ({
      application_id: aplicacion.id,
      resource: p.resource,
      action: p.action,
      key: p.key,
      description: p.description,
    })),
  });
  console.log(`✔ ${permisos.length} permisos registrados`);

  // 3. Cliente OAuth: se reutiliza si ya existe uno con el mismo nombre, para
  // que volver a ejecutar el script no deje clientes duplicados.
  const existentes = await llamar(
    `${base}/auth/v1/admin/oauth/clients`,
    clave,
  ).catch(() => ({ clients: [] }));
  const lista = Array.isArray(existentes)
    ? existentes
    : (existentes.clients ?? []);
  let cliente = lista.find((c) => c.client_name === NOMBRE);

  if (cliente) {
    console.log(
      `✔ Cliente OAuth ya existía (client_id: ${cliente.client_id})`,
    );
  } else {
    cliente = await llamar(`${base}/auth/v1/admin/oauth/clients`, clave, {
      metodo: "POST",
      cuerpo: {
        client_name: NOMBRE,
        client_type: "public",
        redirect_uris: redirects,
      },
    });
    console.log(`✔ Cliente OAuth creado (client_id: ${cliente.client_id})`);
  }

  await llamar(`${base}/rest/v1/applications?slug=eq.${SLUG}`, clave, {
    metodo: "PATCH",
    esquema: "kontrolia_auth",
    cuerpo: { oauth_client_id: cliente.client_id, redirect_urls: redirects },
  }).catch(() => {
    // No es crítico: el vínculo es informativo y algunas versiones del
    // esquema no tienen estas columnas.
  });

  console.log("\nAñade esto a tu archivo de entorno:\n");
  console.log(`NEXT_PUBLIC_KONTROLIA_AUTH_URL=${base}`);
  console.log(`NEXT_PUBLIC_KONTROLIA_OAUTH_CLIENT_ID=${cliente.client_id}`);
  console.log(
    "\nFalta dar acceso a las organizaciones que deban usar el CRM, desde el panel de KontrolIA Auth.\n",
  );
}

main().catch((e) => {
  console.error(`\nError: ${e.message}\n`);
  process.exit(1);
});
