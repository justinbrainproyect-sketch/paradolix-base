/**
 * LA COSTURA DE LOS AJUSTES.
 *
 * La segunda de las dos costuras del kit. Aquí vive lo que cambia de un proyecto
 * a otro y **no es la marca**: la dirección pública del sitio y qué piezas del
 * kit están encendidas.
 *
 * Lo que **no** vive aquí, y es importante que no venga: ninguna clave, ningún
 * secreto y ningún dato de cliente. Las claves van en el entorno —el panel de
 * Vercel y un `.env.local` que nunca se sube—, y el archivo `.env.example` es la
 * lista de cuáles existen, con sus nombres y sin ningún valor real. Lo comprueba
 * `npm run check:secretos` antes de cada compilación.
 */

/**
 * La dirección pública del sitio, sin barra final.
 *
 * De aquí salen el canónico, el mapa del sitio, los datos estructurados y las
 * tarjetas al compartir un enlace, así que si se queda sin rellenar, Google
 * aprende una dirección que no es la del proyecto.
 *
 * **El valor de respaldo es inerte a propósito**: `tu-dominio.example` usa un
 * sufijo reservado por la IANA (RFC 2606) que no existe ni puede existir. La
 * alternativa —adivinar el `.com` de la marca— es peor de lo que parece: si ese
 * dominio es de otro, el sitio le está diciendo a Google que el oficial vive
 * allí. Un respaldo que no engaña a nadie vale más que uno que acierta a veces.
 */
export const urlPublica = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://tu-dominio.example"
).replace(/\/+$/, "");

/**
 * Las piezas del kit y si están encendidas.
 *
 * Esta lista hace dos trabajos a la vez, y por eso está escrita una sola vez:
 *
 * 1. **Es el interruptor.** Cada pieza del kit se enciende o se apaga desde su
 *    `encendida`. Apagada no es «falta»: es que ese proyecto no la necesita, y
 *    lo que tiene que pasar es que no deje rastro —ni un enlace, ni una pestaña,
 *    ni un hueco, ni un texto que prometa lo que no hay—. Un proyecto no se
 *    construye recortando el kit, sino encendiendo lo que usa.
 * 2. **Es el mapa.** El esqueleto del kit se pinta a sí mismo con esta lista, así
 *    que siempre dice la verdad de lo que está montado y de lo que falta.
 *
 * El orden es el de construcción, que es el del documento del plan. Y `paso` no
 * es decorativo: es el número de paso del plan, el que dice cuándo llega cada
 * pieza y qué hace falta de quien encarga el proyecto.
 */
export const PIEZAS = [
  {
    id: "esqueleto",
    nombre: "El esqueleto, y dos entornos",
    resumen: "La casa vacía con la puerta puesta: estructura, marca, ajustes y la dirección publicada.",
    paso: 1,
    encendida: true,
  },
  {
    id: "cuentas",
    nombre: "Las cuentas, y el derecho al olvido",
    resumen: "Registrarse, entrar, recuperar la contraseña, el perfil y poder descargar o borrar lo propio.",
    paso: 2,
    encendida: false,
  },
  {
    id: "roles",
    nombre: "Roles, panel y la tabla",
    resumen: "Quién puede qué, con permisos de verdad, y la lista que se busca, se filtra y se saca a Excel.",
    paso: 3,
    encendida: false,
  },
  {
    id: "ajustes",
    nombre: "Los ajustes del cliente",
    resumen: "Que cambie su logo, sus colores y sus textos sin llamar a nadie.",
    paso: 4,
    encendida: false,
  },
  {
    id: "equipos",
    nombre: "Equipos, registro y avisos",
    resumen: "Invitar a un empleado con su rol, dejar escrito quién hizo qué y avisar dentro de la aplicación.",
    paso: 5,
    encendida: false,
  },
  {
    id: "cobros",
    nombre: "Cobros",
    resumen: "Suscripción o pago único, impuestos, factura, portal del cliente y avisos de cobro fallido.",
    paso: 6,
    encendida: false,
  },
  {
    id: "correos",
    nombre: "Correos",
    resumen: "Los cuatro correos de cualquier producto, con la marca del cliente puesta.",
    paso: 7,
    encendida: false,
  },
  {
    id: "taller",
    nombre: "Las piezas de taller",
    resumen: "Archivos, documentos en PDF, firma en pantalla y avisos que salen solos por fecha.",
    paso: 8,
    encendida: false,
  },
  {
    id: "robustez",
    nombre: "Robustez",
    resumen: "Copias con restauración probada, salud del proyecto, anti-abuso y aviso de caída.",
    paso: 9,
    encendida: false,
  },
  {
    id: "capa-publica",
    nombre: "La capa pública",
    resumen: "La web de cara al visitante: legales, aviso de cookies, buscadores y formulario de contacto.",
    paso: 10,
    encendida: false,
  },
  {
    id: "traspaso",
    nombre: "El traspaso del día 21",
    resumen: "La entrega convertida en una lista que no deja saltarse un paso, con su documento.",
    paso: 11,
    encendida: false,
  },
  {
    id: "prueba",
    nombre: "La comprobación del kit y la guía",
    resumen: "Un clon se monta rellenando huecos siguiendo un documento, y `check:kit` avisa si se contamina.",
    paso: 12,
    encendida: false,
  },
] as const;

export type PiezaId = (typeof PIEZAS)[number]["id"];

/** Las piezas que este proyecto usa. Es la pregunta que se hace el código. */
export function encendida(id: PiezaId): boolean {
  return PIEZAS.some((pieza) => pieza.id === id && pieza.encendida);
}

/** Las que están puestas, y las que faltan. El esqueleto las enseña separadas. */
export const encendidas = PIEZAS.filter((pieza) => pieza.encendida);
export const pendientes = PIEZAS.filter((pieza) => !pieza.encendida);
