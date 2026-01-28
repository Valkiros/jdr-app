import React from 'react';
import { TempModifiers } from '../types';

interface TempModifiersPanelProps {
    modifiers: TempModifiers;
    onChange: (modifiers: TempModifiers) => void;
}

export const TempModifiersPanel: React.FC<TempModifiersPanelProps> = ({ modifiers, onChange }) => {

    const handleChange = (field: keyof TempModifiers, value: string) => {
        onChange({ ...modifiers, [field]: value });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 my-6 p-4 bg-leather/5 rounded-lg border-t-2 border-leather">
            <div className="flex-1">
                <label className="block text-sm font-bold uppercase text-leather mb-1">Modificateur Temporaire 1</label>
                <textarea
                    value={modifiers.mod1}
                    onChange={(e) => handleChange('mod1', e.target.value)}
                    className="w-full h-24 bg-parchment border border-leather/40 rounded p-2 focus:border-leather outline-none font-handwriting text-ink"
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-bold uppercase text-leather mb-1">Modificateur Temporaire 2</label>
                <textarea
                    value={modifiers.mod2}
                    onChange={(e) => handleChange('mod2', e.target.value)}
                    className="w-full h-24 bg-parchment border border-leather/40 rounded p-2 focus:border-leather outline-none font-handwriting text-ink"
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-bold uppercase text-leather mb-1">Modificateur Temporaire 3</label>
                <textarea
                    value={modifiers.mod3}
                    onChange={(e) => handleChange('mod3', e.target.value)}
                    className="w-full h-24 bg-parchment border border-leather/40 rounded p-2 focus:border-leather outline-none font-handwriting text-ink"
                />
            </div>
        </div>
    );
};
