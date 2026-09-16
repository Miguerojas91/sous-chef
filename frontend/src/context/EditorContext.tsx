/** Modo edición del CMS. Solo usuarios con `is_admin: true` pueden activarlo. */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface EditorContextType {
  isAdmin: boolean;
  isEditMode: boolean;
  /** No hace nada si el usuario no es admin. */
  toggleEditMode: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

function readIsAdmin(): boolean {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}') as { is_admin?: boolean };
    return user.is_admin === true;
  } catch {
    return false;
  }
}

/** Escucha `userStateChange` para seguir el rol admin al iniciar o cerrar sesión. */
export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(readIsAdmin);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const sync = () => {
      const admin = readIsAdmin();
      setIsAdmin(admin);
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

// eslint-disable-next-line react-refresh/only-export-components
export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor debe usarse dentro de <EditorProvider>');
  }
  return context;
};
