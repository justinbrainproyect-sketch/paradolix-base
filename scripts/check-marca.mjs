#!/usr/bin/env node
/**
 * Comprobación de la costura de la marca.
 *
 * **Es el chequeo que hace que el kit sirva para algo.** Todo el kit se apoya en
 * una promesa: que cambiar de cliente es rellenar dos archivos, y nada más. Esa
 * promesa se rompe sola, sin hacer ruido y sin que falle nada visible: alguien
 * escribe el nombre de la marca en un componente «solo para probar», otro copia
 * un color en el CSS «porque ahí quedaba mejor», y tres proyectos después hay que
 * buscar y reemplazar por todo el código, con el riesgo de dejarse un sitio
 * publicado con el nombre del cliente anterior.
 *
 * Esto no rompe nada cuando se rompe: la web se ve **exactamente igual**. Por eso
 * se comprueba aquí, leyendo la fuente, y no en un test que habría que escribir
 * después.
 *
 * Comprueba cinco cosas:
 *
 * 1. **La marca está completa y bien formada.** Los campos que el kit usa tienen
 *    que existir, los cuatro colores tienen que ser colores —no vale cualquier
 *    texto, porque acaban dentro de una etiqueta `<style>`—, la tipografía tiene
 *    que ser una de las tres que el kit sabe cargar y el correo tiene que ser un
 *    correo.
 * 2. **La marca no aparece en ningún otro archivo.** Ni el nombre, ni el eslogan,
 *    ni la descripción, ni los cuatro colores, ni el contacto. Se busca en todo
 *    el árbol, no solo en el código: también en la documentación, porque un
 *    nombre de cliente en un README acaba copiado en el siguiente proyecto.
 * 3. **Quien tiene que leerla, la lee.** Los archivos que enseñan la marca —el
 *    layout, la tarjeta al compartir, el icono, el logo, el pie— tienen que
 *    importarla y usarla. Es lo que impide que alguien «arregle» un título
 *    escribiéndolo a mano.
 * 4. **El color no se escribe a mano en ninguna parte.** El blanco y el negro
 *    están permitidos —no son de nadie—; cualquier otro color literal en el
 *    código o en el CSS es un color de marca copiado, y va contra la costura.
 * 5. **Las dos protecciones que no se ven.** El sitio de pruebas no se indexa
 *    (si se indexara, competiría en Google con el de verdad, y el que pierde es
 *    el negocio del cliente) y la dirección de respaldo no puede ser un dominio
 *    real: un respaldo que adivina un `.com` puede estar apuntando al sitio de
 *    otra persona.
 *
 * Con `CHECK_MARCA_ROOT` apuntando a otra carpeta se puede probar este mismo
 * chequeo contra una copia rota sin tocar el proyecto.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const raiz = process.env.CHECK_MARCA_ROOT ? path.resolve(process.env.CHECK_MARCA_ROOT) : process.cwd();

const problemas = [];
const comentar = (archivo, mensaje) => problemas.push(`${archivo} · ${mensaje}`);

const COSTURA_MARCA = "config/marca.ts";
const COSTURA_KIT = "config/kit.ts";

function leer(relativa) {
  try {
    return readFileSync(path.join(raiz, relativa), "utf8");
  } catch {
    return null;
  }
}

const fuenteMarca = leer(COSTURA_MARCA);
const fuenteKit = leer(COSTURA_KIT);

if (fuenteMarca === null || fuenteKit === null) {
  console.error(
    `No se han podido leer ${COSTURA_MARCA} y ${COSTURA_KIT}. ¿Es esta la raíz del proyecto?`,
  );
  process.exit(2);
}

/* --- 1. La marca, leída y validada ---------------------------------------- */

/** El texto de una propiedad del archivo de la marca: `eslogan: "…"`. */
function texto(propiedad, fuente = fuenteMarca) {
  const encontrado = fuente.match(new RegExp(`\\b${propiedad}:\\s*"([^"]*)"`));
  return encontrado ? encontrado[1] : null;
}

/** Las propiedades de un bloque de primer nivel, como `colores: { … }`. */
function bloque(propiedad, fuente = fuenteMarca) {
  const encontrado = fuente.match(new RegExp(`\\b${propiedad}:\\s*\\{([\\s\\S]*?)\\n\\s*\\}`));
  if (!encontrado) return null;
  const salida = {};
  for (const [, clave, valor] of encontrado[1].matchAll(/(\w+):\s*"([^"]*)"/g)) {
    salida[clave] = valor;
  }
  return salida;
}

const nombre = texto("nombre");
const eslogan = texto("eslogan");
const descripcion = texto("descripcion");
const tipografia = texto("tipografia");
const idioma = texto("idioma");
const colores = bloque("colores");
const logo = bloque("logo");
const contacto = bloque("contacto");

const TIPOGRAFIAS = ["inter", "manrope", "sistema"];
const CLAVES_COLOR = ["tinta", "acento", "marino", "lienzo"];
const CORREO = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

if (!nombre) comentar(COSTURA_MARCA, "no se ha podido leer el nombre de la marca");
if (!eslogan) comentar(COSTURA_MARCA, "no se ha podido leer el eslogan");
if (!descripcion) comentar(COSTURA_MARCA, "no se ha podido leer la descripción");
if (!contacto?.correo) comentar(COSTURA_MARCA, "no se ha podido leer el correo de contacto");
if (!contacto?.telefono) comentar(COSTURA_MARCA, "no se ha podido leer el teléfono de contacto");

if (nombre && nombre.length > 40) {
  comentar(COSTURA_MARCA, `el nombre tiene ${nombre.length} caracteres y no cabe en una cabecera`);
}
if (eslogan && eslogan.length > 90) {
  comentar(COSTURA_MARCA, `el eslogan tiene ${eslogan.length} caracteres: en la pestaña se corta`);
}
if (descripcion && (descripcion.length < 40 || descripcion.length > 200)) {
  comentar(
    COSTURA_MARCA,
    `la descripción tiene ${descripcion.length} caracteres: es la frase que sale en Google, y fuera de 40–200 se recorta o no dice nada`,
  );
}

if (!colores) {
  comentar(COSTURA_MARCA, "no se ha podido leer el bloque de colores");
} else {
  for (const clave of CLAVES_COLOR) {
    const valor = colores[clave];
    if (!valor) {
      comentar(COSTURA_MARCA, `falta el color «${clave}»; el kit necesita los cuatro`);
      continue;
    }
    // No es un capricho de formato: estos valores se escriben dentro de una
    // etiqueta `<style>` del documento, así que aquí no puede entrar cualquier
    // texto que alguien copie.
    if (!/^#[0-9a-f]{6}$/i.test(valor)) {
      comentar(COSTURA_MARCA, `«${clave}: ${valor}» no es un color de seis dígitos (#rrggbb)`);
    }
  }
  const sobrantes = Object.keys(colores).filter((clave) => !CLAVES_COLOR.includes(clave));
  if (sobrantes.length > 0) {
    comentar(
      COSTURA_MARCA,
      `hay colores que el kit no usa (${sobrantes.join(", ")}): o se pintan con ellos o se quitan`,
    );
  }
}

if (tipografia && !TIPOGRAFIAS.includes(tipografia)) {
  comentar(
    COSTURA_MARCA,
    `la tipografía «${tipografia}» no está entre las que el kit carga (${TIPOGRAFIAS.join(", ")})`,
  );
}
if (idioma && !/^[a-z]{2}$/.test(idioma)) {
  comentar(COSTURA_MARCA, `«${idioma}» no parece un idioma: va en el <html lang>`);
}
if (contacto?.correo && !CORREO.test(contacto.correo)) {
  comentar(COSTURA_MARCA, `«${contacto.correo}» no es un correo`);
}
if (logo?.archivo && !logo.archivo.startsWith("/")) {
  comentar(COSTURA_MARCA, `«${logo.archivo}» tiene que ser una ruta de public/, con barra inicial`);
}
if (logo && !logo.monograma) {
  comentar(COSTURA_MARCA, "falta el monograma: es el logo que se dibuja mientras no hay archivo");
}

/* --- 2. La marca no está en ningún otro archivo --------------------------- */

/**
 * Lo que se busca en el resto del árbol. El monograma no entra: es una o dos
 * letras y aparecería en cualquier palabra. Los valores cortos tampoco, porque
 * un color de tres cifras coincidiría con texto normal.
 */
const VALORES = [
  ["el nombre de la marca", nombre],
  ["el eslogan", eslogan],
  ["la descripción", descripcion],
  ["el correo de contacto", contacto?.correo],
  ["el teléfono de contacto", contacto?.telefono],
  ...CLAVES_COLOR.map((clave) => [`el color «${clave}»`, colores?.[clave]]),
].filter(([, valor]) => typeof valor === "string" && valor.length >= 4);

const CARPETAS = ["app", "components", "config", "lib", "datos", "scripts", "public"];
const EXTENSIONES = [".ts", ".tsx", ".js", ".mjs", ".cjs", ".css", ".json", ".md", ".html"];
const IGNORADAS = new Set(["node_modules", ".next", ".git", ".vercel", "out", "build"]);

/** Todos los archivos de texto del proyecto, para poder buscar dentro. */
function archivosDeTexto() {
  const encontrados = [];

  const visitar = (absoluta, relativa) => {
    for (const entrada of readdirSync(absoluta, { withFileTypes: true })) {
      if (IGNORADAS.has(entrada.name) || entrada.name.startsWith(".")) continue;
      const suya = relativa ? `${relativa}/${entrada.name}` : entrada.name;
      const completa = path.join(absoluta, entrada.name);
      if (entrada.isDirectory()) visitar(completa, suya);
      else if (EXTENSIONES.includes(path.extname(entrada.name))) encontrados.push(suya);
    }
  };

  for (const carpeta of CARPETAS) {
    const completa = path.join(raiz, carpeta);
    try {
      if (statSync(completa).isDirectory()) visitar(completa, carpeta);
    } catch {
      // Una carpeta que todavía no existe no es un problema.
    }
  }

  // Y los archivos sueltos de la raíz, que es donde vive la documentación.
  for (const entrada of readdirSync(raiz, { withFileTypes: true })) {
    if (!entrada.isFile()) continue;
    if (![".md", ".json"].includes(path.extname(entrada.name))) continue;
    if (entrada.name === "package-lock.json") continue;
    encontrados.push(entrada.name);
  }

  return encontrados;
}

const archivos = archivosDeTexto();
let copias = 0;

for (const relativa of archivos) {
  // Las dos costuras son justo donde estos valores tienen que estar, y este
  // propio chequeo los lee por su nombre.
  if (relativa === COSTURA_MARCA || relativa.startsWith("scripts/")) continue;

  const contenido = leer(relativa);
  if (contenido === null) continue;

  for (const [etiqueta, valor] of VALORES) {
    if (!contenido.includes(valor)) continue;
    copias += 1;
    const linea = contenido.slice(0, contenido.indexOf(valor)).split("\n").length;
    comentar(
      relativa,
      `la línea ${linea} repite ${etiqueta} («${valor}»). La marca vive en ${COSTURA_MARCA} y en ningún otro archivo.`,
    );
  }
}

/* --- 3. Quien tiene que leerla, la lee ------------------------------------ */

/**
 * Los archivos que enseñan la marca y lo que tienen que sacar de ella. Se pide
 * el uso concreto —`marca.nombre`, no «marca» a secas— porque un archivo puede
 * importar la marca y seguir escribiendo el título a mano, que es el fallo que
 * este chequeo existe para cazar.
 */
const USA_LA_MARCA = {
  "app/layout.tsx": {
    exige: ["marca.nombre", "marca.descripcion", "marca.idioma", "marca.colores.marino"],
    motivo: "la pestaña, la descripción, el idioma y el color de la barra del navegador",
  },
  "app/opengraph-image.tsx": {
    exige: ["marca.nombre", "marca.colores"],
    motivo: "la tarjeta que se ve al compartir el enlace",
  },
  "app/icon.tsx": {
    exige: ["marca.logo", "marca.colores"],
    motivo: "el icono de la pestaña",
  },
  "components/marca/EstilosMarca.tsx": {
    exige: [
      "marca.colores.tinta",
      "marca.colores.acento",
      "marca.colores.marino",
      "marca.colores.lienzo",
    ],
    motivo: "los cuatro colores que el CSS espera como variables",
  },
  "components/marca/Logo.tsx": {
    exige: ["marca.logo.archivo", "marca.logo.monograma", "marca.nombre"],
    motivo: "el logo y su versión de reserva",
  },
  "components/estructura/Pie.tsx": {
    exige: ["marca.contacto.correo", "marca.contacto.telefono"],
    motivo: "el contacto publicado",
  },
};

for (const [archivo, { exige, motivo }] of Object.entries(USA_LA_MARCA)) {
  const contenido = leer(archivo);
  if (contenido === null) {
    comentar(archivo, `no existe, y es quien enseña ${motivo}`);
    continue;
  }
  if (!contenido.includes("@/config/marca")) {
    comentar(archivo, `no importa ${COSTURA_MARCA}, así que ${motivo} no puede salir de la marca`);
  }
  for (const uso of exige) {
    if (!contenido.includes(uso)) {
      comentar(archivo, `ya no usa «${uso}»: ${motivo} se estaría escribiendo a mano`);
    }
  }
}

/* --- 4. Los colores no se escriben a mano --------------------------------- */

/**
 * El blanco y el negro puros se permiten: no son de ninguna marca y hacen falta
 * para las mezclas y para el papel. Cualquier otro color literal es un color de
 * marca copiado, y este es el fallo que más veces se comete sin darse cuenta
 * —una sombra, un borde gris «que quedaba mejor»—, porque el sitio sigue viéndose
 * bien con él y deja de cambiar cuando cambia la marca.
 */
const NEUTROS = ["#fff", "#ffffff", "#000", "#000000"];
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
/** Un color con tono escrito en números: `rgb(37 99 235 / 0.2)`. */
const RGB = /rgba?\(\s*(\d{1,3})[ ,]+(\d{1,3})[ ,]+(\d{1,3})/g;
let coloresSueltos = 0;

/**
 * ¿Es un gris neutro? Los tres canales iguales no son de nadie —una sombra, un
 * velo, un blanco roto—, así que se permiten. En cuanto hay tono, es un color
 * de marca copiado a mano.
 */
const esNeutro = (canales) => new Set(canales).size === 1;

for (const relativa of archivos) {
  if (relativa === COSTURA_MARCA) continue;
  if (relativa.startsWith("scripts/")) continue;
  if (!/\.(tsx?|css)$/.test(relativa)) continue;

  const contenido = leer(relativa);
  if (contenido === null) continue;

  const hallazgos = [
    ...(contenido.match(HEX) ?? []).map((valor) => ({ valor, neutro: NEUTROS.includes(valor.toLowerCase()) })),
    ...(contenido.matchAll(RGB) ?? []).map(([, r, g, b]) => ({
      valor: `rgb(${r} ${g} ${b})`,
      neutro: esNeutro([r, g, b]),
    })),
  ];

  for (const { valor, neutro } of hallazgos) {
    if (neutro) continue;
    coloresSueltos += 1;
    const linea = contenido.slice(0, contenido.indexOf(valor)).split("\n").length;
    comentar(
      relativa,
      `la línea ${linea} escribe el color ${valor} a mano. Los colores salen de ${COSTURA_MARCA}; el blanco, el negro y los grises neutros sí se pueden escribir.`,
    );
  }
}

/* --- 5. Las dos protecciones que no se ven -------------------------------- */

for (const archivo of ["app/robots.ts", "app/sitemap.ts"]) {
  const contenido = leer(archivo);
  if (contenido === null) {
    comentar(archivo, "no existe: el sitio se indexaría igual en pruebas que en producción");
    continue;
  }
  if (!contenido.includes("entorno.esProduccion")) {
    comentar(
      archivo,
      "ya no consulta el entorno: un despliegue de pruebas se indexaría en Google y competiría con el de producción, que es el que paga el cliente",
    );
  }
}

const fuenteEntorno = leer("lib/entorno.ts");
if (fuenteEntorno === null) {
  comentar("lib/entorno.ts", "no existe: no habría forma de saber dónde está corriendo esto");
} else {
  for (const variable of ["VERCEL_ENV", "NEXT_PUBLIC_ENTORNO"]) {
    if (!fuenteEntorno.includes(variable)) {
      comentar("lib/entorno.ts", `ya no mira «${variable}», y sin ella se pierde un entorno`);
    }
  }
}

const respaldo = fuenteKit.match(/process\.env\.NEXT_PUBLIC_SITE_URL[\s\S]{0,80}?"([^"]+)"/);
if (!respaldo) {
  comentar(COSTURA_KIT, "no se ha podido leer la dirección de respaldo");
} else if (!/\.(example|test|invalid|localhost)$/.test(new URL(respaldo[1]).hostname)) {
  comentar(
    COSTURA_KIT,
    `la dirección de respaldo («${respaldo[1]}») apunta a un dominio que podría ser de otra persona. Tiene que ser un sufijo reservado (.example, .test, .invalid).`,
  );
}

/* --- Los ajustes: las piezas del kit -------------------------------------- */

const ids = [...fuenteKit.matchAll(/id:\s*"([^"]+)"/g)].map(([, id]) => id);
const pasos = [...fuenteKit.matchAll(/paso:\s*(\d+)/g)].map(([, paso]) => Number(paso));
const interruptores = [...fuenteKit.matchAll(/encendida:\s*(true|false)/g)].length;

if (ids.length === 0) {
  comentar(COSTURA_KIT, "no hay ninguna pieza declarada");
}
if (new Set(ids).size !== ids.length) {
  comentar(COSTURA_KIT, "hay dos piezas con el mismo identificador");
}
if (pasos.length !== ids.length) {
  comentar(
    COSTURA_KIT,
    `${ids.length} piezas y ${pasos.length} números de paso: cada pieza dice en qué paso del plan llega`,
  );
}
if (interruptores !== ids.length) {
  comentar(
    COSTURA_KIT,
    `${ids.length} piezas y ${interruptores} interruptores: cada una tiene que decir si está encendida`,
  );
}
for (const paso of pasos) {
  if (!Number.isInteger(paso) || paso < 1 || paso > 12) {
    comentar(COSTURA_KIT, `el paso ${paso} no existe: el plan tiene doce`);
  }
}

/* --- Informe -------------------------------------------------------------- */

const encendidas = [...fuenteKit.matchAll(/encendida:\s*true/g)].length;

console.log("\nComprobación de la costura de la marca\n");
console.log(`  la marca, completa          ${nombre ? "✓" : "✖"} ${nombre ?? "—"} · ${eslogan ?? "—"}`);
console.log(`  los cuatro colores          ${colores ? Object.values(colores).join("  ") : "✖"}`);
console.log(`  la tipografía               ${tipografia ?? "✖"}  ·  idioma: ${idioma ?? "✖"}`);
console.log(
  `  valores buscados en el árbol ${VALORES.length}  ·  copias encontradas: ${copias}`,
);
console.log(`  archivos que la consumen    ${Object.keys(USA_LA_MARCA).length}  ·  todos leen de la costura`);
console.log(`  colores escritos a mano     ${coloresSueltos}  ·  el blanco y el negro no cuentan`);
console.log(`  las piezas del kit          ${ids.length}  ·  encendidas: ${encendidas}`);
console.log("  el sitio de pruebas         no se indexa, y el respaldo no adivina un dominio");

if (problemas.length > 0) {
  console.error(`\n✖ ${problemas.length} problema(s):\n`);
  for (const problema of problemas) console.error(`  · ${problema}`);
  console.error(
    `\n  La marca vive en ${COSTURA_MARCA}. Si un dato de un cliente está en otro archivo,\n  se mueve allí y se lee desde la costura.\n`,
  );
  process.exit(1);
}

console.log(
  `\n✓ la marca se cambia en un archivo y ningún otro lo contradice: ni nombre, ni colores, ni contacto\n`,
);
