import type { MetadataRoute } from "next";

import { urlPublica } from "@/config/kit";
import { entorno } from "@/lib/entorno";

/**
 * Lo que se le cuenta a los buscadores.
 *
 * Y lo que se le cuenta **depende del entorno**, que es la mitad de este archivo:
 *
 * - En **producción**, entra todo menos las rutas de programación (las que
 *   empiezan por `/api/`, que no son páginas y no tienen nada que hacer en un
 *   índice), y se declara el mapa del sitio para que Google sepa qué páginas hay
 *   sin tener que adivinarlas.
 * - **Fuera de producción, no entra nada.** Es la razón de que este archivo
 *   exista aquí y no se deje para más adelante: el sitio de pruebas de un
 *   proyecto es una copia exacta del de verdad, así que si se indexa, hay dos
 *   direcciones con el mismo contenido y el cliente paga por una que compite
 *   contra sí misma. Apagarlo cuesta tres líneas y arreglarlo después cuesta
 *   esperar semanas a que Google olvide lo que ya aprendió.
 */
export default function robots(): MetadataRoute.Robots {
  if (!entorno.esProduccion) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${urlPublica}/sitemap.xml`,
    host: urlPublica,
  };
}
