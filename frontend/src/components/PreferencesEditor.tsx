/**
 * Editor de preferencias: los filtros de receta, alergias (Sous nunca las usa,
 * es un tema de salud) y lo que no le gusta al usuario (Sous lo evita).
 *
 * - `inline`: dentro del registro. Avisa cada cambio con `onChange`.
 * - `modal`: diálogo con Cancelar/Guardar. Solo persiste al guardar (`onSave`).
 */
import React, { useId, useState } from 'react';
import { RECIPE_FILTERS } from '../data/recipeFilters';
import { AlertTriangle, Ban, ChevronRight, X } from 'lucide-react';
import { Dialog } from './ui/Dialog';

type Prefs = { filterIds: string[]; allergies: string[]; dislikes: string[] };

interface PreferencesEditorProps {
  mode?: 'inline' | 'modal';
  initialFilterIds: string[];
  initialAllergies: string[];
  initialDislikes: string[];
  onChange?: (next: Prefs) => void;
  onClose?: () => void;
  onSave?: (next: Prefs) => void;
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

  const notify = (next: Partial<Prefs>) => {
    onChange?.({
      filterIds: next.filterIds ?? filterIds,
      allergies: next.allergies ?? allergies,
      dislikes: next.dislikes ?? dislikes,
    });
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
      <section>
        <h3 className="text-sm font-bold text-neutral-800 mb-2">Tipo de recetas</h3>
        <p className="text-xs text-neutral-500 mb-3 leading-snug">
          Sous las tiene en cuenta en cada sesión. No tienes que repetirlas.
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
                className={`min-h-11 flex items-center gap-1.5 px-3 rounded-full text-xs font-bold transition-all border ${
                  active
                    ? isDiet
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200'
                      : 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-orange-300'
                }`}
              >
                <span aria-hidden>{f.emoji}</span>
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      <TagInput
        label="Alergias"
        sublabel="Sous nunca las usará."
        icon={<AlertTriangle className="w-4 h-4 text-red-500" aria-hidden />}
        emptyMsg="No has agregado alergias."
        chipClass="bg-red-100 text-red-700"
        tags={allergies}
        onAdd={(t) => addTag('allergies', t)}
        onRemove={(t) => removeTag('allergies', t)}
      />

      <TagInput
        label="No me gusta"
        sublabel="Sous lo evita, salvo que lo pidas."
        icon={<Ban className="w-4 h-4 text-orange-500" aria-hidden />}
        emptyMsg="No has agregado nada."
        chipClass="bg-orange-100 text-orange-700"
        tags={dislikes}
        onAdd={(t) => addTag('dislikes', t)}
        onRemove={(t) => removeTag('dislikes', t)}
      />
    </div>
  );

  if (mode === 'modal') {
    return (
      <Dialog
        title="Mis preferencias"
        description="Se aplican a todas tus sesiones de cocina."
        onClose={onClose ?? (() => {})}
        showClose
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-11 py-2.5 px-4 rounded-xl text-sm font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave?.({ filterIds, allergies, dislikes })}
              className="flex-1 min-h-11 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors"
            >
              Guardar <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        }
      >
        {body}
      </Dialog>
    );
  }

  return body;
};

const TagInput: React.FC<{
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
  const inputId = useId();
  const hintId = useId();

  const commit = () => {
    if (draft.trim()) {
      onAdd(draft);
      setDraft('');
    }
  };

  return (
    <section>
      <p className="mb-2 flex flex-wrap items-center gap-x-2">
        <label htmlFor={inputId} className="flex items-center gap-2 text-sm font-bold text-neutral-800">{icon}{label}</label>
        <span id={hintId} className="font-normal text-xs text-neutral-500">— {sublabel}</span>
      </p>
      <div className="flex gap-2 mb-3">
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          aria-describedby={hintId}
          enterKeyHint="done"
          placeholder="Escribe y toca Agregar"
          className="flex-1 min-w-0 min-h-11 px-3 py-2 text-base sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
        />
        <button
          type="button"
          onClick={commit}
          className="min-h-11 px-3 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
        >
          Agregar
        </button>
      </div>
      {tags.length === 0 ? (
        <p className="text-xs text-neutral-400 italic">{emptyMsg}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <li
              key={t}
              className={`inline-flex items-center pl-2.5 rounded-full text-xs font-bold ${chipClass}`}
            >
              {t}
              <button
                type="button"
                onClick={() => onRemove(t)}
                aria-label={`Quitar ${t}`}
                className="w-11 h-11 -my-2 flex items-center justify-center rounded-full hover:opacity-70"
              >
                <X size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
