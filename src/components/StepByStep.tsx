"use client";

import { useState, useMemo } from "react";
import { CroutResult, rd } from "@/lib/crout";
import MatrizVisual from "@/components/MatrizVisual";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StepByStepProps {
  resultado: CroutResult;
}

/**
 * Muestra la descomposición de Crout paso a paso de forma ultra visual.
 *
 * - Las matrices L y U se llenan progresivamente: celdas vacías = "···"
 * - Cada paso resalta la fila de L y columna de U que se multiplican
 * - Lenguaje simple: "fila 2 × columna 1" en vez de L[2][1]
 * - Se muestran las multiplicaciones intermedias con colores
 */
export default function StepByStep({ resultado }: StepByStepProps) {
  const { A, b, L, U, y, x, pasosLU, pasosY, pasosX } = resultado;
  const n = A.length;

  const [pasoActual, setPasoActual] = useState(0);
  const totalPasos = pasosLU.length + pasosY.length + pasosX.length;

  // ─── Determinar fase actual ───
  const enLU = pasoActual < pasosLU.length;
  const enY = pasoActual >= pasosLU.length && pasoActual < pasosLU.length + pasosY.length;
  const enX = pasoActual >= pasosLU.length + pasosY.length;

  // ─── Construir L y U PARCIALES (solo celdas calculadas hasta este paso) ───
  const { Lparcial, Uparcial, celdasFijasL, celdasFijasU } = useMemo(() => {
    // Inicializar con NaN (≡ no calculado)
    const Lp: number[][] = Array.from({ length: n }, () => Array(n).fill(NaN));
    const Up: number[][] = Array.from({ length: n }, () => Array(n).fill(NaN));

    // Diagonal de U siempre es 1 (definición de Crout)
    for (let i = 0; i < n; i++) Up[i][i] = 1;

    const fijasL: { fila: number; columna: number }[] = [];
    const fijasU: { fila: number; columna: number }[] = [];

    // Rellenar celdas calculadas hasta pasoActual (inclusive)
    const limite = enLU ? pasoActual : pasosLU.length - 1;
    for (let k = 0; k <= Math.min(limite, pasosLU.length - 1); k++) {
      const p = pasosLU[k];
      if (p.tipo === "L") {
        Lp[p.fila][p.columna] = p.resultado;
        fijasL.push({ fila: p.fila, columna: p.columna });
      } else {
        Up[p.fila][p.columna] = p.resultado;
        fijasU.push({ fila: p.fila, columna: p.columna });
      }
    }

    return { Lparcial: Lp, Uparcial: Up, celdasFijasL: fijasL, celdasFijasU: fijasU };
  }, [pasoActual, enLU, pasosLU, n]);

  // ─── Renderizar paso de factorización LU ───
  const renderPasoLU = () => {
    const p = pasosLU[pasoActual];
    const filaActiva = p.tipo === "L" ? p.fila : p.columna; // fila de L usada
    const colActiva = p.tipo === "U" ? p.columna : p.fila;  // columna de U usada
    const nombre =
      p.tipo === "L"
        ? `L (fila ${p.fila + 1}, col ${p.columna + 1})`
        : `U (fila ${p.fila + 1}, col ${p.columna + 1})`;

    return (
      <div className="space-y-4">
        {/* ─── Explicación en lenguaje simple ─── */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <p className="text-sm">
            <span className="font-bold text-base">Paso {pasoActual + 1}:</span>{" "}
            calcular <span className="font-bold text-emerald-600 dark:text-emerald-400">{nombre}</span>
          </p>

          {/* Fórmula con colores */}
          <div className="font-mono text-sm bg-white dark:bg-gray-900 p-2 rounded border">
            {p.tipo === "L" ? (
              <>
                <span className="text-emerald-600 font-bold">{nombre.split(" ")[0]} = </span>
                <span>
                  A[{p.fila + 1}][{p.columna + 1}] − (
                </span>
                {p.terminos.length === 0 ? (
                  <span className="text-gray-400">0</span>
                ) : (
                  p.terminos.map((t, idx) => (
                    <span key={idx}>
                      {idx > 0 && " + "}
                      <span className="text-orange-500 font-semibold">{rd(t.valL)}</span>
                      {"×"}
                      <span className="text-blue-500 font-semibold">{rd(t.valU)}</span>
                    </span>
                  ))
                )}
                <span>)</span>
              </>
            ) : (
              <>
                <span className="text-emerald-600 font-bold">{nombre.split(" ")[0]} = </span>
                <span>
                  (A[{p.fila + 1}][{p.columna + 1}] − (
                </span>
                {p.terminos.length === 0 ? (
                  <span className="text-gray-400">0</span>
                ) : (
                  p.terminos.map((t, idx) => (
                    <span key={idx}>
                      {idx > 0 && " + "}
                      <span className="text-orange-500 font-semibold">{rd(t.valL)}</span>
                      {"×"}
                      <span className="text-blue-500 font-semibold">{rd(t.valU)}</span>
                    </span>
                  ))
                )}
                <span>)) ÷ </span>
                <span className="text-purple-500 font-bold">{rd(p.pivote!)}</span>
              </>
            )}
          </div>

          {/* Resultado */}
          <p className="text-base font-mono">
            = ({rd(p.valorA)} − {rd(p.suma)})
            {p.tipo === "U" && <> ÷ {rd(p.pivote!)}</>}{" "}
            ={" "}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xl">
              {rd(p.resultado)}
            </span>
          </p>

          {/* ─── Explicación DETALLADA de dónde sale cada número ─── */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-3 space-y-2 text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              ¿De dónde sale cada número?
            </p>

            {/* Explicar de dónde viene A[i][j] */}
            <p>
              <span className="font-medium">A[{p.fila + 1}][{p.columna + 1}] = {rd(p.valorA)}</span>
              {" "}— Es el valor que está en la fila {p.fila + 1}, columna {p.columna + 1} de la matriz original.
            </p>

            {/* Explicar la suma */}
            {p.terminos.length === 0 ? (
              <p>
                <span className="font-medium">Suma = 0</span>
                {" "}— No hay suma porque es el{" "}
                {p.tipo === "L"
                  ? `primer elemento de la columna ${p.columna + 1} de L (no hay filas arriba con qué multiplicar).`
                  : `primer elemento a la derecha de la diagonal en la fila ${p.fila + 1} de U (k va de 0 a ${p.fila}-1 = vacío).`}
              </p>
            ) : (
              <div>
                <p className="font-medium">Suma = {p.terminos.map((t, idx) => (
                  <span key={idx}>
                    {idx > 0 && " + "}
                    <span className="text-orange-600 font-semibold">{rd(t.valL)}</span>
                    {"×"}
                    <span className="text-blue-600 font-semibold">{rd(t.valU)}</span>
                  </span>
                ))} = {rd(p.suma)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cada par es una celda ya calculada de L (naranja) multiplicada por una de U (azul).
                  Se multiplica la fila {p.tipo === "L" ? p.fila + 1 : p.columna + 1} de L
                  por la columna {p.tipo === "L" ? p.columna + 1 : p.fila + 1} de U.
                </p>
              </div>
            )}

            {/* Explicar el pivote (solo para U) */}
            {p.tipo === "U" && (
              <p>
                <span className="font-medium">Se divide entre L[{p.fila + 1}][{p.fila + 1}] = {rd(p.pivote!)}</span>
                {" "}— Es el pivote de la fila {p.fila + 1}, que ya calculamos antes en la diagonal de L.
                Se divide para que la diagonal de U quede en 1 (definición de Crout).
              </p>
            )}

            {p.tipo === "L" && (
              <p>
                <span className="font-medium">No se divide.</span>
                {" "}— En Crout, los elementos de L guardan el valor completo (la diagonal de L NO es 1).
              </p>
            )}
          </div>
        </div>

        {/* ─── Matrices visuales ─── */}
        <div className="flex flex-wrap gap-6 justify-center items-start">
          {/* Matriz A (referencia, pequeña) */}
          <div className="flex flex-col items-center gap-1 opacity-60">
            <span className="text-xs font-bold text-muted-foreground">A (original)</span>
            <table className="border-collapse">
              <tbody>
                {A.map((fila, i) => (
                  <tr key={i}>
                    {fila.map((val, j) => (
                      <td
                        key={j}
                        className={`w-12 h-8 text-center font-mono text-xs border border-gray-300 dark:border-gray-600 ${
                          i === p.fila && j === p.columna
                            ? "bg-yellow-100 dark:bg-yellow-900/40 font-bold"
                            : "bg-gray-50 dark:bg-gray-800/30"
                        }`}
                      >
                        {rd(val, 2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matriz L parcial */}
          <MatrizVisual
            datos={Lparcial}
            label="L"
            resaltarFilas={[filaActiva]}
            celdaActual={p.tipo === "L" ? { fila: p.fila, columna: p.columna } : undefined}
            mostrarVacios
          />

          {/* Signo × */}
          <div className="flex items-center pt-8">
            <span className="text-2xl font-bold text-muted-foreground">×</span>
          </div>

          {/* Matriz U parcial */}
          <MatrizVisual
            datos={Uparcial}
            label="U"
            resaltarColumnas={[colActiva]}
            celdaActual={p.tipo === "U" ? { fila: p.fila, columna: p.columna } : undefined}
            mostrarVacios
            esU
          />
        </div>

        {/* ─── Leyenda ─── */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-orange-100 dark:bg-orange-900/40 border border-orange-300 inline-block" />
            Fila L (naranja)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-blue-100 dark:bg-blue-800/40 border border-blue-300 inline-block" />
            Columna U (azul)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-800/50 border border-amber-400 inline-block" />
            Se multiplican (naranja×azul)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600 ring-1 ring-emerald-500 inline-block" />
            Resultado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-50 dark:bg-green-900/20 border border-green-200 inline-block" />
            Ya calculado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800/30 inline-block text-gray-300">···</span>
            Falta calcular
          </span>
        </div>
      </div>
    );
  };

  // ─── Renderizar paso Y (sustitución adelante) ───
  const renderPasoY = () => {
    const p = pasosY[pasoActual - pasosLU.length];
    return (
      <div className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-3 space-y-3">
          <p className="text-sm">
            <span className="font-bold text-base">Paso {pasoActual + 1}:</span>{" "}
            calcular{" "}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              y<sub>{p.fila + 1}</sub>
            </span>{" "}
            — sustitución hacia adelante (de arriba hacia abajo)
          </p>

          <div className="font-mono text-sm bg-white dark:bg-gray-900 p-2 rounded border">
            y<sub>{p.fila + 1}</sub> = (b<sub>{p.fila + 1}</sub> − (
            {p.terminos.length === 0 ? (
              <span className="text-gray-400">0</span>
            ) : (
              p.terminos.map((t, idx) => (
                <span key={idx}>
                  {idx > 0 && " + "}
                  <span className="text-orange-500 font-semibold">{rd(t.valL)}</span>
                  {"×"}
                  <span className="text-green-500 font-semibold">{rd(t.valY)}</span>
                </span>
              ))
            )}
            )) ÷ <span className="text-purple-500 font-bold">{rd(p.pivote)}</span>
          </div>

          <p className="text-base font-mono">
            = ({rd(p.valorB)} − {rd(p.suma)}) ÷ {rd(p.pivote)} ={" "}
            <span className="text-emerald-600 font-bold text-xl">{rd(p.resultado)}</span>
          </p>

          {/* Explicación detallada */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-3 space-y-2 text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300">¿De dónde sale cada número?</p>
            <p><span className="font-medium">b[{p.fila + 1}] = {rd(p.valorB)}</span> — valor del vector b en la fila {p.fila + 1}.</p>
            {p.terminos.length === 0 ? (
              <p><span className="font-medium">Suma = 0</span> — primer y, no hay valores previos de y para restar.</p>
            ) : (
              <div>
                <p className="font-medium">
                  Suma = {p.terminos.map((t, idx) => (
                    <span key={idx}>{idx > 0 && " + "}<span className="text-orange-600 font-semibold">{rd(t.valL)}</span>×<span className="text-green-600 font-semibold">{rd(t.valY)}</span></span>
                  ))} = {rd(p.suma)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Se multiplica la fila {p.fila + 1} de L (naranja) por los valores de y ya conocidos (verde).
                </p>
              </div>
            )}
            <p><span className="font-medium">Se divide entre L[{p.fila + 1}][{p.fila + 1}] = {rd(p.pivote)}</span> — pivote de la diagonal de L.</p>
          </div>
        </div>

        {/* ─── Matrices visuales: L y vector b ─── */}
        <div className="flex flex-wrap gap-6 justify-center items-start">
          <MatrizVisual
            datos={L}
            label="L"
            resaltarFilas={[p.fila]}
            mostrarVacios={false}
          />
          <div className="flex flex-col items-center gap-1 pt-8">
            <span className="text-2xl font-bold text-muted-foreground">×</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-muted-foreground">y</span>
            <div className="flex flex-col">
              {y.map((v, i) => (
                <div
                  key={i}
                  className={`w-16 h-10 flex items-center justify-center font-mono text-sm border transition-colors ${
                    i === p.fila
                      ? "bg-emerald-400 dark:bg-emerald-600 font-bold ring-2 ring-emerald-500"
                      : i < p.fila
                        ? "bg-green-50 dark:bg-green-900/20 border-gray-300"
                        : "bg-gray-100 dark:bg-gray-800/30 text-gray-300"
                  }`}
                >
                  {i < p.fila ? rd(v) : i === p.fila ? rd(p.resultado) : "···"}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 pt-8">
            <span className="text-2xl font-bold text-muted-foreground">=</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-muted-foreground">b</span>
            <div className="flex flex-col">
              {b.map((v, i) => (
                <div
                  key={i}
                  className={`w-16 h-10 flex items-center justify-center font-mono text-sm border ${
                    i === p.fila ? "bg-yellow-100 dark:bg-yellow-900/40 font-bold border-yellow-400" : "bg-gray-50 dark:bg-gray-800/30 border-gray-300"
                  }`}
                >
                  {v}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-100 dark:bg-orange-900/40 border border-orange-300 inline-block" /> Fila L activa</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600 ring-1 ring-emerald-500 inline-block" /> Calculando ahora</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-50 dark:bg-green-900/20 border border-green-200 inline-block" /> Ya calculado</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800/30 inline-block text-gray-300">···</span> Falta calcular</span>
        </div>

        {/* ─── Contexto: matrices ya calculadas ─── */}
        <details className="text-xs" open>
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium py-1">
            📋 Ver todas las matrices (L, U, x, y)
          </summary>
          <div className="flex flex-wrap gap-3 justify-center items-start mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 opacity-80">
            <MatrizVisual datos={L} label="L (paso 1)" mostrarVacios={false} />
            <MatrizVisual datos={U} label="U (paso 1)" esU mostrarVacios={false} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-muted-foreground">y</span>
              <div className="flex flex-col">
                {y.map((v, i) => (
                  <div key={i} className="w-14 h-9 flex items-center justify-center font-mono text-xs border border-gray-300 bg-gray-50 dark:bg-gray-800/30">
                    {rd(v)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-muted-foreground">x</span>
              <div className="flex flex-col">
                {x.map((v, i) => (
                  <div key={i} className={`w-14 h-9 flex items-center justify-center font-mono text-xs border ${x[i] !== 0 ? 'bg-green-50 dark:bg-green-900/20 border-gray-300' : 'bg-gray-100 dark:bg-gray-800/30 text-gray-300'}`}>
                    {x[i] !== 0 ? rd(v) : '···'}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-muted-foreground">b</span>
              <div className="flex flex-col">
                {b.map((v, i) => (
                  <div key={i} className="w-14 h-9 flex items-center justify-center font-mono text-xs border border-gray-300 bg-gray-50 dark:bg-gray-800/30">
                    {v}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>
      </div>
    );
  };

  // ─── Renderizar paso X (sustitución atrás) ───
  const renderPasoX = () => {
    const p = pasosX[pasoActual - pasosLU.length - pasosY.length];
    return (
      <div className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-3 space-y-3">
          <p className="text-sm">
            <span className="font-bold text-base">Paso {pasoActual + 1}:</span>{" "}
            calcular{" "}
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              x<sub>{p.fila + 1}</sub>
            </span>{" "}
            — sustitución hacia atrás (de abajo hacia arriba)
          </p>

          <div className="font-mono text-sm bg-white dark:bg-gray-900 p-2 rounded border">
            x<sub>{p.fila + 1}</sub> = y<sub>{p.fila + 1}</sub> − (
            {p.terminos.length === 0 ? (
              <span className="text-gray-400">0</span>
            ) : (
              p.terminos.map((t, idx) => (
                <span key={idx}>
                  {idx > 0 && " + "}
                  <span className="text-blue-500 font-semibold">{rd(t.valU)}</span>
                  {"×"}
                  <span className="text-green-500 font-semibold">{rd(t.valX)}</span>
                </span>
              ))
            )}
            )
            <span className="text-xs text-muted-foreground ml-2">(U tiene 1 en diagonal, no se divide)</span>
          </div>

          <p className="text-base font-mono">
            = {rd(p.valorY)} − {rd(p.suma)} ={" "}
            <span className="text-emerald-600 font-bold text-xl">{rd(p.resultado)}</span>
          </p>

          {/* Explicación detallada */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-3 space-y-2 text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300">¿De dónde sale cada número?</p>
            <p><span className="font-medium">y[{p.fila + 1}] = {rd(p.valorY)}</span> — valor del vector y en la fila {p.fila + 1} (calculado en el paso 2).</p>
            {p.terminos.length === 0 ? (
              <p><span className="font-medium">Suma = 0</span> — última x (x<sub>{n}</sub>), no hay columnas a la derecha en U.</p>
            ) : (
              <div className="space-y-1">
                <p className="font-medium">
                  Suma = {p.terminos.map((t, idx) => (
                    <span key={idx}>{idx > 0 && " + "}<span className="text-blue-600 font-semibold">{rd(t.valU)}</span>×<span className="text-green-600 font-semibold">{rd(t.valX)}</span></span>
                  ))} = {rd(p.suma)}
                </p>
                {/* Explicar de dónde salen los x usados */}
                <div className="space-y-0.5 mt-1">
                  <p className="text-xs text-muted-foreground font-medium">De dónde salen los valores de x usados:</p>
                  {p.terminos.map((t, idx) => {
                    // Encontrar qué x es (columna correspondiente)
                    const colX = p.fila + 1 + idx + 1; // U[fila][col], x[col]
                    return (
                      <p key={idx} className="text-xs ml-2">
                        → <span className="text-green-600 font-semibold">x<sub>{colX}</sub> = {rd(t.valX)}</span> — calculado en el paso {pasosLU.length + pasosY.length + (n - colX)} (sustitución hacia atrás, desde abajo)
                      </p>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Se multiplica la fila {p.fila + 1} de U (azul) por los valores de x ya conocidos (verde).
                </p>
              </div>
            )}
            <p><span className="font-medium">No se divide.</span> — En U la diagonal es 1, así que x = y − suma directamente.</p>
          </div>
        </div>

        {/* ─── Matrices visuales: U y vector y ─── */}
        <div className="flex flex-wrap gap-6 justify-center items-start">
          <MatrizVisual
            datos={U}
            label="U"
            resaltarFilas={[p.fila]}
            mostrarVacios={false}
            esU
          />
          <div className="flex flex-col items-center gap-1 pt-8">
            <span className="text-2xl font-bold text-muted-foreground">×</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-muted-foreground">x</span>
            <div className="flex flex-col">
              {x.map((v, i) => {
                // Sustitución hacia atrás: de abajo hacia arriba
                // i > p.fila → ya calculado (verde claro)
                // i === p.fila → calculando ahora (verde fuerte)
                // i < p.fila → falta calcular (gris ···)
                const yaCalculado = i > p.fila;
                const ahora = i === p.fila;
                const falta = i < p.fila;
                return (
                  <div
                    key={i}
                    className={`w-16 h-10 flex items-center justify-center font-mono text-sm border transition-colors ${
                      ahora
                        ? "bg-emerald-400 dark:bg-emerald-600 font-bold ring-2 ring-emerald-500"
                        : yaCalculado
                          ? "bg-green-50 dark:bg-green-900/20 border-gray-300"
                          : "bg-gray-100 dark:bg-gray-800/30 text-gray-300"
                    }`}
                  >
                    {ahora
                      ? rd(p.resultado)
                      : yaCalculado
                        ? rd(v)
                        : "···"}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 pt-8">
            <span className="text-2xl font-bold text-muted-foreground">=</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-muted-foreground">y</span>
            <div className="flex flex-col">
              {y.map((v, i) => (
                <div
                  key={i}
                  className={`w-16 h-10 flex items-center justify-center font-mono text-sm border ${
                    i === p.fila ? "bg-yellow-100 dark:bg-yellow-900/40 font-bold border-yellow-400" : "bg-gray-50 dark:bg-gray-800/30 border-gray-300"
                  }`}
                >
                  {rd(v)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-100 dark:bg-orange-900/40 border border-orange-300 inline-block" /> Fila U activa</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600 ring-1 ring-emerald-500 inline-block" /> Calculando ahora</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-50 dark:bg-green-900/20 border border-green-200 inline-block" /> Ya calculado</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800/30 inline-block text-gray-300">···</span> Falta calcular</span>
        </div>

        {/* ─── Contexto: matrices ya calculadas ─── */}
        <details className="text-xs" open>
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium py-1">
            📋 Ver todas las matrices (L, U, x, y)
          </summary>
          <div className="flex flex-wrap gap-3 justify-center items-start mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 opacity-80">
            <MatrizVisual datos={L} label="L (paso 1)" mostrarVacios={false} />
            <MatrizVisual datos={U} label="U (paso 1)" esU mostrarVacios={false} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-muted-foreground">y</span>
              <div className="flex flex-col">
                {y.map((v, i) => (
                  <div key={i} className="w-14 h-9 flex items-center justify-center font-mono text-xs border border-gray-300 bg-gray-50 dark:bg-gray-800/30">
                    {rd(v)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-muted-foreground">x</span>
              <div className="flex flex-col">
                {x.map((v, i) => (
                  <div key={i} className={`w-14 h-9 flex items-center justify-center font-mono text-xs border ${x[i] !== 0 ? 'bg-green-50 dark:bg-green-900/20 border-gray-300' : 'bg-gray-100 dark:bg-gray-800/30 text-gray-300'}`}>
                    {x[i] !== 0 ? rd(v) : '···'}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-muted-foreground">b</span>
              <div className="flex flex-col">
                {b.map((v, i) => (
                  <div key={i} className="w-14 h-9 flex items-center justify-center font-mono text-xs border border-gray-300 bg-gray-50 dark:bg-gray-800/30">
                    {v}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </details>
      </div>
    );
  };

  // ─── UI principal ───
  return (
    <div className="space-y-4 w-full">
      {/* ─── Último paso: resultado final con matrices completas ─── */}
      {pasoActual === totalPasos - 1 && (
        <Card className="border-green-300 dark:border-green-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-700 dark:text-green-400">
              ✓ Resultado final
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 justify-center items-start">
              <MatrizVisual datos={L} label="L (triangular inferior)" />
              <span className="text-2xl font-bold text-muted-foreground self-center">×</span>
              <MatrizVisual datos={U} label="U (triangular superior)" esU />
              <span className="text-2xl font-bold text-muted-foreground self-center">→</span>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-green-600">solución x</span>
                <div className="flex flex-col border-2 border-green-400 rounded bg-green-50 dark:bg-green-900/20">
                  {x.map((v, i) => (
                    <div
                      key={i}
                      className="w-20 h-10 flex items-center justify-center font-mono font-bold text-base"
                    >
                      x<sub>{i + 1}</sub> = {rd(v)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Visor paso a paso ─── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {enLU && "Factorización A = L × U"}
              {enY && "Sustitución hacia adelante L × y = b"}
              {enX && "Sustitución hacia atrás U × x = y"}
            </CardTitle>
            <Badge variant="secondary" className="font-mono">
              {pasoActual + 1} / {totalPasos}
            </Badge>
          </div>
          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((pasoActual + 1) / totalPasos) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {enLU && renderPasoLU()}
          {enY && renderPasoY()}
          {enX && renderPasoX()}

          {/* Controles */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasoActual(0)}
              disabled={pasoActual === 0}
            >
              ⏮
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasoActual(pasoActual - 1)}
              disabled={pasoActual === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm font-mono min-w-[60px] text-center tabular-nums">
              {pasoActual + 1} / {totalPasos}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasoActual(pasoActual + 1)}
              disabled={pasoActual === totalPasos - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasoActual(totalPasos - 1)}
              disabled={pasoActual === totalPasos - 1}
            >
              ⏭
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
