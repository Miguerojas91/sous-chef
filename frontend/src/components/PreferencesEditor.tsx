/**
 * PreferencesEditor.tsx
 *
 * Editor unificado de preferencias del usuario:
 *  - Chips de los 8 filtros (sin-horno, 3-ingredientes, económico, para-niños,
 *    diabético, keto, vegetariano, sin gluten).
 *  - Tag input de alergias (NUNCA usar — riesgo de salud).
 *  - Tag input de disgustos (evitar — preferencia).
 *
 * Dos modos:
 *  - `mode="inline"`  — embed en un formulario (registro).
 *  - `mode="modal"`   — overlay full-screen con botones Cerrar/Guardar
 *                       (se llama desde un botón "Editar preferencias").
 *
 * Patrón "controlled": los valores se reciben por props y los cambios se
 * notifican al padre. El padre decide cuándo persistir (en registro: al
 * crear cuenta; en modal: al pulsar "Guardar").
 */
import React, { useState } from 'react';
import { RECIPE_FILTERS, getFilter } from '../data/recipeFilters';
import { AlertTriangle, ChevronRight, X, Ban } from 'lucide-react';

interface PreferencesEditorProps {
  mode?: 'inline' | 'modal';
  initialFilterIds: string[];
  initialAllergies: string[];
  initialDislikes: string[];
  onChange?: (next: {
    filterIds: string[];
    allergies: string[];
    dislikes: string[];
  }) => void;
  /** Solo en modo modal: callback cuando el usuario cierra/guarda. */
  onClose?: () => void;
  onSave?: (next: {
    filterIds: string[];
    allergies: string[];
    dislikes: string[];
  }) => void;
}

export const PreferencesEditor: React.FC<PreferencesEditorProps> = ({
  mode = 'inline',
  initialFilterIds,
  initialAllergies,
  initialDislikes,
  onChange,
  onClose,
  onSave,
}) => {
  const [filterIds, setFilterIds] = useState<string[]>(initialFilterIds);
  const [allergies, setAllergies] = useState<string[]>(initialAllergies);
  const [dislikes, setDislikes] = useState<string[]>(initialDislikes);

  const notify = (next: Partial<{ filterIds: string[]; allergies: string[]; dislikes: string[] }>) => {
    const merged = {
      filterIds: next.filterIds ?? filterIds,
      allergies: next.allergies ?? allergies,
      dislikes: next.dislikes ?? dislikes,
    };
    onChange?.(merged);
  };

  const toggleFilter = (id: string) => {
    const next = filterIds.includes(id) ? filterIds.filter(x => x !== id) : [...filterIds, id];
    setFilterIds(next);
    notify({ filterIds: next });
  };

  const removeTag = (kind: 'allergies' | 'dislikes', tag: string) => {
    if (kind === 'allergies') {
      const next = allergies.filter(t => t !== tag);
      setAllergies(next);
      notify({ allergies: next });
    } else {
      const next = dislikes.filter(t => t !== tag);
      setDislikes(next);
      notify({ dislikes: next });
    }
  };

  const addTag = (kind: 'allergies' | 'dislikes', tag: string) => {
    const t = tag.trim();
    if (!t) return;
    if (kind === 'allergies' && !allergies.includes(t)) {
      const next = [...allergies, t];
      setAllergies(next);
      notify({ allergies: next });
    } else if (kind === 'dislikes' && !dislikes.includes(t)) {
      const next = [...dislikes, t];
      setDislikes(next);
      notify({ dislikes: next });
    }
  };

  const body = (
    <div className="space-y-5">
      {/* Filtros (chips) */}
      <section>
        <h3 className="text-sm font-bold text-neutral-800 mb-2">
          Filtros automáticos
        </h3>
        <p className="text-xs text-neutral-500 mb-3 leading-snug">
          Sous respetará lo que marques aquí en TODAS tus sesiones, sin tener que
          repetirlo cada vez.
        </p>
        <div className="flex flex-wrap gap-2">
          {RECIPE_FILTERS.map(f => {
            const active = filterIds.includes(f.id);
            const isDiet = f.kind === 'dietary';
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleFilter(f.id)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  active
                    ? isDiet
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200'
                      : 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-orange-300'
                }`}
              >
                <span>{f.emoji}</span>
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Alergias */}
      <TagInput
        kind="allergies"
        label="Alergias"
        sublabel="Sous NUNCA las usará — alto riesgo"
        icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
        emptyMsg="Sin alergias registradas."
        chipClass="bg-red-100 text-red-700"
        tags={allergies}
        onAdd={(t) => addTag('allergies', t)}
        onRemove={(t) => removeTag('allergies', t)}
      />

      {/* Disgustos */}
      <TagInput
        kind="dislikes"
        label="No me gustan"
        sublabel="Sous los evitará salvo que los pidas"
        icon={<Ban className="w-4 h-4 text-orange-500" />}
        emptyMsg="Sin disgustos registrados."
        chipClass="bg-orange-100 text-orange-700"
        tags={dislikes}
        onAdd={(t) => addTag('dislikes', t)}
        onRemove={(t) => removeTag('dislikes', t)}
      />
    </div>
  );

  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 z-[300] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
          <header className="p-5 border-b border-neutral-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-lg font-black text-neutral-900">Mis preferencias</h2>
              <p className="text-xs text-neutral-500">Se aplican a todas tus sesiones de cocina.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <X size={18} className="text-neutral-500" />
            </button>
          </header>

          <div className="overflow-y-auto p-5 flex-1">{body}</div>

          <footer className="p-4 border-t border-neutral-100 flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave?.({ filterIds, allergies, dislikes })}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors"
            >
              Guardar <ChevronRight size={16} />
            </button>
          </footer>
        </div>
      </div>
    );
  }

  return body;
};


// ── Sub-componente: Tag input ─────────────────────────────────────────────────
const TagInput: React.FC<{
  kind: 'allergies' | 'dislikes';
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  emptyMsg: string;
  chipClass: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}> = ({ label, sublabel, icon, emptyMsg, chipClass, tags, onAdd, onRemove }) => {
  const [draft, setDraft] = useState('');

  const commit = () => {
    if (draft.trim()) {
      onAdd(draft);
      setDraft('');
    }
  };

  return (
    <section>
      <h3 className="text-sm font-bold text-neutral-800 mb-1 flex items-center gap-2">
        {icon}
        {label}
        <span className="font-normal text-xs text-neutral-500">— {sublabel}</span>
      </h3>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder="Escribe y presiona Enter…"
          className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
        />
        <button
          type="button"
          onClick={commit}
          className="px-3 py-2 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
        >
          Agregar
        </button>
      </div>
      {tags.length === 0 ? (
        <p className="text-xs text-neutral-400 italic">{emptyMsg}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span
              key={t}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${chipClass}`}
            >
              {t}
              <button
                type="button"
                onClick={() => onRemove(t)}
                aria-label={`Quitar ${t}`}
                className="hover:opacity-70"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

// ── Helper: resumen corto de preferencias activas para mostrar en banners ────
export function summarizePreferences(filterIds: string[], allergies: string[], dislikes: string[]): string[] {
  const parts: string[] = [];
  for (const id of filterIds) {
    const f = getFilter(id);
    if (f) parts.push(`${f.emoji} ${f.label}`);
  }
  if (allergies.length > 0) parts.push(`⚠️ ${allergies.length} alergia${allergies.length > 1 ? 's' : ''}`);
  if (dislikes.length > 0) parts.push(`🙅 ${dislikes.length} no me gusta${dislikes.length > 1 ? 'n' : ''}`);
  return parts;
}
