import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'forest';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('app-theme');
        return (saved as Theme) || 'light';
    });

    useEffect(() => {
        const root = document.documentElement;
        // Reset
        root.removeAttribute('data-theme');

        // Apply (light is default, no attribute needed usually, but we can set specific ones if needed)
        // In our css: :root defines default (light), [data-theme='dark'] defines dark.
        // So for 'light', we just don't set data-theme or set it to 'light' if we defined [data-theme='light'].
        // Let's stick to our CSS: :root is default.
        if (theme !== 'light') {
            root.setAttribute('data-theme', theme);
        }

        localStorage.setItem('app-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
