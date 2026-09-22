import { Inter, Manrope } from "next/font/google";

import type { Tipografia } from "@/config/marca";

/**
 * Las tipografías del kit, cargadas de verdad.
 *
 * Están aquí y no en `config/marca.ts` por un motivo técnico: las fuentes se
 * **descargan al construir**, y eso solo se puede hacer desde el servidor. Si
 * este archivo lo importara un componente de cliente, la compilación fallaría.
 * Por eso la marca dice *cuál* se usa —una palabra— y la fuente se carga aquí.
 *
 * Las tres comparten la misma variable CSS (`--fuente-marca`), así que cambiar
 * de tipografía en la marca no toca ni una clase de los componentes: el sitio
 * entero cambia de letra solo.
 *
 * `display: "swap"` es para que el texto se lea desde el primer momento con la
 * fuente del sistema y cambie cuando llegue la buena, en vez de quedarse en
 * blanco. Y la tercera opción, `sistema`, no descarga nada: es la letra de cada
 * aparato, que es fea de nombre y perfecta cuando alguien pide velocidad por
 * encima de todo.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-marca",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-marca",
});

/** El nombre de la clase que publica la fuente elegida (o nada, si es la del sistema). */
export function claseDeTipografia(tipografia: Tipografia): string {
  if (tipografia === "manrope") return manrope.variable;
  if (tipografia === "inter") return inter.variable;
  return "";
}
