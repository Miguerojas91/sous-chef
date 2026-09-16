/**
 * Editor de preferencias: los filtros de receta, alergias (Sous nunca las usa,
 * es un tema de salud) y lo que no le gusta al usuario (Sous lo evita).
 *
 * - `inline`: dentro del registro. Avisa cada cambio con `onChange`.
 * - `modal`: diálogo con Cancelar/Guardar. Solo persiste al guardar (`onSave`).
 */
import React, { useId, useState } from 'react';
import { RECIPE_FILTERS } from '../data/recipeFilters';
import { X } from 'lucide-react';
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
    <div className="space-y-6">
      <section>
        <h3 className="text-base font-bold text-neutral-900">Tipo de recetas</h3>
        <p className="text-sm text-neutral-600 mt-0.5 mb-3 leading-snug">
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
                className={`min-h-11 px-4 rounded-full text-sm font-semibold transition-colors border ${
                  active
                    ? isDiet
                      ? 'bg-world-1 text-white border-world-1'
                      : 'bg-brand-700 text-white border-brand-700'
                    : 'bg-white text-neutral-800 border-neutral-300 hover:border-neutral-500'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      <TagInput
        label="Alergias"
        sublabel="Sous nunca las usará."
        emptyMsg="No has agregado alergias."
        chipClass="bg-red-50 text-red-800 border-red-200"
        tags={allergies}
        onAdd={(t) => addTag('allergies', t)}
        onRemove={(t) => removeTag('allergies', t)}
      />

      <TagInput
        label="No me gusta"
        sublabel="Sous lo evita, salvo que lo pidas."
        emptyMsg="No has agregado nada."
        chipClass="bg-neutral-100 text-neutral-800 border-neutral-300"
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
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-11 rounded-control text-sm font-semibold text-neutral-800 border border-neutral-300 hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave?.({ filterIds, allergies, dislikes })}
              className="flex-1 min-h-11 rounded-control text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors"
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="mt-5">{body}</div>
      </Dialog>
    );
  }

  return body;
};

const TagInput: React.FC<{
  label: string;
  sublabel: string;
  emptyMsg: string;
  chipClass: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}> = ({ label, sublabel, emptyMsg, chipClass, tags, onAdd, onRemove }) => {
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
      <label htmlFor={inputId} className="block text-base font-bold text-neutral-900">{label}</label>
      <p id={hintId} className="text-sm text-neutral-600 mt-0.5 mb-2">{sublabel}</p>
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
          className="flex-1 min-w-0 min-h-11 px-3 text-base sm:text-sm border border-neutral-300 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
        />
        <button
          type="button"
          onClick={commit}
          className="min-h-11 px-4 text-sm font-semibold text-brand-800 bg-brand-50 hover:bg-brand-100 rounded-control transition-colors"
        >
          Agregar
        </button>
      </div>
      {tags.length === 0 ? (
        <p className="text-sm text-neutral-600">{emptyMsg}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map(t => (
            <li
              key={t}
              className={`inline-flex items-center pl-3 rounded-full border text-sm font-semibold ${chipClass}`}
            >
              {t}
              <button
                type="button"
                onClick={() => onRemove(t)}
                aria-label={`Quitar ${t}`}
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/5"
              >
                <X size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
