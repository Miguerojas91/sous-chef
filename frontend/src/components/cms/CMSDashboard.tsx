/** Panel del editor de contenido, solo para `is_admin`. Hoy no tiene ruta en App.tsx. */

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Plus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEditor } from '../../context/EditorContext';

interface PageItem {
    id: number;
    slug: string;
    title: string;
}

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2';

export const CMSDashboard: React.FC = () => {
    const { isAdmin, isEditMode, toggleEditMode } = useEditor();
    const navigate = useNavigate();
    const [pages, setPages] = useState<PageItem[]>([]);

    useEffect(() => {
        // Lista fija mientras no exista el endpoint /api/v1/cms/pages.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setPages([
            { id: 1, slug: 'cms-test', title: 'Página de prueba del CMS' },
            { id: 2, slug: 'juliana-level', title: 'Nivel 1: Juliana (pendiente de migrar)' },
        ]);

        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (!isEditMode) toggleEditMode();
    }, []);

    if (!isAdmin) {
        return (
            <div role="alert" className="flex flex-col items-center justify-center min-h-dvh p-4 md:p-6 text-center bg-neutral-50">
                <ShieldAlert className="w-12 h-12 text-danger mb-4" aria-hidden />
                <h1 className="text-xl md:text-2xl font-bold text-neutral-900">Acceso denegado</h1>
                <p className="text-neutral-600 mt-2">Solo los administradores pueden editar contenido.</p>
                <button type="button" onClick={() => navigate('/')} className={`mt-6 min-h-11 px-4 rounded-control text-brand-700 hover:text-brand-800 font-bold ${FOCUS_RING}`}>Volver al inicio</button>
            </div>
        );
    }

    return (
        <div className="w-full min-h-dvh bg-neutral-50 text-neutral-900 p-4 md:p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">

                <header className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-neutral-200 pb-6">
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-bold text-neutral-900">Editor de contenido</h1>
                        <p className="text-neutral-600 mt-1">Páginas que puedes editar en pantalla.</p>
                    </div>
                    <button type="button" className={`min-h-11 flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold px-4 rounded-control transition-colors ${FOCUS_RING}`}>
                        <Plus className="w-5 h-5" aria-hidden />
                        Crear página
                    </button>
                </header>

                <ul className="bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100">
                    {pages.map(page => (
                        <li key={page.id}>
                            <button
                                type="button"
                                onClick={() => navigate(`/${page.slug}`)}
                                className={`w-full min-h-14 px-4 py-2 flex items-center justify-between gap-3 text-left hover:bg-neutral-50 transition-colors rounded-card ${FOCUS_RING}`}
                            >
                                <span className="min-w-0">
                                    <span className="block font-semibold text-neutral-900 [overflow-wrap:anywhere]">{page.title}</span>
                                    <span className="block text-sm text-neutral-600">/{page.slug}</span>
                                </span>
                                <ChevronRight className="w-5 h-5 shrink-0 text-neutral-500" aria-hidden />
                            </button>
                        </li>
                    ))}
                </ul>

            </div>
        </div>
    );
};
