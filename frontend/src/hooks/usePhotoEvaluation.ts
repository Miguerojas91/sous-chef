/**
 * Foto de un reto del Modo Aventura: la lee como data URL, la manda a
 * `evaluateImage()` y decide si pasa. Con 1 estrella o más, pasa.
 *
 * Los callbacks son para los efectos de cada pantalla (guardar progreso,
 * analytics); el estado de la foto vive aquí.
 */

import { useCallback, useState } from 'react';
import { evaluateImage } from '../services/gemini';
import type { EvaluationResult } from '../services/gemini';

export type PhotoStatus = 'idle' | 'reviewing' | 'approved' | 'rejected';

export interface EvaluationCriterion {
  stars: string;
  label: string;
}

interface Options {
  /** Qué se evalúa (nombre del nivel o del reto). Llega al evaluador. */
  subject: string;
  criteria: EvaluationCriterion[];
  onSubmit?: () => void;
  onPass?: (result: EvaluationResult) => void;
  onFail?: (result: EvaluationResult) => void;
}

const CONNECTION_ERROR = 'No pudimos conectar con el evaluador. Revisa tu conexión e intenta de nuevo.';

const isPassing = (result: EvaluationResult): boolean => !!result.stars && result.stars >= 1;

export function usePhotoEvaluation({ subject, criteria, onSubmit, onPass, onFail }: Options) {
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<PhotoStatus>('idle');
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const submit = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setImage(imageData);
      setStatus('reviewing');
      onSubmit?.();

      let evaluation: EvaluationResult;
      try {
        evaluation = await evaluateImage(imageData, subject, criteria);
      } catch {
        evaluation = { stars: 0, feedback: CONNECTION_ERROR };
      }

      setResult(evaluation);
      if (isPassing(evaluation)) {
        onPass?.(evaluation);
        setStatus('approved');
      } else {
        // Foto inválida o sin comida: no se guarda progreso.
        onFail?.(evaluation);
        setStatus('rejected');
      }
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setImage(null);
    setStatus('idle');
    setResult(null);
  };

  /** Quita la foto pero conserva el resultado, para mostrar el motivo del rechazo. */
  const clearImage = useCallback(() => setImage(null), []);

  return { image, status, result, submit, reset, clearImage };
}

export type PhotoEvaluation = ReturnType<typeof usePhotoEvaluation>;
