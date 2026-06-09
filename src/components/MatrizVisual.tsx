"use client";

import { rd } from "@/lib/crout";

interface MatrizVisualProps {
  /** Datos de la matriz (puede tener NaN para celdas no calculadas) */
  datos: number[][];
  /** Etiqueta (ej: "L", "U") */
  label?: string;
  /** Filas a resaltar con color naranja (fila activa para multiplicar) */
  resaltarFilas?: number[];
  /** Columnas a resaltar con color azul (columna activa para multiplicar) */
  resaltarColumnas?: number[];
  /** Celda específica que se está calculando AHORA (verde fuerte + anillo) */
  celdaActual?: { fila: number; columna: number };
  /** Si true, las celdas no calculadas (NaN) se muestran como "..." gris claro */
  mostrarVacios?: boolean;
  /** Si es U, marcar la diagonal con 1s fijos en gris */
  esU?: boolean;
}

/**
 * Renderiza una matriz visual. Las celdas aún no calculadas se muestran
 * como "···" en gris claro. Las celdas ya calculadas usan colores según
 * su rol en el paso actual (fila activa L = naranja, columna activa U = azul,
 * celda calculándose = verde con anillo).
 */
export default function MatrizVisual({
  datos,
  label,
  resaltarFilas = [],
  resaltarColumnas = [],
  celdaActual,
  mostrarVacios = false,
  esU = false,
}: MatrizVisualProps) {
  const n = datos.length;

  /**
   * Decide si una celda está "definida" (ya calculada).
   * En U, las celdas de la diagonal siempre son 1 (definidas desde el inicio).
   */
  const estaDefinida = (i: number, j: number, val: number): boolean => {
    if (!mostrarVacios) return true;
    if (esU && i === j) return true; // diagonal de U siempre es 1
    return !isNaN(val) && val !== 0; // 0 real vs 0 placeholder
  };

  /**
   * Clase CSS para cada celda según su estado.
   */
  const claseCelda = (i: number, j: number, val: number): string => {
    const def = estaDefinida(i, j, val);

    // Celda que se está calculando AHORA
    if (
      celdaActual &&
      celdaActual.fila === i &&
      celdaActual.columna === j
    ) {
      return "bg-emerald-400 dark:bg-emerald-600 text-black font-bold ring-2 ring-emerald-500 ring-offset-1 z-10 relative";
    }

    if (!def) {
      // No calculada todavía
      return "bg-gray-100 dark:bg-gray-800/30 text-gray-300 dark:text-gray-600";
    }

    // Ya calculada
    const enFila = resaltarFilas.includes(i);
    const enCol = resaltarColumnas.includes(j);

    if (enFila && enCol) {
      // Intersección fila L × columna U → color fuerte (donde se multiplican)
      return "bg-amber-200 dark:bg-amber-800/50 font-semibold";
    }
    if (enFila) {
      // Fila de L activa → naranja
      return "bg-orange-100 dark:bg-orange-900/40";
    }
    if (enCol) {
      // Columna de U activa → azul
      return "bg-blue-100 dark:bg-blue-800/40";
    }
    // Ya calculada de pasos anteriores → verde suave
    return "bg-green-50 dark:bg-green-900/20";
  };

  return (
    <div className="inline-flex flex-col items-center gap-1">
      {label && (
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      )}
      <div className="flex items-stretch">
        {/* Corchete izquierdo */}
        <div className="flex flex-col justify-center text-muted-foreground font-mono text-lg leading-[1.1] mr-0.5 select-none">
          <span>⎡</span>
          <span>⎢</span>
          <span>⎣</span>
        </div>

        {/* Celdas de la matriz */}
        <table className="border-collapse">
          <tbody>
            {datos.map((fila, i) => (
              <tr key={i}>
                {fila.map((val, j) => {
                  const def = estaDefinida(i, j, val);
                  return (
                    <td
                      key={j}
                      className={`w-16 h-10 text-center font-mono text-sm border border-gray-300 dark:border-gray-600 transition-all duration-300 ${claseCelda(i, j, val)}`}
                    >
                      {def ? rd(val, 4) : "···"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Corchete derecho */}
        <div className="flex flex-col justify-center text-muted-foreground font-mono text-lg leading-[1.1] ml-0.5 select-none">
          <span>⎤</span>
          <span>⎥</span>
          <span>⎦</span>
        </div>
      </div>
    </div>
  );
}
