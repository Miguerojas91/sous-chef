import React, { createContext, useContext, useState, useEffect } from 'react';

interface EditorContextType {
    isAdmin: boolean;
    isEditMode: boolean;
    toggleEditMode: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

function readIsAdmin(): boolean {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.is_admin === true;
    } catch {
        return false;
    }
}

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

    const toggleEditMode = () => {
        if (isAdmin) setIsEditMode(prev => !prev);
    };

    return (
        <EditorContext.Provider value={{ isAdmin, isEditMode, toggleEditMode }}>
            {children}
        </EditorContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useEditor = () => {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};
