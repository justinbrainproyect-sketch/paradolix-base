import { entorno } from "@/lib/entorno";
import { Logo } from "@/components/marca/Logo";

/**
 * La cabecera del esqueleto.
 *
 * Hoy lleva dos cosas: el logo y el aviso de entorno. Ninguna de las dos sobra.
 *
 * El **aviso de entorno** solo aparece fuera de producción, y es una pieza de
 * seguridad, no un adorno: es lo que hace imposible confundir el sitio de
 * pruebas con el de verdad. Sin él, la forma de saber dónde estás es mirar la
 * barra de direcciones, y eso no lo hace nadie mientras prueba.
 *
 * Y no lleva menú porque todavía no hay a dónde ir: un menú que no lleva a
 * ningún sitio es la primera cosa que hace que un proyecto parezca a medias. El
 * menú entra con las secciones del paso 10, cuando existan.
 */
export function Cabecera() {
  return (
    <header className="sticky top-0 z-40 border-b border-linea/70 bg-white/85 backdrop-blur">
      <div className="contenedor flex h-16 items-center justify-between">
        <Logo />

        {!entorno.esProduccion && (
          <span className="inline-flex items-center gap-2 rounded-full border border-linea bg-lienzo px-3 py-1.5 text-xs font-medium text-tinta-suave">
            <span aria-hidden className="size-1.5 rounded-full bg-acento" />
            {entorno.etiqueta}
          </span>
        )}
      </div>
    </header>
  );
}
