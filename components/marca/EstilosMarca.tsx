import { marca } from "@/config/marca";

/**
 * Los colores de la marca, publicados como variables CSS.
 *
 * Este componente es la razón por la que **un proyecto cambia de piel cambiando
 * un archivo**. Aquí no se pinta nada: se escriben los cuatro colores de
 * `config/marca.ts` como variables del documento, y el CSS del kit los usa
 * mezclados con blanco y negro para sacar los tonos derivados —bordes, grises,
 * tintes— que necesita una página entera.
 *
 * Va dentro del layout, antes de cualquier contenido, así que no hay ni un
 * fotograma con los colores de antes. Y no lleva ninguna protección contra
 * inyección porque no le entra nada de fuera: los valores salen de un archivo
 * del repositorio, no de un formulario. Un color mal escrito —o escrito con
 * `javascript:` en vez de con un numeral— lo caza `npm run check:marca` antes de
 * que esto llegue a compilarse.
 *
 * Mañana, cuando un cliente pueda cambiar sus colores desde su propio panel
 * (paso 4), este componente pasa a leer de la base de datos en lugar de leer de
 * un archivo. El resto del kit no se entera: sigue leyendo las mismas variables.
 */
export function EstilosMarca() {
  const variables = [
    `--marca-tinta:${marca.colores.tinta}`,
    `--marca-acento:${marca.colores.acento}`,
    `--marca-marino:${marca.colores.marino}`,
    `--marca-lienzo:${marca.colores.lienzo}`,
  ].join(";");

  return <style dangerouslySetInnerHTML={{ __html: `:root{${variables}}` }} />;
}
