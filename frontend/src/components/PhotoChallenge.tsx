/**
 * Zona para subir la foto de un reto y vista previa con el estado de la
 * evaluación. El estado vive en `usePhotoEvaluation`, que la pantalla crea para
 * poder mostrar sus propios resultados y guardar progreso.
 *
 * `variant` elige el aspecto: el de un nivel normal o el de un reto de jefe.
 */

import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import type { PhotoEvaluation } from '../hooks/usePhotoEvaluation';
import { WORLD_THEME } from '../data/worlds';
import type { WorldId } from '../data/worlds';

interface PhotoChallengeProps {
  photo: PhotoEvaluation;
  variant: 'level' | 'boss';
  worldId: WorldId;
  uploadLabel: string;
  imageAlt: string;
  reviewingText: string;
}

export const PhotoChallenge = ({ photo, variant, worldId, uploadLabel, imageAlt, reviewingText }: PhotoChallengeProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { image, status } = photo;
  const { level, boss } = WORLD_THEME[worldId];
  const isBoss = variant === 'boss';

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) photo.submit(file);
  };

  const dropzone = isBoss
    ? boss.upload
    : dragOver ? `${level.accentBorder} ${level.accentBg}` : 'border-neutral-200';

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
          className={`w-full rounded-xl border-2 border-dashed transition-all text-center py-10 px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${dropzone}`}
        >
          {isBoss ? (
            <span className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center mx-auto mb-3 shadow-sm" aria-hidden>
              <Upload size={22} className="text-neutral-500" />
            </span>
          ) : (
            <span className={`w-14 h-14 rounded-2xl ${level.accentBg} border ${level.accentBorder} flex items-center justify-center mx-auto mb-3`} aria-hidden>
              <Upload size={24} className={level.accentText} />
            </span>
          )}
          <span className={`block font-bold text-neutral-700 ${isBoss ? 'text-sm' : ''}`}>{uploadLabel}</span>
          <span className={`block text-neutral-400 mt-1 ${isBoss ? 'text-xs' : 'text-sm'}`}>JPG o PNG, hasta 10 MB</span>
        </button>
      ) : (
        <div className="relative rounded-xl overflow-hidden">
          <img src={image} alt={imageAlt} className={`w-full object-cover ${isBoss ? 'max-h-64' : 'max-h-72'}`} />
          {status === 'reviewing' && (
            <div role="status" className={`absolute inset-0 ${isBoss ? 'bg-black/55' : 'bg-black/50'} flex flex-col items-center justify-center gap-3 text-white`}>
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin motion-reduce:animate-none" aria-hidden />
              <p className="font-bold text-sm">{reviewingText}</p>
            </div>
          )}
          {status === 'approved' && (isBoss ? (
            <div className={`absolute inset-0 ${boss.reviewOverlay} flex items-center justify-center`} aria-hidden>
              <div className={`${boss.doneBg} rounded-full p-3 shadow-2xl`}>
                <CheckCircle size={32} className="text-white" />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-emerald-500/25 flex items-center justify-center" aria-hidden>
              <div className="bg-emerald-500 rounded-full p-4 shadow-2xl shadow-emerald-900/30">
                <CheckCircle size={40} className="text-white" />
              </div>
            </div>
          ))}
          {status === 'rejected' && !isBoss && (
            <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center" aria-hidden>
              <div className="bg-red-600 rounded-full p-4 shadow-2xl shadow-red-900/30">
                <AlertTriangle size={40} className="text-white" />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
