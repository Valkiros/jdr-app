import React from 'react';
import { MagicStealth, ProtectionValue } from '../types';

interface MagicStealthPanelProps {
    stats: MagicStealth;
    onChange: (stats: MagicStealth) => void;
}

export const MagicStealthPanel: React.FC<MagicStealthPanelProps> = ({ stats, onChange }) => {

    const handleChange = (category: keyof MagicStealth, field: keyof ProtectionValue, value: string) => {
        const num = parseInt(value) || 0;
        onChange({
            ...stats,
            [category]: { ...stats[category], [field]: num }
        });
    };

    const renderRow = (label: string, category: keyof MagicStealth) => {
        const data = stats[category];
        return (
            <div className="flex items-center gap-2 mb-2">
                <label className="flex-1 text-sm font-bold text-leather whitespace-nowrap">{label}</label>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase opacity-60">Base</span>
                    <input
                        type="number"
                        value={data.base}
                        onChange={(e) => handleChange(category, 'base', e.target.value)}
                        className="w-16 bg-white/50 border border-leather/30 rounded text-center"
                    />
                </div>
                <span className="text-leather-light mt-4">+</span>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase opacity-60">Add.</span>
                    <input
                        type="number"
                        value={data.temp}
                        onChange={(e) => handleChange(category, 'temp', e.target.value)}
                        className="w-16 bg-white/50 border border-leather/30 rounded text-center"
                    />
                </div>
                <span className="text-leather-light mt-4">=</span>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase opacity-60">Total</span>
                    <span className="w-12 py-1 font-bold text-center bg-leather/10 rounded my-auto block border border-leather/20">
                        {data.base + data.temp}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 my-4 bg-parchment/30 rounded border border-leather/20">
            <h3 className="font-serif font-bold text-leather font-xl uppercase mb-4 border-b border-leather/20 pb-2">
                Magie & Discrétion
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {renderRow("Magie Physique", "magie_physique")}
                {renderRow("Magie Psychique", "magie_psychique")}
                {renderRow("Résistance Magique", "resistance_magique")}
                {renderRow("Discrétion", "discretion")}
            </div>
        </div>
    );
};
