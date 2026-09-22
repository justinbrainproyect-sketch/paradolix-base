# El Kit 0 · la base del estudio

> **Esto no es la web de ningún cliente y no aparece en ninguna propuesta.** Es el
> suelo sobre el que se levanta cada proyecto: la parte que se repite en todos, ya
> construida y probada, para que el tiempo de los 21 días se vaya entero a lo que
> hace única la idea de cada cliente.

Aquí se trabaja una sola vez y se copia muchas. Todo lo que entra tiene que
servir para **cualquier** negocio: ni «inmueble», ni «paciente», ni «alumno». Si
una pieza necesita el vocabulario de un sector, va en el proyecto de ese cliente y
no aquí.

## Arrancarlo

Hace falta Node 22 o superior. Y nada más: las dos cuentas que necesita este paso
—GitHub y Vercel— tienen plan gratuito.

```bash
npm install     # la primera vez, y cada vez que cambie package.json
npm run dev     # y a mirar en http://localhost:3000
```

Los cuatro comandos que se usan a diario:

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Levanta el proyecto en el portátil, con recarga al guardar. |
| `npm run build` | Compila como lo hará Vercel, y antes ejecuta los chequeos. |
| `npm run typecheck` | Comprueba que los tipos cuadran. Rápido, y caza la mitad de los errores tontos. |
| `npm run check:marca` · `check:secretos` | Las dos comprobaciones que rompen el build si algo se ha desmontado. Van solas dentro de `build`. |
| `npm run migrar` | Pone la base de datos al día: aplica las migraciones que falten. |
| `npm run check:cuentas` | La prueba de las cuentas contra el proyecto de verdad. Crea y borra cuentas, así que se lanza a mano. |

## Las dos costuras

**Todo** lo que cambia de un cliente a otro sale de dos archivos. Es la regla más
importante del kit, porque una costura que se rompe no da ningún error: la web se
sigue viendo perfecta y el problema aparece en el tercer proyecto, cuando hay tres
sitios donde arreglarlo.

| Archivo | Qué lleva |
| --- | --- |
| **`config/marca.ts`** | Nombre, eslogan, descripción, logo, los cuatro colores, tipografía, idioma y contacto. |
| **`config/kit.ts`** y las variables | La dirección pública y qué piezas del kit están encendidas. Las claves van en el entorno, **nunca** aquí. |

Y `npm run check:marca` lo comprueba en cada compilación: si el nombre de la
marca, un color, el eslogan o el contacto aparecen escritos en cualquier otro
archivo —código, CSS o documentación—, **el build falla y dice la línea exacta**.
También falla si alguien escribe un color a mano en un componente, que es el fallo
que más veces se comete sin darse cuenta porque el sitio sigue viéndose bien.

## Cambiar de marca, entero, en cinco minutos

1. Abrir `config/marca.ts` y reemplazar el nombre, el eslogan y la descripción.
2. Poner los cuatro colores de la marca y elegir una de las tres tipografías.
3. Poner el contacto de verdad.
4. Si el proyecto tiene logo, dejar el archivo en `public/marca/` y escribir su
   ruta en `logo.archivo`. Mientras no lo haya, el kit dibuja un monograma con las
   letras que se le digan.
5. Arrancar y mirar: la pestaña del navegador, la cabecera, el pie, el icono y la
   tarjeta al compartir cambian **todas**. Si alguna se queda atrás, es un fallo
   del kit, no del proyecto: se arregla aquí.

Los cuatro colores de la marca son cuatro y no veinte a propósito: los grises, los
bordes, los tintes y la sombra de las tarjetas se **calculan** mezclándolos con
blanco y negro desde el CSS. Así un proyecto no puede dejar la página ilegible
eligiendo mal un gris, y cambiar la marca no obliga a repasar veinte tonos a mano.

## Los dos entornos, y por qué probar no da miedo

El mismo código corre en tres sitios, y la página dice en cuál está sin que haya
que mirar la barra de direcciones:

| Entorno | Dónde | Qué cambia |
| --- | --- | --- |
| **Desarrollo** | Tu ordenador | Datos de ejemplo y aviso en la cabecera. |
| **Pruebas** | El despliegue de Vercel de una rama o un commit | Lo mismo, y **no se indexa en Google**. |
| **Producción** | La dirección de verdad | Datos reales, se indexa, y la muestra desaparece. |

Que el sitio de pruebas **no se indexe** no es un detalle: es una copia exacta del
de verdad, así que si Google la indexara tendría dos direcciones con el mismo
contenido y el cliente pagaría por una que compite contra sí misma. Está en
`app/robots.ts` y en el `<meta robots>`, y `check:marca` falla si alguien lo quita
sin querer.

Para probar los otros entornos desde el portátil, `NEXT_PUBLIC_ENTORNO=pruebas` en
el `.env.local`.

## Qué hay montado

**El paso 1: el esqueleto.** La casa vacía con la puerta puesta, el agua y la luz:

- Next.js con Tailwind, la estructura de carpetas y el atajo `@/`.
- Las dos costuras, con su comprobación.
- La marca puesta en la pestaña, la cabecera, el pie, el icono, la tarjeta al
  compartir y el color de la barra del navegador en móvil.
- Los dos entornos, con los datos de ejemplo y la protección de indexación.
- `app/robots.ts` y `app/sitemap.ts`, que nadie recuerda poner hasta que hacen
  falta y ya es tarde.- Los dos chequeos y el flujo de GitHub que los ejecuta en cada push.

**El paso 2: las cuentas y el derecho al olvido.** Las tres tablas de la base —los
negocios, las personas y quién pertenece a qué—, con sus cortafuegos y sus reglas,
las migraciones que las ponen ahí, y una prueba que recorre el camino entero con dos
personas de verdad. El detalle está más abajo, en *La base de datos*.

Y **nada más de funcionalidad todavía**: lo que se hace mal en la base se paga en
cada proyecto siguiente, porque es la pieza que nadie vuelve a tocar.

Las diez piezas que faltan están listadas en la propia página del esqueleto, y sale
de `config/kit.ts`: encender una es poner su `encendida` en `true` y construirla.
El orden y qué hace falta para cada una está en el plan, paso a paso, que vive en el
repositorio del estudio (documento `KIT-0-PASO-A-PASO.md`).

## La base de datos

La primera pieza de verdad, construida y probada contra un proyecto de Supabase real.
Son **tres tablas**, y cada una contesta una pregunta:

| Tabla | Qué guarda |
| --- | --- |
| `negocios` | Un espacio de trabajo con su nombre. Un cliente puede tener dos: dos sedes, dos marcas. |
| `perfiles` | Lo que se enseña de una persona. La cuenta de acceso la guarda Supabase aparte, en su esquema `auth`. |
| `miembros` | Quién está en qué negocio y con qué papel: `dueno`, `admin` o `miembro`. |

**La regla que lo gobierna todo:** sin fila en `miembros`, no se ve nada de ese
negocio. No hay permiso por defecto ni para el dueño, así que la clave que viaja al
navegador podría publicarse en la portada sin que cambiara nada: lo que decide es
quién pregunta, fila por fila.

Cada tabla tiene su cortafuegos encendido y sus reglas escritas, y las funciones que
hacen falta **por dentro** —las que usan esas reglas, y la que crea el perfil al
registrarse— viven en un esquema que no está publicado (`privado`). Así no son una
puerta más de la API: por eso el auditor de seguridad del proyecto tiene tres avisos
y no diez, y los tres que quedan son funciones que la aplicación llama a propósito.

### Ponerla al día, y comprobarla

```bash
npm run migrar         # aplica las migraciones que falten, en orden
npm run check:cuentas  # la prueba de verdad: dos personas, dos negocios, y a ver quién ve qué
```

La prueba se lanza a mano y no dentro del build, porque **crea y borra cuentas de
verdad** y no tiene sentido que la compilación dependa de la red. Al terminar,
comprueba que la base quedó con cero filas.

### Las claves, y dónde viven

- **`.freebuff/claves.txt`** — la dirección del proyecto y el token de Supabase, que
  es lo que necesita `npm run migrar`.
- **`.env.local`** — la dirección, la clave publicable y la del servidor, que es lo
  que necesita la aplicación.

Los dos están ignorados por git y `check:secretos` lo vigila. Dos cosas que costó
aprender y conviene no volver a averiguar:

- **El token necesita los permisos en «Read-write»**, no en «Read»: el de `Database`
  y el de `Migrations`. Con el de lectura, la base recibe al script como
  `supabase_read_only_user` y contesta «no puedo crear tablas en una transacción de
  solo lectura», que suena a problema de la base cuando es del permiso. Por eso
  `npm run migrar` comprueba el permiso **antes** de intentar nada y lo dice con esas
  palabras.
- **Este proyecto no acepta todavía la clave secreta nueva** (`sb_secret_`): la
  rechaza en todos los servicios, también en el de las cuentas. La del servidor es la
  clásica `service_role`, y por eso **no hay que desactivarla**. El día que Supabase
  la acepte, se cambia el valor y no el nombre.

## Cómo nace un proyecto nuevo

1. **Copiar la carpeta** del kit con el nombre del proyecto. No se trabaja sobre el
   kit: cada proyecto se lleva su copia, para que un cambio de un cliente no pueda
   tocar a otro.
2. **Cambiar la marca**: los cinco minutos de arriba.
3. **Rellenar la dirección** en el entorno, cuando haya dominio.
4. **Subir el proyecto a GitHub** en un repositorio nuevo y privado, y conectarlo en
   Vercel. A partir de ahí, cada `git push` publica solo (Vercel despliega cada
   commit: el de `main` a producción y los demás a una dirección de prueba).
5. **Apuntar las cuentas** del proyecto en su hoja: qué servicio, de quién es y con
   qué correo se abrió. Se abre con **el correo del cliente**, no con el del
   estudio: así «todo queda a tu nombre» es literal, aunque las cuentas las hayas
   creado tú.
6. **Borrar esta página** el día que exista la web del cliente. El esqueleto es
   para el día que se empieza, no para leerlo dos veces.

Una advertencia que conviene tener escrita: **copiar el kit tiene un precio
oculto**, y es que cada copia se separa de las demás. Con pocos proyectos se
resuelve apuntando los cambios del kit en una lista y aplicándolos al siguiente que
se abra; cuando haya tres o cuatro vivos, toca plantear el kit como una pieza
compartida en vez de una copia.

## Lo que no se negocia

1. **Ningún proyecto de cliente entra aquí.** Ni código, ni claves, ni datos, ni
   nombres de tabla.
2. **Nada sensible dentro del código.** Todo por variables, y `.env.example` lleva
   los nombres y ninguna clave.
3. **Genérico de verdad.** Ninguna pieza puede llevar el vocabulario de un sector.
4. **Cada pieza nace con su prueba.** Una pieza que no se puede comprobar es una
   pieza que se romperá sin que nadie se entere.
5. **El kit no se enseña.** No aparece en la web ni en una propuesta.
