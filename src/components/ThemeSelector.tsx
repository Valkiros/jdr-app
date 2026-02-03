import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const ThemeSelector: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="relative">
            <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'forest')}
                className="bg-parchment border border-leather text-leather font-serif font-bold text-sm rounded shadow-sm px-2 py-1 outline-none cursor-pointer hover:bg-white/50 transition-colors"
                title="Choisir un thème"
            >
                <option value="light">📜 Livre</option>
                <option value="dark">🌑 Obsidienne</option>
                <option value="forest">🌿 Elfe</option>
            </select>
        </div>
    );
};
