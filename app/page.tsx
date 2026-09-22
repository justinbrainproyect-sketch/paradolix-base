import type { Metadata } from "next";

import { Cabecera } from "@/components/estructura/Cabecera";
import { Pie } from "@/components/estructura/Pie";
import { encendidas, pendientes, urlPublica } from "@/config/kit";
import { marca } from "@/config/marca";
import { FILAS_DE_EJEMPLO, fechaEnPalabras, importeEnEuros } from "@/datos/ejemplo";
import { entorno } from "@/lib/entorno";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ path: "/" });

/**
 * El esqueleto del kit.
 *
 * Esta página no es la de ningún proyecto y no se parece a la de ninguno: es la
 * casa vacía que se enseña el día que se copia el kit, para comprobar de un
 * vistazo que las dos costuras funcionan. Tiene tres trabajos:
 *
 * 1. **Confirmar que la marca está puesta.** Los colores, el nombre, la
 *    tipografía, el contacto y la pestaña del navegador salen todos de un
 *    archivo, y aquí se ven juntos para que se pueda comprobar sin abrir el
 *    código.
 * 2. **Decir en qué entorno estás.** La cabecera y la tabla de abajo solo
 *    aparecen fuera de producción, así que es imposible confundir el sitio de
 *    pruebas con el de verdad.
 * 3. **Contar lo que hay montado y lo que falta.** El mapa de las doce piezas
 *    sale de `config/kit.ts`, que es también el interruptor de cada una: no es
 *    una lista escrita a mano que se quedaría vieja, es la verdad del proyecto.
 *
 * El día que un proyecto tenga su web, esta página se reemplaza entera por la
 * del cliente. Es lo primero que se tira, y a propósito: el esqueleto existe
 * para el día que se empieza, no para leerlo dos veces.
 */
export default function Esqueleto() {
  return (
    <>
      <Cabecera />

      <main id="contenido">
        {/* --- 1. La prueba de la marca -------------------------------- */}
        <section className="contenedor pt-16 pb-14 sm:pt-24">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-tinta-suave">
            Kit 0 · Paso 1 · El esqueleto
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold text-tinta sm:text-5xl">
            La base sobre la que se levanta cada proyecto
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-tinta-suave">
            Esto no es la web de ningún cliente. Es la casa vacía con la puerta puesta, el agua y la
            luz: estructura, marca, ajustes, dos entornos y la dirección publicada. Ninguna
            funcionalidad todavía, y eso es lo correcto: lo que se hace mal aquí se paga en cada
            proyecto siguiente.
          </p>

          <div className="mt-12 rounded-2xl border border-linea bg-white p-6 shadow-soft sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold text-tinta">
                Las dos costuras, a la vista
              </h2>
              <p className="text-sm text-tinta-suave">
                Todo lo de abajo sale de <code className="text-tinta">config/marca.ts</code> y{" "}
                <code className="text-tinta">config/kit.ts</code>.
              </p>
            </div>

            <dl className="mt-7 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
              <Dato rotulo="Marca" valor={marca.nombre} nota={`Eslogan: ${marca.eslogan}`} />
              <Dato rotulo="Tipografía" valor={marca.tipografia} nota="Una de las tres del kit" />
              <Dato
                rotulo="Contacto"
                valor={marca.contacto.correo}
                nota={`Teléfono: ${marca.contacto.telefono}`}
              />
              <Dato
                rotulo="Dirección pública"
                valor={urlPublica.replace(/^https?:\/\//, "")}
                nota="De aquí salen el canónico y el mapa del sitio"
              />
            </dl>

            <div className="mt-7 border-t border-linea pt-6">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-tinta-suave">
                Los colores de la marca
              </span>
              <div className="mt-3 flex flex-wrap gap-3">
                {Object.entries(marca.colores as Record<string, string>).map(([nombre, valor]) => (
                  <span key={nombre} className="inline-flex items-center gap-2.5 text-sm text-tinta-suave">
                    <span
                      aria-hidden
                      className="size-7 rounded-lg border border-linea"
                      style={{ backgroundColor: valor }}
                    />
                    {nombre}
                  </span>
                ))}
              </div>
              <p className="mt-4 max-w-2xl text-sm text-tinta-suave">
                Son cuatro y de ellos sale el sitio entero: los grises, los bordes y los tintes se
                calculan mezclándolos con blanco, así que un proyecto no puede dejar la página
                ilegible eligiendo mal un gris.
              </p>
            </div>
          </div>
        </section>

        {/* --- 2. El mapa del kit -------------------------------------- */}
        <section className="border-y border-linea bg-lienzo">
          <div className="contenedor py-16">
            <h2 className="text-2xl font-semibold text-tinta sm:text-3xl">
              Las doce piezas, y en qué punto está cada una
            </h2>
            <p className="mt-4 max-w-2xl text-tinta-suave">
              Encendida no significa «terminada»: significa que está dentro de este proyecto. Una
              pieza apagada no deja rastro —ni un enlace, ni una pestaña, ni un texto que prometa lo
              que no hay—, y por eso un proyecto no se construye recortando el kit, sino encendiendo
              lo que usa.
            </p>

            <h3 className="mt-12 text-sm font-medium uppercase tracking-[0.14em] text-tinta-suave">
              Puestas ({encendidas.length})
            </h3>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {encendidas.map((pieza) => (
                <li key={pieza.id} className="rounded-2xl border border-linea bg-white p-5 shadow-soft">
                  <span className="text-xs font-medium text-acento">Paso {pieza.paso}</span>
                  <h4 className="mt-2 font-semibold text-tinta">{pieza.nombre}</h4>
                  <p className="mt-2 text-sm text-tinta-suave">{pieza.resumen}</p>
                </li>
              ))}
            </ul>

            <h3 className="mt-12 text-sm font-medium uppercase tracking-[0.14em] text-tinta-suave">
              Pendientes ({pendientes.length})
            </h3>
            <ul className="mt-5 divide-y divide-linea overflow-hidden rounded-2xl border border-linea bg-white">
              {pendientes.map((pieza) => (
                <li key={pieza.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-6">
                  <span className="w-20 shrink-0 text-xs font-medium text-tinta-suave">
                    Paso {pieza.paso}
                  </span>
                  <span className="sm:w-72 sm:shrink-0">
                    <span className="font-medium text-tinta">{pieza.nombre}</span>
                  </span>
                  <span className="text-sm text-tinta-suave">{pieza.resumen}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --- 3. Los dos entornos ------------------------------------- */}
        <section className="contenedor py-16">
          <h2 className="text-2xl font-semibold text-tinta sm:text-3xl">
            Un sitio gemelo para probar sin miedo
          </h2>

          {entorno.usaDatosDeEjemplo ? (
            <>
              <p className="mt-4 max-w-2xl text-tinta-suave">
                Estás en <strong className="font-medium text-tinta">{entorno.etiqueta}</strong>, así
                que lo que ves abajo es una muestra escrita a mano. En producción, esta tabla no
                existe: los datos son los de verdad, y esta sección desaparece sola.
              </p>

              <div className="mt-8 overflow-hidden rounded-2xl border border-linea">
                <table className="w-full text-left text-sm">
                  <thead className="bg-lienzo text-xs uppercase tracking-[0.14em] text-tinta-suave">
                    <tr>
                      <th className="px-5 py-3 font-medium">Nombre</th>
                      <th className="px-5 py-3 font-medium">Estado</th>
                      <th className="px-5 py-3 font-medium">Alta</th>
                      <th className="px-5 py-3 text-right font-medium">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-linea bg-white">
                    {FILAS_DE_EJEMPLO.map((fila) => (
                      <tr key={fila.nombre}>
                        <td className="px-5 py-3.5 text-tinta">{fila.nombre}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={
                              fila.estado === "Activo"
                                ? "rounded-full bg-acento-suave px-2.5 py-1 text-xs font-medium text-acento"
                                : "rounded-full bg-lienzo px-2.5 py-1 text-xs font-medium text-tinta-suave"
                            }
                          >
                            {fila.estado}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-tinta-suave">{fechaEnPalabras(fila.alta)}</td>
                        <td className="px-5 py-3.5 text-right text-tinta">
                          {importeEnEuros(fila.importe)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="mt-4 max-w-2xl text-tinta-suave">
              Estás en <strong className="font-medium text-tinta">producción</strong>: los datos de
              ejemplo están apagados y esta página se sirve sin muestra. Los dos entornos comparten
              el mismo código; lo único que cambia es dónde está corriendo y qué enseña.
            </p>
          )}
        </section>

        {/* --- 4. Lo que toca ahora ------------------------------------ */}
        <section className="banda">
          <span aria-hidden className="banda-halo" />
          <div className="contenedor relative py-16">
            <h2 className="max-w-2xl text-2xl font-semibold text-white sm:text-3xl">
              El paso 1 queda firmado. Lo siguiente son las cuentas.
            </h2>
            <p className="mt-5 max-w-2xl text-white/70">
              El paso 2 trae registrarse, entrar, recuperar la contraseña, el perfil y los dos
              botones del derecho al olvido: descargar todo lo mío y borrar mi cuenta. Para montarlo
              hace falta una cuenta de Supabase —la base de datos y los usuarios— y, si se quiere,
              el botón de «entrar con Google».
            </p>
            <p className="mt-5 max-w-2xl text-white/70">
              Las dos son gratuitas para probar y las dos van a tu nombre, no al de un cliente.
            </p>
          </div>
        </section>
      </main>

      <Pie />
    </>
  );
}

/** Una pieza de la lista de datos: rótulo, valor y una nota que lo explica. */
function Dato({ rotulo, valor, nota }: { rotulo: string; valor: string; nota: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.14em] text-tinta-suave">{rotulo}</dt>
      <dd className="mt-2">
        <span className="block font-medium text-tinta">{valor}</span>
        <span className="mt-1 block text-sm text-tinta-suave">{nota}</span>
      </dd>
    </div>
  );
}
