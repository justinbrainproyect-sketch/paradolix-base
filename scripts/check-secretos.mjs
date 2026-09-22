#!/usr/bin/env node
/**
 * Comprobación de que no se cuela en el árbol lo que no debe publicarse.
 *
 * Es la regla número 2 del kit —«nada sensible dentro del código»— convertida en
 * algo que se comprueba sola, y existe porque este repositorio es **la base de
 * todos los proyectos**: una clave que se cuela aquí no se queda en un sitio, se
 * copia en los siguientes veinte. Y una vez en un commit ya no se puede
 * deshacer: se queda en el historial, y en el archivo que cualquiera descarga.
 *
 * Comprueba tres familias, y las tres son de las que un revisor no ve porque
 * *parecen* normales:
 *
 * 1. **Archivos de entorno versionados.** `.env`, `.env.local`, `.env.production`
 *    y cualquier variante, con `.env.example` como única excepción: el ejemplo se
 *    versiona a propósito y por definición no lleva valores. También las claves
 *    sueltas que la gente arrastra sin pensar: `.npmrc`, `*.pem`, `*.key`,
 *    `id_rsa*`.
 * 2. **Claves de API y credenciales, por su forma**, con el prefijo que usa cada
 *    proveedor, y una regla genérica para lo demás: un valor largo asignado a una
 *    variable que se llame `..._KEY`, `..._SECRET`, `..._TOKEN`, `password` o
 *    `clave`. La regla genérica pide que el valor mezcle letras y números, que es
 *    lo que distingue una clave real de un marcador: `RESEND_API_KEY=re_xxxx`
 *    pasa —todo equis— y una clave de verdad no.
 * 3. **Datos personales.** Los buzones gratuitos (gmail, hotmail, outlook…) son
 *    de una persona, y una persona no va en el código: la del proyecto va en el
 *    entorno. Un correo de un dominio que no esté en la lista de abajo también
 *    falla, y añadirlo es una línea con su motivo escrito al lado.
 *
 * **Qué mira y qué no.** Mira lo que git incluiría en el próximo commit: los
 * archivos versionados más los que no están ignorados. Así, un `.env.local`
 * legítimo de la máquina de quien programa no da un falso positivo —git ya lo
 * ignora— y en cambio un archivo nuevo con una clave dentro, todavía sin `git
 * add`, sí se caza. Si no hay git, recorre el árbol aplicando el `.gitignore`.
 *
 * Y **no imprime lo que encuentra**: el informe dice la ruta, la línea, la
 * categoría y un tajo enmascarado —los cuatro primeros caracteres y su
 * longitud—. Lo suficiente para localizarlo y arreglarlo, y no lo suficiente para
 * que el registro de la compilación se convierta en el sitio donde vive la clave
 * que el chequeo acaba de denunciar. Los binarios no se leen.
 *
 * Con `CHECK_SECRETOS_ROOT` apuntando a otra carpeta se puede probar este mismo
 * chequeo contra una copia con un secreto dentro, sin tocar el proyecto.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const raiz = process.env.CHECK_SECRETOS_ROOT
  ? path.resolve(process.env.CHECK_SECRETOS_ROOT)
  : process.cwd();

const problemas = [];

/* --- Qué se mira ---------------------------------------------------------- */

/** Los archivos de entorno que sí pueden estar: la plantilla, que no lleva valores. */
const ENV_PERMITIDOS = new Set([".env.example", ".env.sample", ".env.template"]);

/** Nombres que no son de entorno pero guardan credenciales igual de bien. */
const ARCHIVOS_SENSIBLES = [
  { prueba: (nombre) => nombre === ".npmrc", motivo: "un `.npmrc` puede llevar un token de registro" },
  { prueba: (nombre) => /\.(pem|key|p12|pfx)$/i.test(nombre), motivo: "una clave privada suelta" },
  { prueba: (nombre) => /^id_(rsa|dsa|ecdsa|ed25519)/.test(nombre), motivo: "una clave privada de SSH" },
];

/** Las claves que se reconocen por su forma, con el proveedor escrito. */
const CLAVES = [
  { nombre: "Resend", prueba: /\bre_[A-Za-z0-9]{16,}\b/ },
  { nombre: "Stripe (secreta)", prueba: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { nombre: "Supabase", prueba: /\bsb[ps]_[A-Za-z0-9_-]{20,}\b/ },
  { nombre: "AWS", prueba: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { nombre: "Google", prueba: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { nombre: "Slack", prueba: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { nombre: "GitHub", prueba: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{30,})\b/ },
  { nombre: "GitLab", prueba: /\bglpat-[A-Za-z0-9_-]{20,}\b/ },
  { nombre: "clave privada PEM", prueba: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { nombre: "JWT", prueba: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
];

/**
 * Y la regla genérica, para los proveedores que no están arriba. Pide dos cosas
 * a la vez: que el nombre de la variable suene a credencial y que el valor
 * **mezcle letras y números** sin espacios. Es lo que separa una clave real de un
 * marcador de documentación.
 */
const NOMBRE_SOSPECHOSO =
  /(api[_-]?key|apikey|secret[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|refresh[_-]?token|service[_-]?role|password|passwd|contrase\u00f1a)\s*[:=]\s*["'`]?([A-Za-z0-9/+_-]{16,})/i;

/** Los buzones gratuitos: eso es una persona, y una persona no va en el código. */
const DOMINIOS_PERSONALES = [
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "hotmail.es",
  "outlook.com",
  "outlook.es",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.es",
  "gmx.com",
  "gmx.es",
  "icloud.com",
  "me.com",
  "aol.com",
  "mail.com",
  "proton.me",
  "protonmail.com",
];

/**
 * Los dominios que sí aparecen en el kit, cada uno con su motivo. El motivo
 * importa: si mañana aparece uno nuevo y el chequeo lo denuncia, la salida dice
 * exactamente qué hacer —añadirlo aquí con su razón, o quitarlo del código—.
 */
const DOMINIOS_CONOCIDOS = [
  "resend.dev", // el remitente de pruebas del proveedor de correo
  "ejemplo.com", // marcador genérico en español
  "example.com", // marcador genérico
  "example.org", // marcador genérico
  "tudominio.com", // marcador de los ejemplos de documentación
];

/** Dominios que por construcción no son de nadie. */
const DOMINIOS_RESERVADOS = [".test", ".invalid", ".local", ".example", ".localhost"];

const CORREO = /\b[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)\b/g;

/* --- Lo que git incluiría en el próximo commit ---------------------------- */

/**
 * Se le pregunta a git porque es el que sabe qué está ignorado, y aquí hay
 * archivos ignorados por motivos muy distintos —`node_modules`, `.next`, el
 * `.env.local` de tu máquina— que no se pueden adivinar sin repetir la lista.
 */
function archivosSegunGit() {
  try {
    const salida = execFileSync(
      "git",
      ["-C", raiz, "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      { encoding: "buffer", stdio: ["ignore", "pipe", "ignore"] },
    );
    return salida
      .toString("utf8")
      .split("\0")
      .filter(Boolean)
      .map((ruta) => path.join(raiz, ruta));
  } catch {
    return null;
  }
}

/** Traduce un patrón de `.gitignore` a expresión regular (solo lo que usamos). */
function patronGitignore(linea) {
  const limpio = linea.trim();
  if (!limpio || limpio.startsWith("#") || limpio.startsWith("!")) return null;
  const anclado = limpio.startsWith("/");
  const cuerpo = limpio.replace(/^\//, "").replace(/\/$/, "");
  const fuente = cuerpo
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000/g, ".*")
    .replace(/\?/g, "[^/]");
  return new RegExp((anclado ? "^" : "(?:^|/)") + fuente + "(?:/|$)");
}

/** El respaldo: se recorre el árbol y se aplica el propio `.gitignore`. */
function archivosRecorriendo() {
  let patrones;
  try {
    patrones = readFileSync(path.join(raiz, ".gitignore"), "utf8")
      .split(/\r?\n/)
      .map(patronGitignore)
      .filter(Boolean);
  } catch {
    patrones = [".git", "node_modules", ".next", "out", "build", ".vercel"].map(patronGitignore);
  }

  const encontrados = [];
  const visitar = (absoluta, relativa) => {
    for (const entrada of readdirSync(absoluta, { withFileTypes: true })) {
      const suya = relativa ? `${relativa}/${entrada.name}` : entrada.name;
      if (patrones.some((patron) => patron.test(suya))) continue;
      const completa = path.join(absoluta, entrada.name);
      if (entrada.isDirectory()) visitar(completa, suya);
      else encontrados.push(completa);
    }
  };

  visitar(raiz, "");
  return encontrados;
}

const deGit = archivosSegunGit();
const porGit = deGit !== null;
const archivos = deGit ?? archivosRecorriendo();

/* --- El informe ----------------------------------------------------------- */

/** Enmascara un hallazgo: cuatro caracteres y la longitud. */
function enmascarar(valor) {
  const limpio = valor.trim();
  return `${limpio.slice(0, 4)}… (${limpio.length} caracteres)`;
}

function anotar(relativa, linea, categoria, mensaje) {
  problemas.push(`${relativa}:${linea} · ${categoria} · ${mensaje}`);
}

/* --- 1. Archivos de entorno y credenciales sueltas ------------------------ */

function revisarNombre(rutaAbsoluta) {
  const relativa = path.relative(raiz, rutaAbsoluta).split(path.sep).join("/");
  const nombre = path.basename(rutaAbsoluta);

  if (/^\.env(\..+)?$/.test(nombre) && !ENV_PERMITIDOS.has(nombre)) {
    anotar(
      relativa,
      0,
      "archivo de entorno",
      `«${nombre}» está versionado y los archivos de entorno no se versionan: su único sitio es el panel de Vercel (los valores) y \`.env.example\` (los nombres). Si ya se ha subido, borrarlo del árbol no basta: queda en el historial y hay que rotar lo que hubiera dentro.`,
    );
    return true;
  }

  for (const { prueba, motivo } of ARCHIVOS_SENSIBLES) {
    if (prueba(nombre)) {
      anotar(relativa, 0, "credencial suelta", `«${nombre}» está en el árbol y ${motivo}`);
      return true;
    }
  }

  return false;
}

/* --- 2 y 3. Lo que hay dentro --------------------------------------------- */

function revisarContenido(rutaAbsoluta) {
  const relativa = path.relative(raiz, rutaAbsoluta).split(path.sep).join("/");
  let bytes;

  try {
    bytes = readFileSync(rutaAbsoluta);
  } catch {
    return;
  }

  // Los binarios no se leen: ni hay claves en una foto, ni una expresión regular
  // tiene nada que buscar entre bytes que no son texto.
  if (bytes.subarray(0, 8000).includes(0)) return;

  const lineas = bytes.toString("utf8").split(/\r?\n/);

  lineas.forEach((texto, indice) => {
    const numero = indice + 1;
    let reconocida = false;

    for (const { nombre, prueba } of CLAVES) {
      const hallazgo = texto.match(prueba);
      if (!hallazgo) continue;
      reconocida = true;
      anotar(
        relativa,
        numero,
        "clave de API",
        `parece una clave de ${nombre}: «${enmascarar(hallazgo[0])}». No puede vivir en el repositorio; va en el entorno, y si ya estaba en un commit hay que rotarla.`,
      );
    }

    // La regla genérica solo entra si ninguna específica reconoció la línea.
    const generica = reconocida ? null : texto.match(NOMBRE_SOSPECHOSO);
    if (generica) {
      const valor = generica[2];
      if (/[A-Za-z]/.test(valor) && /\d/.test(valor)) {
        anotar(
          relativa,
          numero,
          "credencial",
          `«${generica[1]}» lleva un valor asignado con pinta de clave («${enmascarar(valor)}»). Si es un ejemplo, escribe el valor con letras repetidas (\`xxxx\`) o déjalo vacío.`,
        );
      }
    }

    for (const hallazgo of texto.matchAll(CORREO)) {
      const correo = hallazgo[0];
      const dominio = hallazgo[1].toLowerCase();

      if (DOMINIOS_PERSONALES.includes(dominio)) {
        anotar(
          relativa,
          numero,
          "dato personal",
          `«${correo}» es un buzón gratuito, así que es una persona: en el código solo hay direcciones del proyecto, y las personales viven en el entorno.`,
        );
        continue;
      }

      if (DOMINIOS_RESERVADOS.some((sufijo) => dominio.endsWith(sufijo))) continue;
      if (DOMINIOS_CONOCIDOS.includes(dominio)) continue;

      anotar(
        relativa,
        numero,
        "correo desconocido",
        `«${correo}» usa un dominio que no está en la lista del chequeo. Si es una dirección de ejemplo, añádela a \`DOMINIOS_CONOCIDOS\` con su motivo; si es de una persona o de un cliente, no va en el repositorio.`,
      );
    }
  });
}

/* --- El recorrido --------------------------------------------------------- */

if (archivos.length === 0) {
  console.error("No hay ningún archivo que revisar. ¿Es esta la raíz del proyecto?");
  process.exit(2);
}

for (const rutaAbsoluta of archivos) {
  try {
    statSync(rutaAbsoluta);
  } catch {
    continue; // Un archivo listado por git y ya borrado no es un hallazgo.
  }
  if (!revisarNombre(rutaAbsoluta)) revisarContenido(rutaAbsoluta);
}

/* --- Informe -------------------------------------------------------------- */

const categorias = problemas.reduce((cuenta, problema) => {
  const categoria = problema.split(" · ")[1];
  cuenta.set(categoria, (cuenta.get(categoria) ?? 0) + 1);
  return cuenta;
}, new Map());

console.log("\nComprobación de secretos y datos personales\n");
console.log(
  `  archivos revisados   ${archivos.length}  ·  ${porGit ? "los que git incluiría en el próximo commit" : "recorriendo el árbol con el .gitignore"}`,
);
console.log(
  `  archivos de entorno  ${[...ENV_PERMITIDOS].join(", ")}  ·  cualquier otro \`.env*\` falla`,
);
console.log(`  claves reconocidas   ${CLAVES.length} proveedores + la regla de valores con nombre sospechoso`);
console.log(
  `  correos permitidos   ${DOMINIOS_CONOCIDOS.length} dominios con motivo escrito  ·  ${DOMINIOS_PERSONALES.length} de buzón gratuito fallan siempre`,
);

if (problemas.length > 0) {
  console.error(`\n✖ ${problemas.length} problema(s):\n`);
  for (const [categoria, cuantos] of categorias) console.error(`  ${categoria}: ${cuantos}`);
  console.error("");
  for (const problema of problemas) console.error(`  · ${problema}`);
  console.error("");
  process.exit(1);
}

console.log("\n✓ nada que publicar sin querer: ni archivos de entorno, ni claves, ni datos personales\n");
