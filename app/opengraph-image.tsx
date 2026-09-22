import { ImageResponse } from "next/og";

import { marca } from "@/config/marca";
import { ALT_TARJETA } from "@/lib/seo";

/**
 * La tarjeta que se ve al compartir un enlace en WhatsApp, LinkedIn o X.
 *
 * Se **genera** en lugar de ser una imagen guardada, y no es un capricho: una
 * tarjeta guardada es un archivo que hay que volver a hacer cada vez que la
 * marca cambia, y acaba desactualizada siempre —con el nombre viejo, o con el
 * logo anterior, o con el titular de hace dos versiones—. Generada, no puede
 * desincronizarse: si cambia el nombre, cambia la tarjeta.
 *
 * El texto alternativo vive en `lib/seo.ts` porque también lo declaran los
 * metadatos de cada página: con dos copias, la tarjeta y su descripción se irían
 * separando sin que nadie lo note.
 *
 * El tamaño y el fondo son los de siempre —1200 × 630 y la tinta de la marca—
 * porque lo que las plataformas recortan y lo que se lee en un móvil no lo elige
 * cada proyecto.
 */
export const alt = ALT_TARJETA;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Tarjeta() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "72px 64px",
          backgroundColor: marca.colores.marino,
          backgroundImage: `linear-gradient(120deg, ${marca.colores.marino} 40%, ${marca.colores.acento} 190%)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {marca.logo.archivo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={marca.logo.archivo} alt="" width={64} height={64} />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 64,
                height: 64,
                borderRadius: 18,
                backgroundColor: marca.colores.acento,
                color: "#ffffff",
                fontSize: 34,
                fontWeight: 600,
              }}
            >
              {marca.logo.monograma}
            </div>
          )}
          <div style={{ display: "flex", fontSize: 36, fontWeight: 600, color: "#ffffff" }}>
            {marca.nombre}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {marca.eslogan}
          </div>
          {/* La descripción va en tres líneas cortas y explícitas: así nunca se
              sale del panel, sin depender del ajuste de línea del generador. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 26,
              maxWidth: 900,
              fontSize: 40,
              lineHeight: 1.25,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            <div style={{ display: "flex" }}>{marca.descripcion}</div>
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,0.45)" }}>
          {marca.contacto.correo}
        </div>
      </div>
    ),
    size,
  );
}
