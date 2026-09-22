/**
 * En qué entorno está corriendo esto.
 *
 * El kit trabaja en tres sitios y son tres cosas distintas, aunque el código sea
 * el mismo:
 *
 * - **Desarrollo**: tu ordenador, mientras se construye. `npm run dev`.
 * - **Pruebas**: el sitio gemelo de Vercel, el que enseña el enlace provisional.
 *   Cada despliegue de una rama o de un commit genera uno.
 * - **Producción**: la dirección de verdad, la que ve el público.
 *
 * Y de las tres sale todo lo que cambia según dónde estés, que es más de lo que
 * parece: fuera de producción **no se indexa en Google** (si no, el sitio de
 * pruebas competiría con el de verdad, y con las mismas palabras), y fuera de
 * producción se enseñan **datos de ejemplo** en lugar de datos reales.
 *
 * Eso segundo es lo que hace que probar no dé miedo: no hay ninguna duda de si
 * lo que se está viendo es de un cliente o es una muestra, porque la página lo
 * dice en la cabecera.
 *
 * Se puede forzar con `NEXT_PUBLIC_ENTORNO=pruebas` en el `.env.local`, que es
 * como se prueba el comportamiento del sitio de pruebas sin publicar nada.
 */

export type NombreEntorno = "produccion" | "pruebas" | "desarrollo";

const NOMBRES: NombreEntorno[] = ["produccion", "pruebas", "desarrollo"];

/** Cómo se llama cada entorno delante del visitante. En producción no se enseña. */
const ETIQUETAS: Record<NombreEntorno, string> = {
  produccion: "Producción",
  pruebas: "Entorno de pruebas",
  desarrollo: "Desarrollo",
};

function decidir(): NombreEntorno {
  // 1. Lo que diga el archivo de entorno, si dice algo con sentido. Es la vía
  //    para probar los otros dos entornos desde el portátil.
  const forzado = process.env.NEXT_PUBLIC_ENTORNO?.trim().toLowerCase();
  if (forzado && (NOMBRES as string[]).includes(forzado)) {
    return forzado as NombreEntorno;
  }

  // 2. Lo que diga Vercel, que es quien sabe de verdad dónde está esto. `preview`
  //    son los despliegues de prueba: cada commit puede tener el suyo.
  switch (process.env.VERCEL_ENV) {
    case "production":
      return "produccion";
    case "preview":
      return "pruebas";
    case "development":
      return "desarrollo";
    default:
      break;
  }

  // 3. Y si no lo dice nadie, esto es un portátil. Se decide por Vercel y no por
  //    `NODE_ENV` a propósito: con `npm run build && npm start` en local
  //    `NODE_ENV` vale «production», y entonces el portátil se creería el sitio
  //    publicado y se apagarían los datos de ejemplo y el aviso de la cabecera,
  //    que es justo lo contrario de lo que conviene mientras se construye.
  return "desarrollo";
}

const nombre = decidir();

export const entorno = {
  nombre,
  /** El nombre que se enseña en la cinta de la cabecera. */
  etiqueta: ETIQUETAS[nombre],
  /** El único entorno que se publica y el único que se indexa. */
  esProduccion: nombre === "produccion",
  esDesarrollo: nombre === "desarrollo",
  /**
   * Si fuera de producción se enseña la muestra en lugar de datos reales.
   *
   * Hoy el kit no tiene base de datos —llega en el paso 2—, así que lo que hay
   * que enseñar son las cifras de la muestra. El día que haya datos de verdad,
   * este interruptor es el que decide qué se lee, y va en un solo sitio.
   */
  usaDatosDeEjemplo: nombre !== "produccion",
} as const;
