import type { Metadata } from "next";

import { marca } from "@/config/marca";

/**
 * Lo que comparten todas las páginas: canónico, Open Graph y Twitter.
 *
 * Existe por una trampa de Next que conviene conocer antes de escribir metadatos
 * a mano: los objetos anidados de metadatos se **sustituyen**, no se fusionan. En
 * cuanto una página declara `openGraph`, deja de heredar el del layout y se queda
 * sin tipo, sin nombre del sitio y —lo que se nota— sin imagen al compartirla.
 * Declarando la tarjeta entera en cada página, compartir un enlace deja de
 * depender de quién herede qué.
 *
 * Y el canónico se declara **en cada página**, no en el layout: un canónico
 * heredado convierte cada página nueva en un duplicado declarado de la portada.
 * Es un error que no rompe nada visible —la web se ve igual— y que se paga en
 * buscadores, así que es exactamente el tipo de cosa que conviene no poder
 * cometer: por eso hay una función y no una plantilla que copiar.
 *
 * Del título y de la descripción no se declara nada aquí a propósito: si faltan,
 * Next los rellena con los de la propia página, así que el `og:` y el `twitter:`
 * no pueden quedar desincronizados del `<title>`.
 */

/** Texto alternativo de la tarjeta social. Vive aquí porque lo usan dos sitios. */
export const ALT_TARJETA = `${marca.nombre} · ${marca.descripcion}`;

/**
 * La tarjeta social es un archivo generado (`app/opengraph-image.tsx`), y
 * `app/twitter-image.tsx` reexporta el mismo. Aquí se declara su ruta a mano,
 * sin el hash de caché que Next añade al vuelo: la ruta responde igual de bien y
 * así los metadatos no dependen de un nombre que cambia en cada compilación.
 */
const tarjeta = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: ALT_TARJETA,
} as const;

const tarjetaTwitter = { ...tarjeta, url: "/twitter-image" } as const;

type Opciones = {
  /** Ruta canónica, con barra inicial. Ej.: `"/privacidad"`. */
  path: string;
  /**
   * Titular distinto para la tarjeta social, solo si de verdad aporta algo. Por
   * defecto no se declara y Next usa el `<title>` de la página.
   */
  socialTitle?: string;
};

export function pageMetadata({ path, socialTitle }: Opciones): Metadata {
  return {
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "es_ES",
      siteName: marca.nombre,
      url: path,
      ...(socialTitle ? { title: socialTitle } : {}),
      images: [tarjeta],
    },
    twitter: {
      card: "summary_large_image",
      ...(socialTitle ? { title: socialTitle } : {}),
      images: [tarjetaTwitter],
    },
  };
}
