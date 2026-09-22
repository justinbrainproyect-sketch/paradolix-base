import type { Metadata, Viewport } from "next";

import { EstilosMarca } from "@/components/marca/EstilosMarca";
import { claseDeTipografia } from "@/components/marca/tipografia";
import { urlPublica } from "@/config/kit";
import { marca } from "@/config/marca";
import { entorno } from "@/lib/entorno";

import "./globals.css";

/**
 * El armazón de todas las páginas del proyecto.
 *
 * Aquí está el **contrato del paso 1**: si un dato de la marca aparece escrito
 * en este archivo en lugar de leerse de `config/marca.ts`, la costura está rota y
 * cada cliente nuevo costaría un rato de buscar y reemplazar por todo el código
 * en vez de un minuto. Por eso el título, la descripción, el nombre de la
 * aplicación, el color de la barra del navegador y el idioma salen todos de la
 * marca, y `npm run check:marca` lo comprueba en cada compilación.
 */
export const metadata: Metadata = {
  metadataBase: new URL(urlPublica),
  applicationName: marca.nombre,
  /**
   * El título de la pestaña: el nombre de la marca y su eslogan. La plantilla es
   * lo que hace que una página interior diga «Preguntas» seguido del nombre de la
   * marca, sin que cada página tenga que escribirlo: escribirlo sería copiar la
   * marca en cada archivo nuevo, que es justo lo que el kit evita.
   */
  title: {
    default: `${marca.nombre} · ${marca.eslogan}`,
    template: `%s | ${marca.nombre}`,
  },
  description: marca.descripcion,
  /**
   * Fuera de producción, **no se indexa**: si el sitio de pruebas se indexara,
   * competiría en Google con el de verdad y con las mismas palabras, y el que
   * perdería sería el negocio del cliente. Esto es el `<meta robots>`; la regla
   * para los rastreadores está además en `app/robots.ts`.
   */
  robots: { index: entorno.esProduccion, follow: entorno.esProduccion },
  // Aquí **no hay** `alternates` ni `openGraph`, y parece el sitio cómodo para
  // ellos: los objetos anidados de metadatos se sustituyen, no se fusionan, así
  // que un canónico en el layout convertiría cada página nueva en un duplicado
  // declarado de la portada, y un `openGraph` aquí dejaría a las demás sin tipo
  // y sin imagen al compartirlas. Los declara cada página con `pageMetadata()`.
};

/** El color de la barra del navegador en móvil: el marino de la marca. */
export const viewport: Viewport = {
  themeColor: marca.colores.marino,
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={marca.idioma} className={claseDeTipografia(marca.tipografia)}>
      <body className="bg-white antialiased">
        {/* Los colores de la marca, lo primero: antes de que se pinte nada. */}
        <EstilosMarca />
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-tinta focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
