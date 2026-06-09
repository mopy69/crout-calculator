"use client";

import { useState, useCallback } from "react";
import { crout, CroutResult } from "@/lib/crout";
import MatrixInput from "@/components/MatrixInput";
import StepByStep from "@/components/StepByStep";
import { Separator } from "@/components/ui/separator";

/**
 * Página principal de la Calculadora de Descomposición de Crout.
 *
 * Flujo:
 * 1. Usuario ingresa matriz A y vector b en MatrixInput
 * 2. Al presionar "Resolver", se ejecuta el algoritmo de Crout
 * 3. Se muestran los resultados en StepByStep (L, U, y, x + pasos)
 */
export default function Home() {
  // Resultado del algoritmo (null si no se ha calculado)
  const [resultado, setResultado] = useState<CroutResult | null>(null);

  // Error capturado del algoritmo (ej: pivote cero)
  const [errorAlgoritmo, setErrorAlgoritmo] = useState<string>("");

  /**
   * Callback que recibe A y b desde MatrixInput,
   * ejecuta el algoritmo y guarda el resultado.
   */
  const handleResolver = useCallback((A: number[][], b: number[]) => {
    try {
      const res = crout(A, b);
      setResultado(res);
      setErrorAlgoritmo("");
    } catch (err: unknown) {
      setErrorAlgoritmo(
        err instanceof Error ? err.message : "Error desconocido en el algoritmo."
      );
      setResultado(null);
    }
  }, []);

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* --- Encabezado --- */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Calculadora de Descomposición de Crout
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          Método de factorización LU que descompone A = L·U, donde L es
          triangular inferior y U es triangular superior unitaria (diagonal=1).
          Resuelve sistemas de ecuaciones lineales Ax = b en 3 pasos.
        </p>
      </div>

      <Separator />

      {/* --- Entrada de matriz --- */}
      <MatrixInput onResolver={handleResolver} errorExterno={errorAlgoritmo} />

      {/* --- Resultados paso a paso --- */}
      {resultado && (
        <>
          <Separator />
          <StepByStep resultado={resultado} />
        </>
      )}

      {/* --- Footer con créditos --- */}
      <footer className="text-center text-xs text-muted-foreground pt-8 pb-4">
        Descomposición de Crout — Prescott Durand Crout — Métodos Numéricos
      </footer>
    </main>
  );
}
