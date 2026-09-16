/**
 * Zona para subir la foto de un reto y vista previa con el estado de la
 * evaluación. El estado vive en `usePhotoEvaluation`, que la pantalla crea para
 * poder mostrar sus propios resultados y guardar progreso.
 */

import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import type { PhotoEvaluation } from '../hooks/usePhotoEvaluation';
import type { WorldClasses } from '../data/worlds';

interface PhotoChallengeProps {
  photo: PhotoEvaluation;
  w: WorldClasses;
  uploadLabel: string;
  imageAlt: string;
  reviewingText: string;
}

export const PhotoChallenge = ({ photo, w, uploadLabel, imageAlt, reviewingText }: PhotoChallengeProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { image, status } = photo;

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) photo.submit(file);
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) photo.submit(f); }}
      />

      {!image ? (
        <button
          type="button"
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`w-full rounded-card border-2 border-dashed transition-colors text-center py-8 px-4 focus-visible:ring-2 focus-visible:ring-brand-700 ${
            dragOver ? `${w.border} ${w.soft}` : 'border-neutral-300 bg-white hover:bg-neutral-50'
          }`}
        >
          <Upload size={28} className={`${w.text} mx-auto mb-2`} aria-hidden />
          <span className="block font-semibold text-neutral-900">{uploadLabel}</span>
          <span className="block text-sm text-neutral-600 mt-1">JPG o PNG, hasta 10 MB</span>
        </button>
      ) : (
        <div className="relative rounded-card overflow-hidden">
          <img src={image} alt={imageAlt} className="w-full max-h-72 object-cover" />
          {status === 'reviewing' && (
            <div role="status" className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 text-white">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin motion-reduce:animate-none" aria-hidden />
              <p className="font-semibold text-sm">{reviewingText}</p>
            </div>
          )}
          {status === 'approved' && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center" aria-hidden>
              <div className="bg-emerald-700 rounded-full p-4">
                <CheckCircle size={40} className="text-white" />
              </div>
            </div>
          )}
          {status === 'rejected' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center" aria-hidden>
              <div className="bg-red-700 rounded-full p-4">
                <AlertTriangle size={40} className="text-white" />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
