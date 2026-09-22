import type { NextConfig } from "next";

/**
 * Configuración de Next del kit.
 *
 * Aquí no hay ningún dominio autorizado para imágenes, y no es un olvido: el
 * kit no usa `next/image` en ninguna parte de su esqueleto, y un `<img>` normal
 * no pide permisos. El día que un proyecto sirva fotos con el optimizador de
 * Next —que es lo recomendable— aquí es donde se añade el dominio del que
 * vengan, y el propio Next lo dice en el error si se olvida.
 *
 * Tampoco hay `output: "export"`: el kit nace con servidor, porque todo lo que
 * se le va a montar encima —cuentas, cobros, correos, panel— necesita uno.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
