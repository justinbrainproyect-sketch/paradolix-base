/**
 * La misma tarjeta, para X.
 *
 * Es un reexport y no un archivo con su propio diseño a propósito: dos tarjetas
 * separadas se van separando, y el día que se retoca una se descubre que la otra
 * lleva seis meses distinta. Next necesita este archivo con su nombre —es lo que
 * hace que la ruta `/twitter-image` exista, que es la que declaran los metadatos
 * de cada página—, así que la forma corta es esta.
 */
export { alt, size, contentType, default } from "./opengraph-image";
