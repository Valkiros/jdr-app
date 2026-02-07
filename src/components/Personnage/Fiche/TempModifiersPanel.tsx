import React, { useState, useEffect } from 'react';
import { TempModifiers } from '../../../types';

interface TempModifiersPanelProps {
    modifiers: TempModifiers;
    onChange: (modifiers: TempModifiers) => void;
}

const OnBlurTextArea: React.FC<{
    value: string;
    onChange: (val: string) => void;
    className?: string;
}> = ({ value, onChange, className }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    return (
        <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
                if (localValue !== value) {
                    onChange(localValue);
                }
            }}
            className={className}
        />
    );
};

export const TempModifiersPanel: React.FC<TempModifiersPanelProps> = ({ modifiers, onChange }) => {

    const handleChange = (field: keyof TempModifiers, value: string) => {
        onChange({ ...modifiers, [field]: value });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 my-6 p-4 bg-leather/5 rounded-lg border-t-2 border-leather">
            <div className="flex-1">
                <label className="block text-sm font-bold uppercase text-leather mb-1">Modificateur Temporaire 1</label>
                <OnBlurTextArea
                    value={modifiers.mod1}
                    onChange={(val) => handleChange('mod1', val)}
                    className="w-full h-24 bg-parchment border border-leather/40 rounded p-2 focus:border-leather outline-none font-handwriting text-ink text-xs"
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-bold uppercase text-leather mb-1">Modificateur Temporaire 2</label>
                <OnBlurTextArea
                    value={modifiers.mod2}
                    onChange={(val) => handleChange('mod2', val)}
                    className="w-full h-24 bg-parchment border border-leather/40 rounded p-2 focus:border-leather outline-none font-handwriting text-ink text-xs"
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-bold uppercase text-leather mb-1">Modificateur Temporaire 3</label>
                <OnBlurTextArea
                    value={modifiers.mod3}
                    onChange={(val) => handleChange('mod3', val)}
                    className="w-full h-24 bg-parchment border border-leather/40 rounded p-2 focus:border-leather outline-none font-handwriting text-ink text-xs"
                />
            </div>
        </div>
    );
};
