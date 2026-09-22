import { ImageResponse } from "next/og";

import { marca } from "@/config/marca";

/**
 * El icono que sale en la pestaña del navegador y en los marcadores.
 *
 * Como la tarjeta al compartir, se genera desde la marca en vez de ser un archivo
 * guardado: el monograma y el color de acento son los mismos que usa la cabecera,
 * así que cambiar de cliente cambia también la pestaña. Un proyecto con logo
 * propio lo sustituye por su archivo —basta con dejar `favicon.ico` en `app/`— y
 * este archivo se borra; mientras tanto, ninguna página sale con el icono gris de
 * serie, que es lo primero que delata que un sitio está a medio hacer.
 */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icono() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          borderRadius: 14,
          backgroundColor: marca.colores.acento,
          color: "#ffffff",
          fontSize: 38,
          fontWeight: 600,
        }}
      >
        {marca.logo.monograma}
      </div>
    ),
    size,
  );
}
