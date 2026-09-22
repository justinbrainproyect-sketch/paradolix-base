/**
 * Los datos de ejemplo del kit.
 *
 * Fuera de producción, el sitio enseña esto en lugar de datos reales, y lo dice
 * en la cabecera. No es un adorno: es lo que permite **enseñar una aplicación
 * funcionando antes de que exista**, con la marca del prospecto puesta, sin
 * tocar ni un dato de nadie. Y es lo que evita el accidente clásico de probar
 * sobre los datos de un cliente porque no había otros.
 *
 * Los nombres son de mentira y se ven de mentira: nadie va a confundir a Marta
 * Río con un usuario real. Están escritos a mano y no generados para que se lea
 * lo que son.
 *
 * El día que exista la base de datos (paso 2), esta muestra sigue siendo la del
 * entorno de pruebas: es la que se enseña en la web pública de un proyecto y en
 * las demostraciones, y la que deja probar un flujo entero sin ensuciar nada.
 */

/** Una fila de la lista. Los campos son los de cualquier tabla del kit. */
export type FilaDeEjemplo = {
  nombre: string;
  /** El estado, que en cada proyecto se llamará de una manera. */
  estado: "Activo" | "Pendiente" | "De baja";
  /** La fecha, siempre en el mismo formato: año-mes-día. */
  alta: string;
  /** Un importe, en euros. */
  importe: number;
};

export const FILAS_DE_EJEMPLO: FilaDeEjemplo[] = [
  { nombre: "Marta Río", estado: "Activo", alta: "2026-01-14", importe: 49 },
  { nombre: "Luis Peña", estado: "Activo", alta: "2026-02-03", importe: 49 },
  { nombre: "Ana Sáez", estado: "Pendiente", alta: "2026-02-19", importe: 89 },
  { nombre: "Nuria Vidal", estado: "Activo", alta: "2026-03-02", importe: 89 },
  { nombre: "Iván Cortés", estado: "De baja", alta: "2026-03-11", importe: 49 },
];

/** El importe de una fila, escrito como se lee en España: 49 € y 89 €. */
export function importeEnEuros(importe: number): string {
  return `${importe.toLocaleString("es-ES")} €`;
}

/** Una fecha de la muestra, escrita como se lee: 14 de enero de 2026. */
export function fechaEnPalabras(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  return `${dia} de ${meses[mes - 1]} de ${anio}`;
}
