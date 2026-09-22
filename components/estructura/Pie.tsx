import { marca, telefonoEnlazable } from "@/config/marca";
import { Logo } from "@/components/marca/Logo";

/**
 * El pie del esqueleto.
 *
 * Lleva el contacto de la marca —el correo público y el teléfono, los dos
 * pulsables— y una línea que dice lo que esta página es. Esa línea es temporal y
 * se irá sola el día que un proyecto tenga su web de verdad: mientras el kit se
 * enseñe así, conviene que quien lo mire sepa que está viendo el andamio y no un
 * producto a medio terminar.
 *
 * El **correo de aquí se publica**, y es lo correcto: es la dirección de cara al
 * público. La dirección a la que llegan los mensajes del formulario es otra y
 * vivirá en el servidor (paso 10), porque una dirección dentro del JavaScript de
 * la página la lee cualquiera que mire el código fuente.
 */
export function Pie() {
  return (
    <footer className="banda">
      <div className="contenedor flex flex-col gap-8 py-14 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <Logo tono="oscuro" />
          <p className="max-w-sm text-sm text-white/55">
            Esqueleto del Kit 0: la base del estudio, sin nada de ningún cliente dentro.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/45">
            Contacto de la marca
          </span>
          <a href={`mailto:${marca.contacto.correo}`} className="text-white/85 hover:text-white">
            {marca.contacto.correo}
          </a>
          <a href={telefonoEnlazable} className="text-white/85 hover:text-white">
            {marca.contacto.telefono}
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="contenedor flex flex-col gap-2 py-5 text-xs text-white/45 sm:flex-row sm:justify-between">
          <span>
            © {new Date().getFullYear()} {marca.nombre}
          </span>
          <span>La marca y el contacto salen de `config/marca.ts`. Nada más.</span>
        </div>
      </div>
    </footer>
  );
}
