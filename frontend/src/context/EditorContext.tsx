/**
 * EditorContext.tsx
 *
 * Contexto de React para el Constructor Visual CMS (modo admin).
 * Controla si el usuario actual es administrador y si el modo edición
 * está activo. Solo los usuarios con `is_admin: true` pueden activarlo.
 *
 * Uso:
 *   - Envuelve la app con `<EditorProvider>` en App.tsx.
 *   - Consume con `useEditor()` en cualquier componente hijo.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/** Forma del contexto expuesto a los consumidores. */
interface EditorContextType {
  /** Indica si el usuario logueado tiene rol de administrador. */
  isAdmin: boolean;
  /** Indica si el Constructor Visual está activado en este momento. */
  isEditMode: boolean;
  /** Alterna el modo edición. No hace nada si el usuario no es admin. */
  toggleEditMode: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

/**
 * Lee el flag `is_admin` del usuario almacenado en localStorage.
 * Devuelve `false` ante cualquier error de parsing.
 */
function readIsAdmin(): boolean {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}') as { is_admin?: boolean };
    return user.is_admin === true;
  } catch {
    return false;
  }
}

/**
 * Proveedor que expone el estado del modo editor a toda la aplicación.
 * Se suscribe al evento `userStateChange` para sincronizar el rol admin
 * cuando el usuario inicia o cierra sesión.
 */
export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(readIsAdmin);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const sync = () => {
      const admin = readIsAdmin();
      setIsAdmin(admin);
      // Si el usuario pierde el rol admin, desactivar modo edición inmediatamente
      if (!admin) setIsEditMode(false);
    };
    window.addEventListener('userStateChange', sync);
    return () => window.removeEventListener('userStateChange', sync);
  }, []);

  const toggleEditMode = useCallback(() => {
    if (isAdmin) setIsEditMode(prev => !prev);
  }, [isAdmin]);

  return (
    <EditorContext.Provider value={{ isAdmin, isEditMode, toggleEditMode }}>
      {children}
    </EditorContext.Provider>
  );
};

/**
 * Hook para acceder al contexto del editor CMS.
 * Lanza un error si se usa fuera de `EditorProvider`.
 *
 * @returns Estado y métodos del modo editor.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor debe usarse dentro de <EditorProvider>');
  }
  return context;
};
