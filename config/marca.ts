/**
 * LA COSTURA DE LA MARCA.
 *
 * Este archivo es **una de las dos únicas costuras del kit**: todo lo que un
 * cliente cambia de sitio en sitio sale de aquí, y de ningún otro sitio. Si un
 * dato de la marca aparece escrito en un componente, ese dato ya no se puede
 * cambiar en un proyecto sin buscarlo por todo el código, y eso es justo lo que
 * este archivo existe para evitar.
 *
 * Cómo se usa: cada proyecto nuevo nace de una copia del kit y lo primero que se
 * toca es este archivo, entero, en unos minutos. El nombre cambia la pestaña del
 * navegador, la cabecera, el pie, la tarjeta al compartir el enlace y el icono;
 * los colores cambian la página completa, porque el CSS no lleva ni un color
 * escrito: los lee de aquí (ver `components/marca/EstilosMarca.tsx`).
 *
 * Y esto lo comprueba `npm run check:marca` en cada compilación: si el nombre de
 * la marca, sus colores o su contacto aparecen en cualquier otro archivo, la
 * compilación falla y dice dónde. No es una formalidad: una costura que se rompe
 * en silencio se descubre en el tercer cliente, cuando ya hay tres proyectos
 * donde arreglarla.
 *
 * Los valores de aquí son de mentira **a propósito** y se ven de mentira: la
 * marca de ejemplo se llama «Kipu» y su contacto está en un dominio reservado
 * (`tu-dominio.example`) que no existe ni puede existir, así que nadie puede
 * recibir los mensajes que se envíen de prueba. Cuando el kit se copia para un
 * proyecto, se reemplaza todo esto por la marca de verdad.
 */

/**
 * Las tipografías que trae puestas el kit.
 *
 * Son tres opciones y no un nombre de fuente suelto, y es por un motivo técnico
 * —las fuentes se descargan al construir, así que tienen que estar cargadas en
 * el código (ver `components/marca/tipografia.ts`)— y por uno práctico: elegir
 * entre tres cuesta un segundo, y buscar una fuente nueva es una tarea que se
 * hace el día que un cliente la traiga en su manual.
 */
export type Tipografia = "inter" | "manrope" | "sistema";

export const marca = {
  /** El nombre, tal y como se lee: cabecera, pestaña del navegador y tarjeta. */
  nombre: "Kipu",

  /** Una línea corta que acompaña al nombre en la pestaña del navegador. */
  eslogan: "Producto digital, listo para comenzar",

  /**
   * La frase que sale en Google y al compartir un enlace, **antes** de que nadie
   * vea la página: no es el titular de la portada y no compite con él.
   *
   * Escribe aquí lo que hace el negocio, para quién y con qué, porque quien la
   * lee todavía no ha visto nada. Y evita las frases que valen para cualquier
   * negocio: una descripción que sirve para todos no le dice a nadie si ese
   * sitio es el suyo.
   */
  descripcion: "Marca de ejemplo del kit. Se reemplaza por la del proyecto en unos minutos.",

  /**
   * El logo en dos formas, y la primera manda.
   *
   * - `archivo`: la ruta de un archivo en `public/` si el proyecto tiene logo
   *   propio. Es un SVG a ser posible: se ve nítido en cualquier pantalla y pesa
   *   nada. Ejemplo: `/marca/logo.svg`.
   * - `monograma`: una o dos letras que el kit dibuja por su cuenta, del color
   *   de acento. Es lo que se ve mientras no hay logo, y sirve para que un
   *   proyecto se pueda enseñar desde el primer día, sin esperar al diseñador.
   */
  logo: {
    archivo: "",
    monograma: "K",
  },

  /**
   * Los colores de la marca. **Cuatro, y con ellos se pinta todo el sitio.**
   *
   * La página no usa solo cuatro tonos: usa grises, tintes y bordes que salen de
   * estos cuatro, mezclándolos con blanco y con negro desde el CSS. Así que lo
   * que se elige aquí es la identidad, no la paleta entera — y por eso un
   * proyecto no se puede cargar el contraste sin querer: los tonos derivados se
   * calculan, no se escriben.
   *
   * - `tinta`: el color del texto. Casi negro, nunca negro puro.
   * - `acento`: el color de los enlaces, los botones y lo que se pulsa.
   * - `marino`: el de los bloques oscuros (el pie, las bandas de cierre).
   * - `lienzo`: el de los fondos que no son blanco puro (las secciones alternas).
   */
  colores: {
    tinta: "#111827",
    acento: "#2563eb",
    marino: "#0b1220",
    lienzo: "#f2f4f7",
  },

  /** Cuál de las tres tipografías del kit usa el proyecto. */
  tipografia: "inter" as Tipografia,

  /** El idioma del contenido, que es lo que va en el `<html lang>` y lo que usan los buscadores. */
  idioma: "es",

  /**
   * El contacto del negocio.
   *
   * El correo de aquí **sí se publica**: es la dirección de cara al público, la
   * que el visitante lee o pulsa. La dirección a la que llegan los mensajes del
   * formulario es otra cosa y vive en el servidor, no en este archivo: si
   * estuviera aquí, viajaría dentro del JavaScript de la página a la vista de
   * cualquiera. Son dos direcciones distintas a propósito.
   */
  contacto: {
    correo: "hola@tu-dominio.example",
    telefono: "+34 600 000 000",
  },
} as const;

/** El teléfono listo para un enlace: sin espacios ni símbolos. */
export const telefonoEnlazable = `tel:${marca.contacto.telefono.replace(/[^\d+]/g, "")}`;
