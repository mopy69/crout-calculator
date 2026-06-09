"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MatrixInputProps {
  /** Callback cuando el usuario presiona "Resolver" */
  onResolver: (A: number[][], b: number[]) => void;
  /** Si hay un error externo (ej: pivote cero) */
  errorExterno?: string;
}

/**
 * Componente para ingresar una matriz A y vector b.
 * Permite cambiar el tamaño (n×n) dinámicamente.
 * Los inputs son números; se validan antes de enviar.
 */
export default function MatrixInput({ onResolver, errorExterno }: MatrixInputProps) {
  // Tamaño de la matriz (n×n)
  const [n, setN] = useState(3);

  // Estado: matriz A como string[][] (los inputs son texto)
  const [A, setA] = useState<string[][]>([
    ["4", "-2", "1"],
    ["2", "3", "-1"],
    ["1", "1", "3"],
  ]);

  // Estado: vector b como string[]
  const [b, setB] = useState<string[]>(["5", "7", "9"]);

  // Mensaje de error local (validación)
  const [error, setError] = useState("");

  /**
   * Cuando el usuario cambia el tamaño de la matriz,
   * re-inicializamos A y b con valores por defecto (0s).
   */
  const cambiarTamanio = useCallback(
    (nuevoN: number) => {
      if (nuevoN < 2 || nuevoN > 8) return; // límites razonables
      setN(nuevoN);
      // Inicializar A con ceros
      const nuevaA: string[][] = Array.from({ length: nuevoN }, () =>
        Array(nuevoN).fill("0")
      );
      // Inicializar b con ceros
      const nuevaB: string[] = Array(nuevoN).fill("0");
      setA(nuevaA);
      setB(nuevaB);
      setError(""); // limpiar errores al cambiar tamaño
    },
    []
  );

  /** Actualizar una celda de la matriz A */
  const actualizarA = (fila: number, col: number, valor: string) => {
    const nuevaA = A.map((f, i) =>
      i === fila ? f.map((c, j) => (j === col ? valor : c)) : f
    );
    setA(nuevaA);
    setError(""); // limpiar error al editar
  };

  /** Actualizar una celda del vector b */
  const actualizarB = (idx: number, valor: string) => {
    const nuevaB = [...b];
    nuevaB[idx] = valor;
    setB(nuevaB);
    setError("");
  };

  /** Validar y enviar */
  const resolver = () => {
    // Validar que todas las celdas tengan números válidos
    const A_nums: number[][] = [];
    for (let i = 0; i < n; i++) {
      const fila: number[] = [];
      for (let j = 0; j < n; j++) {
        const val = parseFloat(A[i][j]);
        if (isNaN(val)) {
          setError(`Valor inválido en A[${i + 1}][${j + 1}]: "${A[i][j]}"`);
          return;
        }
        fila.push(val);
      }
      A_nums.push(fila);
    }

    const b_nums: number[] = [];
    for (let i = 0; i < n; i++) {
      const val = parseFloat(b[i]);
      if (isNaN(val)) {
        setError(`Valor inválido en b[${i + 1}]: "${b[i]}"`);
        return;
      }
      b_nums.push(val);
    }

    setError("");
    onResolver(A_nums, b_nums);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">
          Ingresar sistema de ecuaciones (Ax = b)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* --- Selector de tamaño --- */}
        <div className="flex items-center gap-3">
          <Label htmlFor="tamanio" className="text-sm whitespace-nowrap">
            Tamaño (n×n):
          </Label>
          <select
            id="tamanio"
            value={n}
            onChange={(e) => cambiarTamanio(parseInt(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((v) => (
              <option key={v} value={v}>
                {v}×{v}
              </option>
            ))}
          </select>
        </div>

        {/* --- Matriz A y vector b lado a lado --- */}
        <div className="flex gap-6 items-start flex-wrap">
          {/* Matriz A */}
          <div>
            <Label className="text-sm mb-2 block">
              Matriz A ({n}×{n})
            </Label>
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${n}, 72px)` }}
            >
              {A.map((fila, i) =>
                fila.map((celda, j) => (
                  <Input
                    key={`A-${i}-${j}`}
                    type="number"
                    step="any"
                    value={celda}
                    onChange={(e) => actualizarA(i, j, e.target.value)}
                    className="w-[72px] h-9 text-center text-sm font-mono"
                    placeholder="0"
                  />
                ))
              )}
            </div>
          </div>

          {/* Separador visual x */}
          <div className="flex items-center h-full pt-8">
            <span className="text-xl font-bold text-muted-foreground mx-2">
              x
            </span>
          </div>

          {/* Vector x (desconocido, solo decorativo) */}
          <div className="pt-6">
            <div className="flex flex-col gap-1">
              {Array.from({ length: n }).map((_, i) => (
                <div
                  key={`x-${i}`}
                  className="w-[72px] h-9 flex items-center justify-center text-sm font-mono bg-muted rounded"
                >
                  x<sub>{i + 1}</sub>
                </div>
              ))}
            </div>
          </div>

          {/* Separador visual = */}
          <div className="flex items-center h-full pt-8">
            <span className="text-xl font-bold text-muted-foreground mx-2">
              =
            </span>
          </div>

          {/* Vector b */}
          <div>
            <Label className="text-sm mb-2 block">Vector b</Label>
            <div className="flex flex-col gap-1">
              {b.map((val, i) => (
                <Input
                  key={`b-${i}`}
                  type="number"
                  step="any"
                  value={val}
                  onChange={(e) => actualizarB(i, e.target.value)}
                  className="w-[72px] h-9 text-center text-sm font-mono"
                  placeholder="0"
                />
              ))}
            </div>
          </div>
        </div>

        {/* --- Errores --- */}
        {(error || errorExterno) && (
          <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded">
            {error || errorExterno}
          </div>
        )}

        {/* --- Botón resolver --- */}
        <Button onClick={resolver} className="w-full" size="lg">
          Resolver por Crout
        </Button>
      </CardContent>
    </Card>
  );
}
