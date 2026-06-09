/**
 * ============================================================
 *  MÉTODO DE DESCOMPOSICIÓN DE CROUT
 *  ============================================================
 *  Descompone una matriz A en el producto L·U donde:
 *    L = Triangular inferior (diagonal NO necesariamente 1)
 *    U = Triangular superior (diagonal = 1, "unitaria")
 *
 *  Luego resuelve Ax = b en 3 pasos:
 *    1) A = L·U      → Factorización
 *    2) L·y = b      → Sustitución hacia adelante
 *    3) U·x = y      → Sustitución hacia atrás
 */

/** Una celda de matriz con su valor y metadata */
export interface CeldaMatriz {
  valor: number;
  /** Si está "bloqueada" (ya calculada en pasos anteriores) */
  fija: boolean;
  /** Si es la celda que se está calculando en este paso */
  actual: boolean;
}

/** Estado completo de las matrices en un paso */
export interface EstadoMatrices {
  L: CeldaMatriz[][];
  U: CeldaMatriz[][];
  /** Fila de L que se está usando (resaltada), -1 si ninguna */
  filaL: number;
  /** Columna de U que se está usando (resaltada), -1 si ninguna */
  columnaU: number;
  /** Productos intermedios: [valorCeldaL, valorCeldaU, producto] */
  productos: { valL: number; valU: number; prod: number }[];
}

/** Resultado completo del método de Crout */
export interface CroutResult {
  A: number[][];
  b: number[];
  L: number[][];
  U: number[][];
  y: number[];
  x: number[];
  /** Pasos visuales para la factorización */
  pasosLU: PasoVisual[];
  /** Pasos visuales para sustitución hacia adelante */
  pasosY: PasoAdelante[];
  /** Pasos visuales para sustitución hacia atrás */
  pasosX: PasoAtras[];
}

/** Paso visual de factorización: calcular una celda de L o U */
export interface PasoVisual {
  /** "L" o "U" */
  tipo: "L" | "U";
  /** Fila de la celda que se calcula (0-indexed) */
  fila: number;
  /** Columna de la celda que se calcula (0-indexed) */
  columna: number;
  /** Fila de L usada para el producto (igual a `fila` si es L, igual a `columna` si es U) */
  filaActiva: number;
  /** Columna de U usada para el producto (igual a `columna` si es L, igual a `fila` si es U) */
  colActiva: number;
  /** Pares (L[i][k], U[k][j]) que se multiplican y suman */
  terminos: { valL: number; valU: number; prod: number }[];
  /** La suma de todos los productos */
  suma: number;
  /** Valor de A en esa posición */
  valorA: number;
  /** Resultado final */
  resultado: number;
  /** Si es U, el pivote L[j][j] usado para dividir */
  pivote?: number;
}

/** Paso de sustitución hacia adelante */
export interface PasoAdelante {
  fila: number;
  terminos: { valL: number; valY: number; prod: number }[];
  suma: number;
  valorB: number;
  pivote: number;
  resultado: number;
}

/** Paso de sustitución hacia atrás */
export interface PasoAtras {
  fila: number;
  terminos: { valU: number; valX: number; prod: number }[];
  suma: number;
  valorY: number;
  resultado: number;
}

// ============================================================
//  ALGORITMO PRINCIPAL
// ============================================================

export function crout(A: number[][], b: number[]): CroutResult {
  const n = A.length;

  // Inicializar L y U con ceros
  const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const U: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  // Diagonal de U = 1 (definición de Crout)
  for (let i = 0; i < n; i++) U[i][i] = 1;

  const pasosLU: PasoVisual[] = [];
  const pasosY: PasoAdelante[] = [];
  const pasosX: PasoAtras[] = [];

  // ==========================================================
  //  PASO 1: FACTORIZACIÓN A = L·U
  // ==========================================================
  // Recorremos por columnas j. Para cada columna:
  //   a) Calcular L[i][j] para i=j..n-1 (hacia abajo)
  //   b) Calcular U[j][i] para i=j+1..n-1 (hacia la derecha)

  for (let j = 0; j < n; j++) {
    // --- a) Elementos de L en la columna j ---
    // L[i][j] = A[i][j] - Σ(k=0→j-1) L[i][k]·U[k][j]
    for (let i = j; i < n; i++) {
      const terminos: { valL: number; valU: number; prod: number }[] = [];
      let suma = 0;
      for (let k = 0; k < j; k++) {
        const prod = L[i][k] * U[k][j];
        terminos.push({ valL: L[i][k], valU: U[k][j], prod });
        suma += prod;
      }
      L[i][j] = A[i][j] - suma;

      pasosLU.push({
        tipo: "L",
        fila: i,
        columna: j,
        filaActiva: i,
        colActiva: j,
        terminos,
        suma,
        valorA: A[i][j],
        resultado: L[i][j],
      });
    }

    // --- b) Elementos de U en la fila j (a la derecha de la diagonal) ---
    // U[j][i] = (A[j][i] - Σ(k=0→j-1) L[j][k]·U[k][i]) / L[j][j]
    const pivote = L[j][j];
    if (Math.abs(pivote) < 1e-12) {
      throw new Error(
        `Pivote L[${j + 1}][${j + 1}] ≈ 0. La matriz es singular.`
      );
    }

    for (let i = j + 1; i < n; i++) {
      const terminos: { valL: number; valU: number; prod: number }[] = [];
      let suma = 0;
      for (let k = 0; k < j; k++) {
        const prod = L[j][k] * U[k][i];
        terminos.push({ valL: L[j][k], valU: U[k][i], prod });
        suma += prod;
      }
      U[j][i] = (A[j][i] - suma) / pivote;

      pasosLU.push({
        tipo: "U",
        fila: j,
        columna: i,
        filaActiva: j,
        colActiva: i,
        terminos,
        suma,
        valorA: A[j][i],
        resultado: U[j][i],
        pivote,
      });
    }
  }

  // ==========================================================
  //  PASO 2: SUSTITUCIÓN HACIA ADELANTE  L·y = b
  // ==========================================================
  const y: number[] = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const terminos: { valL: number; valY: number; prod: number }[] = [];
    let suma = 0;
    for (let k = 0; k < i; k++) {
      const prod = L[i][k] * y[k];
      terminos.push({ valL: L[i][k], valY: y[k], prod });
      suma += prod;
    }
    y[i] = (b[i] - suma) / L[i][i];
    pasosY.push({
      fila: i,
      terminos,
      suma,
      valorB: b[i],
      pivote: L[i][i],
      resultado: y[i],
    });
  }

  // ==========================================================
  //  PASO 3: SUSTITUCIÓN HACIA ATRÁS  U·x = y
  // ==========================================================
  const x: number[] = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    const terminos: { valU: number; valX: number; prod: number }[] = [];
    let suma = 0;
    for (let k = i + 1; k < n; k++) {
      const prod = U[i][k] * x[k];
      terminos.push({ valU: U[i][k], valX: x[k], prod });
      suma += prod;
    }
    x[i] = y[i] - suma;
    pasosX.push({
      fila: i,
      terminos,
      suma,
      valorY: y[i],
      resultado: x[i],
    });
  }

  return { A, b, L, U, y, x, pasosLU, pasosY, pasosX };
}

/** Redondear a decimales */
export function rd(val: number, dec: number = 4): number {
  const f = Math.pow(10, dec);
  return Math.round(val * f) / f;
}
