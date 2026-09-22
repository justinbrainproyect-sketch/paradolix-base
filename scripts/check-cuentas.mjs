#!/usr/bin/env node
/**
 * La prueba de las cuentas, contra el proyecto de verdad.
 *
 * Hace lo que hará la aplicación cuando tenga pantallas, pero sin pantallas: crea
 * dos personas, cada una abre su negocio, y se comprueba lo único que de verdad
 * importa de esta pieza:
 *
 *   1. Al registrarse, la base le hace su perfil sola (el disparador).
 *   2. Cada persona entra con su contraseña y tiene su sesión.
 *   3. Al abrir un negocio, quien lo abre queda dentro como dueño.
 *   4. **Nadie ve lo de nadie.** Dos negocios distintos no se ven entre sí.
 *   5. Un visitante que no ha entrado no ve absolutamente nada.
 *   6. Y desde fuera no se puede ni abrir un negocio.
 *   7. Cada persona puede descargar lo suyo, y la base avisa si al irse dejaría un
 *      negocio sin dueño.
 *   8. Al borrar la cuenta, sus datos se van con ella y no queda nada suelto.
 *
 * Por qué esta prueba existe desde el primer día y no se deja «para luego»: los
 * permisos son lo único que no se ve cuando está mal. Una pantalla rota se nota al
 * mirarla; una tabla mal cerrada no se nota nunca, hasta que alguien entra donde no
 * debía. Esto lo comprueba en veinte segundos.
 *
 * Necesita `.env.local` con la dirección del proyecto, la clave publicable y la del
 * servidor. **Crea y borra cuentas de verdad**, así que usa direcciones reservadas
 * (`@example.com`) y deja la base como estaba.
 *
 * Uso:  npm run check:cuentas
 */
import fs from "node:fs";

const ROJO = "\x1b[31m";
const VERDE = "\x1b[32m";
const GRIS = "\x1b[90m";
const FIN = "\x1b[0m";

if (!fs.existsSync(".env.local")) {
  console.error(
    `${ROJO}Falta .env.local${FIN}\n\n` +
      "Es el archivo con las claves del proyecto, y no se sube nunca. Copia el\n" +
      "contenido de otro proyecto del kit o pídelo, y vuelve a intentarlo.\n"
  );
  process.exit(1);
}

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((linea) => linea.includes("=") && !linea.trim().startsWith("#"))
    .map((linea) => {
      const corte = linea.indexOf("=");
      return [linea.slice(0, corte).trim(), linea.slice(corte + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const publica = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secreta = env.SUPABASE_SECRET_KEY;

for (const [nombre, valor] of [
  ["NEXT_PUBLIC_SUPABASE_URL", url],
  ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", publica],
  ["SUPABASE_SECRET_KEY", secreta],
]) {
  if (!valor) {
    console.error(`${ROJO}.env.local no tiene ${nombre}${FIN}`);
    process.exit(1);
  }
}

const delServidor = { apikey: secreta, Authorization: `Bearer ${secreta}`, "Content-Type": "application/json" };
const deVisita = { apikey: publica, "Content-Type": "application/json" };
const sello = Date.now();
const resultado = [];

const comprobar = (condicion, bienDicho, malDicho) => {
  if (condicion) {
    resultado.push(true);
    console.log(`   ${VERDE}✓${FIN} ${bienDicho}`);
  } else {
    resultado.push(false);
    console.log(`   ${ROJO}✗${FIN} ${malDicho}`);
  }
};

const leer = async (camino, sesion) => {
  const respuesta = await fetch(`${url}/rest/v1/${camino}`, { headers: sesion });
  const texto = await respuesta.text();
  try {
    return JSON.parse(texto);
  } catch {
    return { fallo: `${respuesta.status} ${texto.slice(0, 120)}` };
  }
};

const llamar = async (funcion, sesion, cuerpo = {}) =>
  (await fetch(`${url}/rest/v1/rpc/${funcion}`, { method: "POST", headers: sesion, body: JSON.stringify(cuerpo) })).json();

async function crearCuenta(apodo) {
  const respuesta = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: delServidor,
    body: JSON.stringify({
      email: `${apodo}.${sello}@example.com`,
      password: `prueba-${sello}-larga`,
      // Sin correo de confirmación: la prueba no puede depender de un buzón, y
      // cada envío gasta cupo del servicio de correo de prueba.
      email_confirm: true,
    }),
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) throw new Error(`no se pudo crear la cuenta: ${JSON.stringify(cuerpo)}`);
  return { ...cuerpo, clave: `prueba-${sello}-larga` };
}

async function entrar(cuenta) {
  const respuesta = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: deVisita,
    body: JSON.stringify({ email: cuenta.email, password: cuenta.clave }),
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) throw new Error(`no se pudo entrar: ${JSON.stringify(cuerpo)}`);
  return { apikey: publica, Authorization: `Bearer ${cuerpo.access_token}`, "Content-Type": "application/json" };
}

console.log("\nLa prueba de las cuentas, contra el proyecto de verdad\n");

const creadas = [];
let negocio = null;

try {
  console.log("  1 · Se registran dos personas");
  const ana = await crearCuenta("ana");
  const luis = await crearCuenta("luis");
  creadas.push(ana, luis);
  comprobar(true, "dos cuentas creadas y confirmadas");

  console.log("\n  2 · La base les ha hecho el perfil sola");
  const perfiles = await leer(`perfiles?id=eq.${ana.id}&select=id,nombre`, delServidor);
  comprobar(Array.isArray(perfiles) && perfiles.length === 1, "el disparador creó el perfil de quien se registró", `sin perfil: ${JSON.stringify(perfiles)}`);

  console.log("\n  3 · Cada una entra con su contraseña");
  const comoAna = await entrar(ana);
  const comoLuis = await entrar(luis);
  comprobar(true, "las dos han entrado y tienen su sesión");

  console.log("\n  4 · Ana abre su negocio y queda dentro como dueña");
  negocio = await llamar("abrir_negocio", comoAna, { nombre: `Negocio de prueba ${sello}` });
  comprobar(typeof negocio === "string" && negocio.length === 36, "el negocio se creó en un solo paso", `no se pudo abrir: ${JSON.stringify(negocio)}`);
  const suyos = await leer("negocios?select=id&order=creado_en", comoAna);
  comprobar(Array.isArray(suyos) && suyos.length === 1, "Ana ve su negocio", `Ana ve: ${JSON.stringify(suyos)}`);
  const papel = await leer("miembros?select=rol&order=creado_en", comoAna);
  comprobar(papel?.[0]?.rol === "dueno", "y su papel es dueña", `su papel: ${JSON.stringify(papel)}`);

  console.log("\n  5 · Luis no ve absolutamente nada de Ana");
  const loDeAna = await leer("negocios?select=id", comoLuis);
  comprobar(Array.isArray(loDeAna) && loDeAna.length === 0, "con sesión, pero de otro negocio: cero", `¡Luis ve ${JSON.stringify(loDeAna)}!`);
  const datosDeAna = await leer(`perfiles?id=eq.${ana.id}&select=id`, comoLuis);
  comprobar(Array.isArray(datosDeAna) && datosDeAna.length === 0, "y tampoco el perfil de Ana", `¡Luis ve el perfil de Ana!`);

  console.log("\n  6 · Un visitante sin entrar, tampoco");
  const deVisitante = await leer("negocios?select=id", deVisita);
  comprobar(Array.isArray(deVisitante) && deVisitante.length === 0, "sin sesión no se ve nada", `¡un visitante ve ${JSON.stringify(deVisitante)}!`);

  console.log("\n  7 · Desde fuera no se puede ni abrir un negocio");
  const sinEntrar = await fetch(`${url}/rest/v1/rpc/abrir_negocio`, {
    method: "POST",
    headers: deVisita,
    body: JSON.stringify({ nombre: "Colado" }),
  });
  comprobar(sinEntrar.status >= 400, `la base lo rechaza (HTTP ${sinEntrar.status})`, "¡cualquiera desde fuera puede abrir negocios!");

  console.log("\n  8 · Lo que cada una se puede llevar, y lo que la dejaría huérfana");
  const datos = await llamar("mis_datos", comoAna);
  comprobar(datos?.negocios?.length === 1, "su descarga incluye su negocio", `la descarga vino: ${JSON.stringify(datos).slice(0, 160)}`);
  const huerfanos = await llamar("negocios_que_quedarian_huerfanos", comoAna);
  comprobar(Array.isArray(huerfanos) && huerfanos.length === 1, "y la base avisa de que su negocio se quedaría sin dueño", `el aviso vino: ${JSON.stringify(huerfanos)}`);
  const huerfanosDeLuis = await llamar("negocios_que_quedarian_huerfanos", comoLuis);
  comprobar(Array.isArray(huerfanosDeLuis) && huerfanosDeLuis.length === 0, "y a Luis no le avisa de nada, porque no tiene negocio", `a Luis le vino: ${JSON.stringify(huerfanosDeLuis)}`);
} finally {
  console.log("\n  9 · Se borra todo lo que ha creado la prueba");
  for (const cuenta of creadas) {
    const respuesta = await fetch(`${url}/auth/v1/admin/users/${cuenta.id}`, { method: "DELETE", headers: delServidor });
    console.log(`     ${respuesta.ok ? `${VERDE}✓${FIN}` : `${ROJO}✗${FIN}`} cuenta borrada (HTTP ${respuesta.status})`);
  }
  if (negocio) await fetch(`${url}/rest/v1/negocios?id=eq.${negocio}`, { method: "DELETE", headers: delServidor });

  const filas = async (tabla) => (await leer(`${tabla}?select=*`, delServidor)).length;
  const sobrantes = (await filas("perfiles")) + (await filas("negocios")) + (await filas("miembros"));
  comprobar(sobrantes === 0, `la base queda como estaba (${GRIS}0 filas${FIN})`, `quedan ${sobrantes} filas sueltas`);

  const bien = resultado.filter(Boolean).length;
  const mal = resultado.length - bien;
  console.log(`\n${mal === 0 ? `${VERDE}Todo en verde${FIN}` : `${ROJO}${mal} fallos${FIN}`} · ${bien} de ${resultado.length} comprobaciones\n`);
  process.exit(mal === 0 ? 0 : 1);
}
