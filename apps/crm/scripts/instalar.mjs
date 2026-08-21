#!/usr/bin/env node
/**
 * Instalador de Vinqulia.
 *
 * Lleva una instalación de principio a fin: comprueba requisitos, conecta o
 * crea la base de datos, aplica el esquema, registra la aplicación en
 * KontrolIA Auth, escribe la configuración y prepara el despliegue.
 *
 * Sin dependencias: solo Node. Un instalador que hay que instalar antes de
 * poder instalar no sirve de nada.
 *
 *   node scripts/instalar.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import readline from "node:readline";

// ── Utilidades de consola ────────────────────────────────────────────────

const c = {
  titulo: (t) => `\n\x1b[1m${t}\x1b[0m`,
  ok: (t) => `\x1b[32m✔\x1b[0m ${t}`,
  aviso: (t) => `\x1b[33m!\x1b[0m ${t}`,
  error: (t) => `\x1b[31m✖\x1b[0m ${t}`,
  tenue: (t) => `\x1b[2m${t}\x1b[0m`,
};

const rl = () =>
  readline.createInterface({ input: process.stdin, output: process.stdout });

const preguntar = (texto, porDefecto = "") =>
  new Promise((resolve) => {
    const i = rl();
    const sufijo = porDefecto ? c.tenue(` [${porDefecto}]`) : "";
    i.question(`${texto}${sufijo}: `, (r) => {
      i.close();
      resolve(r.trim() || porDefecto);
    });
  });

/** Pregunta sin mostrar lo escrito, para claves y contraseñas. */
const preguntarOculto = (texto) =>
  new Promise((resolve) => {
    const i = rl();
    const escribir = i._writeToOutput;
    i._writeToOutput = function (salida) {
      if (salida.includes(texto)) escribir.call(i, salida);
    };
    i.question(`${texto}: `, (r) => {
      i._writeToOutput = escribir;
      i.output.write("\n");
      i.close();
      resolve(r.trim());
    });
  });

const elegir = async (texto, opciones) => {
  console.log(`\n${texto}`);
  opciones.forEach((o, n) => console.log(`  ${n + 1}) ${o.etiqueta}`));
  while (true) {
    const r = await preguntar("Elige una opción", "1");
    const n = Number(r);
    if (n >= 1 && n <= opciones.length) return opciones[n - 1].valor;
    console.log(c.error("Opción no válida."));
  }
};

const confirmar = async (texto, porDefecto = "s") => {
  const r = await preguntar(`${texto} (s/n)`, porDefecto);
  return r.toLowerCase().startsWith("s");
};

// ── Paso 1: requisitos ───────────────────────────────────────────────────

function comprobarRequisitos() {
  console.log(c.titulo("Paso 1/6 · Requisitos"));

  const mayor = Number(process.versions.node.split(".")[0]);
  if (mayor < 20) {
    console.log(
      c.error(`Node ${process.versions.node}. Hace falta 20 o superior.`),
    );
    process.exit(1);
  }
  console.log(c.ok(`Node ${process.versions.node}`));

  if (!fs.existsSync("package.json") || !fs.existsSync("supabase/migrations")) {
    console.log(
      c.error(
        "Ejecuta el instalador desde la raíz del repositorio de Vinqulia.",
      ),
    );
    process.exit(1);
  }
  console.log(c.ok("Repositorio correcto"));

  if (!fs.existsSync("node_modules")) {
    console.log(c.aviso("Faltan las dependencias. Instalando…"));
    spawnSync("npm", ["install"], { stdio: "inherit", shell: true });
  }
  console.log(c.ok("Dependencias instaladas"));
}

// ── Paso 2: base de datos ────────────────────────────────────────────────

async function configurarBaseDeDatos() {
  console.log(c.titulo("Paso 2/6 · Base de datos"));
  console.log(
    c.tenue(
      "Vinqulia guarda sus datos en Supabase. Puede ser el proyecto que\n" +
        "ya tengas, en la nube o en tu máquina, o uno nuevo.",
    ),
  );

  const modo = await elegir("¿Qué base de datos usamos?", [
    { etiqueta: "Ya tengo un proyecto Supabase", valor: "existente" },
    { etiqueta: "Supabase local (Docker, en esta máquina)", valor: "local" },
    { etiqueta: "Crear un proyecto nuevo en Supabase", valor: "nuevo" },
  ]);

  if (modo === "local") {
    console.log(
      c.aviso("Levantando Supabase local. La primera vez tarda unos minutos."),
    );
    const r = spawnSync("npx", ["supabase", "start"], {
      stdio: "inherit",
      shell: true,
    });
    if (r.status !== 0) {
      console.log(
        c.error("No se pudo levantar Supabase local. ¿Está Docker en marcha?"),
      );
      process.exit(1);
    }
    return {
      url: "http://127.0.0.1:54321",
      publishable: await preguntarOculto(
        "Clave pública (anon) que mostró Supabase",
      ),
      servicio: await preguntarOculto("Clave de servicio (service_role)"),
      cadena: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    };
  }

  if (modo === "nuevo") {
    console.log(
      c.tenue(
        "\nCrear un proyecto requiere un token de acceso personal de Supabase:\n" +
          "  supabase.com/dashboard/account/tokens",
      ),
    );
    console.log(
      c.aviso(
        "La creación por API no está automatizada todavía. Crea el proyecto\n" +
          "  desde el panel y continúa como proyecto existente.",
      ),
    );
  }

  console.log(
    c.tenue(
      "\nEn el panel de Supabase de tu proyecto: Settings → API para las claves,\n" +
        "y Settings → Database → Connection string para la cadena de conexión.",
    ),
  );

  return {
    url: await preguntar("URL del proyecto (https://xxx.supabase.co)"),
    publishable: await preguntarOculto("Clave pública (anon / publishable)"),
    servicio: await preguntarOculto("Clave de servicio (service_role)"),
    cadena: await preguntarOculto("Cadena de conexión de Postgres"),
  };
}

// ── Paso 3: esquema ──────────────────────────────────────────────────────

function aplicarEsquema(bd) {
  console.log(c.titulo("Paso 3/6 · Esquema de la base de datos"));
  const r = spawnSync(
    "npx",
    ["supabase", "migration", "up", "--db-url", bd.cadena],
    { stdio: "inherit", shell: true },
  );
  if (r.status !== 0) {
    console.log(c.error("No se pudieron aplicar las migraciones."));
    process.exit(1);
  }
  console.log(c.ok("Esquema aplicado"));
}

// ── Paso 4: KontrolIA Auth ───────────────────────────────────────────────

async function configurarAuth() {
  console.log(c.titulo("Paso 4/6 · KontrolIA Auth"));
  console.log(
    c.tenue(
      "El acceso, los usuarios, los roles y las organizaciones viven en\n" +
        "KontrolIA Auth. Vinqulia nunca pide credenciales.",
    ),
  );

  const url = await preguntar(
    "URL del proyecto Supabase de KontrolIA Auth",
    "https://pyipuavrwhcdsvlixhxa.supabase.co",
  );
  const anon = await preguntarOculto("Clave pública (anon) de KontrolIA Auth");
  const servidor = await preguntar(
    "URL de la pantalla de acceso",
    "https://auth.kontrolia.io",
  );

  const registrar = await confirmar(
    "¿Registro ahora la aplicación y sus permisos en KontrolIA Auth?",
  );

  let clienteOAuth = "";
  if (registrar) {
    const dominio = await preguntar(
      "Dominio donde vivirá Vinqulia (para la URL de retorno)",
      "https://vinqulia.com",
    );
    console.log(
      c.tenue(
        "\nSe abrirá el registro; te pedirá la clave de servicio del auth.\n",
      ),
    );
    spawnSync(
      "node",
      [
        "scripts/registrar-en-kontrolia-auth.mjs",
        "--auth-url",
        url,
        "--redirect",
        `${dominio.replace(/\/$/, "")}/oauth/callback`,
      ],
      { stdio: "inherit", shell: true },
    );
    clienteOAuth = await preguntar(
      "Pega aquí el client_id que mostró el registro",
    );
  } else {
    clienteOAuth = await preguntar(
      "client_id de OAuth del CRM (si ya lo tienes)",
    );
  }

  return { url, anon, servidor, clienteOAuth };
}

// ── Paso 5: configuración ────────────────────────────────────────────────

function escribirEntorno(bd, auth) {
  console.log(c.titulo("Paso 5/6 · Configuración"));

  const contenido = `# Generado por el instalador de Vinqulia.
# No se versiona: contiene la configuracion de esta instalacion concreta.

# Base de datos del CRM
NEXT_PUBLIC_SUPABASE_URL=${bd.url}
NEXT_PUBLIC_SB_PUBLISHABLE_KEY=${bd.publishable}
NEXT_PUBLIC_ATTACHMENTS_BUCKET=attachments

# Solo servidor: nunca debe llegar al navegador.
SUPABASE_SERVICE_ROLE_KEY=${bd.servicio}

# KontrolIA Auth
NEXT_PUBLIC_KONTROLIA_AUTH_URL=${auth.url}
NEXT_PUBLIC_KONTROLIA_AUTH_ANON_KEY=${auth.anon}
NEXT_PUBLIC_KONTROLIA_AUTH_SERVER_URL=${auth.servidor}
NEXT_PUBLIC_KONTROLIA_OAUTH_CLIENT_ID=${auth.clienteOAuth}
`;

  fs.writeFileSync(".env.local", contenido, "utf-8");
  console.log(c.ok("Escrito .env.local"));
  console.log(
    c.aviso(
      "Contiene la clave de servicio. No lo compartas ni lo subas al repositorio.",
    ),
  );
}

// ── Paso 6: despliegue ───────────────────────────────────────────────────

async function prepararDespliegue() {
  console.log(c.titulo("Paso 6/6 · Despliegue"));

  const destino = await elegir("¿Dónde va a correr?", [
    { etiqueta: "Solo en esta máquina, por ahora", valor: "local" },
    { etiqueta: "Vercel", valor: "vercel" },
    { etiqueta: "Docker (servidor propio)", valor: "docker" },
    { etiqueta: "Servidor propio con Node (VPS)", valor: "vps" },
  ]);

  if (destino === "local") {
    console.log(c.ok("Listo. Arranca con: npm run dev"));
    return;
  }

  if (destino === "vercel") {
    console.log(
      c.tenue(
        "\nEn Vercel las variables no van en un archivo: se cargan en el proyecto.\n" +
          "Súbelas con la CLI de Vercel, una por una:\n",
      ),
    );
    for (const linea of fs.readFileSync(".env.local", "utf-8").split("\n")) {
      const [clave] = linea.split("=");
      if (clave && !clave.startsWith("#")) {
        console.log(c.tenue(`  vercel env add ${clave} production`));
      }
    }
    console.log("\nY despliega con: vercel --prod");
    return;
  }

  if (destino === "docker" || destino === "vps") {
    console.log(c.ok("Compila con: npm run build"));
    if (destino === "docker") {
      console.log("Construye la imagen con: docker build -t vinqulia .");
      console.log(
        "Y arráncala con: docker run --env-file .env.local -p 3001:3001 vinqulia",
      );
    } else {
      console.log("Arranca con: npm run start");
      console.log(
        c.tenue(
          "  Ponlo detrás de un proxy inverso con HTTPS, y recuerda añadir el\n" +
            "  dominio real como URL de retorno en KontrolIA Auth.",
        ),
      );
    }
  }
}

// ── Orquestación ─────────────────────────────────────────────────────────

async function main() {
  console.log(c.titulo("Instalador de Vinqulia"));
  console.log(
    c.tenue(
      "Seis pasos. Puedes interrumpir y volver a empezar cuando quieras.\n",
    ),
  );

  comprobarRequisitos();
  const bd = await configurarBaseDeDatos();
  aplicarEsquema(bd);
  const auth = await configurarAuth();
  escribirEntorno(bd, auth);
  await prepararDespliegue();

  console.log(c.titulo("Instalación terminada"));
  console.log(
    "Falta un último paso que solo puedes dar tú: dale acceso al CRM a las\n" +
      "organizaciones que corresponda, desde el panel de KontrolIA Auth.\n",
  );
}

main().catch((e) => {
  console.error(c.error(e.message));
  process.exit(1);
});
