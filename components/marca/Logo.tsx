import { marca } from "@/config/marca";

type Props = {
  /**
   * `claro` es el logo sobre fondo blanco; `oscuro`, sobre tinta o marino. No es
   * un color distinto: es la misma pieza con el texto en blanco, y existe porque
   * un logo que solo funciona sobre blanco obliga a inventarse un segundo logo
   * para el pie.
   */
  tono?: "claro" | "oscuro";
};

/**
 * El logo, en sus dos formas posibles.
 *
 * Con logo propio (`marca.logo.archivo`) se sirve el archivo, y a ser posible un
 * SVG: nítido en cualquier pantalla y sin pedirle nada a nadie. Sin logo, el kit
 * dibuja un **monograma** —una o dos letras del color de acento— para que un
 * proyecto se pueda enseñar el primer día, antes de que haya diseñador.
 *
 * Es un `<img>` normal y no el optimizador de Next, a propósito: un logo es un
 * archivo pequeño, con un ancho conocido y que casi siempre es vectorial, así que
 * pasarlo por un redimensionador no ahorra nada y añade un paso donde el logo
 * puede salir borroso. La alternativa —y el motivo de que esto sea un componente
 * y no una línea de cada pantalla— es que el día que se sustituya el monograma
 * por el logo de verdad no haya que tocar la cabecera, el pie, la tarjeta al
 * compartir y el icono del navegador.
 */
export function Logo({ tono = "claro" }: Props) {
  if (marca.logo.archivo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={marca.logo.archivo}
        alt={marca.nombre}
        height={36}
        className="h-9 w-auto"
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-lg bg-acento text-base font-semibold text-white"
      >
        {marca.logo.monograma}
      </span>
      <span
        className={`text-lg font-semibold tracking-tight ${
          tono === "oscuro" ? "text-white" : "text-tinta"
        }`}
      >
        {marca.nombre}
      </span>
    </span>
  );
}
