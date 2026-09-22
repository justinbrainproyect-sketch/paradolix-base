import type { MetadataRoute } from "next";

import { urlPublica } from "@/config/kit";
import { entorno } from "@/lib/entorno";

/**
 * El mapa del sitio: la lista de páginas que se le entrega a Google.
 *
 * Hoy tiene una sola entrada, y es correcto: el esqueleto tiene una sola página.
 * Va aquí desde el primer día, y no en el paso 10, porque es el archivo que se
 * olvida y el que después se descubre vacío en Search Console —el día que
 * interesa, o sea, el peor—. Añadir una página es añadir una línea.
 *
 * Fuera de producción se devuelve vacío: no hay nada que declarar de un sitio
 * que no se debe indexar, y así el archivo tampoco anuncia direcciones que no
 * existen en el dominio de verdad.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!entorno.esProduccion) return [];

  return [
    {
      url: `${urlPublica}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
