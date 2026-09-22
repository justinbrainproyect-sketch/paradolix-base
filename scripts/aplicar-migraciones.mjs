#!/usr/bin/env node
/**
 * Pone al día la base de datos del proyecto.
 *
 * Las migraciones son los archivos de `supabase/migrations/`, en orden, y cada
 * uno cuenta un cambio de la base. Este script mira cuáles están ya puestas —lo
 * dice la propia base, en su historial— y aplica solo las que faltan.
 *
 * Por qué existe, en vez de pegar el SQL en el panel a mano:
 *
 *   · **No hay que acordarse de nada.** Un proyecto nuevo se pone al día con un
 *     comando, y un proyecto viejo se actualiza igual.
 *   · **Queda registrado.** La base guarda qué migraciones tiene puestas, así que
 *     no se puede aplicar la misma dos veces ni saltarse una por descuido.
 *   · **Se ve lo que pasa.** Si algo falla, lo dice con el error de la base.
 *
 * Necesita el archivo de claves del proyecto —`.freebuff/claves.txt`, que no se
 * sube nunca— con la dirección del proyecto y un token de Supabase que pueda
 * escribir. Si la base contesta que está en solo lectura, es que el token se quedó
 * con permiso de leer: el script lo dice con esas palabras en lugar de fallar con
 * un error de Postgres.
 *
 * Uso:  npm run migrar
 */
import fs from "node:fs";
import path from "node:path";

const ARCHIVO_DE_CLAVES = path.join(".freebuff", "claves.txt");
const CARPETA = path.join("supabase", "migrations");

const VERDE = "\x1b[32m";
const ROJO = "\x1b[31m";
const GRIS = "\x1b[90m";
const FIN = "\x1b[0m";

function leerClaves() {
  if (!fs.existsSync(ARCHIVO_DE_CLAVES)) {
    console.error(
      `${ROJO}Falta ${ARCHIVO_DE_CLAVES}${FIN}\n\n` +
        "Es el archivo donde vive la dirección del proyecto y el token de Supabase.\n" +
        "Está ignorado por git a propósito: las claves nunca se suben al repositorio.\n" +
        "Pide el contenido a quien te pasó el proyecto, o créalo con estas dos líneas:\n\n" +
        "  proyecto-url = https://tu-proyecto.supabase.co\n" +
        "  token-supabase = sbp_...\n"
    );
    process.exit(1);
  }

  const claves = Object.fromEntries(
    fs
      .readFileSync(ARCHIVO_DE_CLAVES, "utf8")
      .split(/\r?\n/)
      .filter((linea) => linea.includes("=") && !linea.trim().startsWith("#"))
      .map((linea) => {
        const corte = linea.indexOf("=");
        return [linea.slice(0, corte).trim(), linea.slice(corte + 1).trim()];
      })
  );

  const direccion = claves["proyecto-url"];
  const token = claves["token-supabase"];

  if (!direccion || !token) {
    console.error(`${ROJO}${ARCHIVO_DE_CLAVES} existe pero le falta la dirección o el token.${FIN}`);
    process.exit(1);
  }

  return { token, ref: new URL(direccion).hostname.split(".")[0] };
}

function migracionesEnDisco() {
  if (!fs.existsSync(CARPETA)) return [];
  return fs
    .readdirSync(CARPETA)
    .filter((archivo) => archivo.endsWith(".sql"))
    .sort()
    .map((archivo) => ({
      nombre: archivo.replace(/\.sql$/, ""),
      archivo: path.join(CARPETA, archivo),
    }));
}

const { token, ref } = leerClaves();
const api = `https://api.supabase.com/v1/projects/${ref}`;

const pide = (ruta, opciones = {}) =>
  fetch(api + ruta, {
    ...opciones,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...opciones.headers },
  });

const consulta = (query) => pide("/database/query", { method: "POST", body: JSON.stringify({ query }) });

console.log(`\nBase de datos del proyecto ${ref}\n`);

// ── Primero, lo que casi nadie comprueba y ahorra una tarde: ¿se puede escribir?
const permiso = await consulta(
  "select current_user as usuario, current_setting('transaction_read_only') as solo_lectura"
);
const [estado] = await permiso.json();

if (estado?.solo_lectura === "on") {
  console.error(
    `${ROJO}El token que hay en ${ARCHIVO_DE_CLAVES} solo puede leer.${FIN}\n\n` +
      `  La base lo recibe como «${estado.usuario}», y en ese modo no se pueden crear\n` +
      "  tablas. Crea un token con el permiso de **Database** en «Read-write» (y el de\n" +
      "  **Migrations** también), pégalo en el archivo y vuelve a intentarlo.\n"
  );
  process.exit(1);
}

// ── Y ahora, qué falta y qué sobra.
const enDisco = migracionesEnDisco();
if (enDisco.length === 0) {
  console.log("No hay ninguna migración en el repositorio todavía.\n");
  process.exit(0);
}

const historial = await consulta("select name from supabase_migrations.schema_migrations order by version");
const puestas = new Set((await historial.json()).map((fila) => fila.name));

const pendientes = enDisco.filter((migracion) => !puestas.has(migracion.nombre));

if (pendientes.length === 0) {
  console.log(`  ${VERDE}✓${FIN} al día: las ${enDisco.length} migraciones ya estaban puestas\n`);
  process.exit(0);
}

console.log(`  ${GRIS}·${FIN} ${puestas.size} puestas · ${pendientes.length} por aplicar\n`);

for (const migracion of pendientes) {
  const sql = fs.readFileSync(migracion.archivo, "utf8");
  const respuesta = await pide("/database/migrations", {
    method: "POST",
    body: JSON.stringify({ name: migracion.nombre, query: sql }),
  });

  if (respuesta.ok) {
    console.log(`  ${VERDE}✓${FIN} ${migracion.nombre}`);
    continue;
  }

  const detalle = (await respuesta.text()).slice(0, 400);
  console.error(`  ${ROJO}✗${FIN} ${migracion.nombre} · HTTP ${respuesta.status}\n      ${detalle}\n`);
  process.exit(1);
}

console.log(`\n  ${VERDE}✓${FIN} la base está al día\n`);
