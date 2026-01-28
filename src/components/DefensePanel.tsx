import React from 'react';
import { Defenses, Movement, ProtectionValue } from '../types';

interface DefensePanelProps {
    defenses: Defenses;
    movement: Movement;
    onDefenseChange: (defenses: Defenses) => void;
    onMovementChange: (movement: Movement) => void;
}

export const DefensePanel: React.FC<DefensePanelProps> = ({ defenses, movement, onDefenseChange, onMovementChange }) => {

    const handleProtectionChange = (category: keyof Defenses, field: keyof ProtectionValue, value: string) => {
        const num = parseInt(value) || 0;
        // @ts-ignore - Dynamic access to Defenses properties
        const currentProt = defenses[category] as ProtectionValue;
        onDefenseChange({
            ...defenses,
            [category]: { ...currentProt, [field]: num }
        });
    };

    const handleMovementChange = (category: keyof Movement, field: keyof ProtectionValue, value: string) => {
        const num = parseInt(value) || 0;
        onMovementChange({
            ...movement,
            [category]: { ...movement[category], [field]: num }
        });
    };

    const handleShieldToggle = () => {
        onDefenseChange({ ...defenses, bouclier_actif: !defenses.bouclier_actif });
    };

    const calculateTotalProtection = () => {
        const nat = defenses.naturelle.base + defenses.naturelle.temp;
        const sol = defenses.solide.base + defenses.solide.temp;
        const spe = defenses.speciale.base + defenses.speciale.temp;
        const mag = defenses.magique.base + defenses.magique.temp;
        return nat + sol + spe + mag;
    };

    const renderProtectionRow = (label: string, category: keyof Defenses) => {
        // @ts-ignore
        const data = defenses[category] as ProtectionValue;
        return (
            <div className="flex items-center gap-2 mb-2">
                <label className="w-24 text-sm font-bold text-leather">{label}</label>
                <input
                    type="number"
                    value={data.base}
                    onChange={(e) => handleProtectionChange(category, 'base', e.target.value)}
                    className="w-16 bg-white/50 border border-leather/30 rounded text-center"
                    placeholder="Base"
                />
                <span className="text-leather-light">+</span>
                <input
                    type="number"
                    value={data.temp}
                    onChange={(e) => handleProtectionChange(category, 'temp', e.target.value)}
                    className="w-16 bg-white/50 border border-leather/30 rounded text-center"
                    placeholder="Temp"
                />
                <span className="text-leather-light">=</span>
                <span className="w-8 font-bold text-center">{data.base + data.temp}</span>
            </div>
        );
    };

    const renderMovementRow = (label: string, category: keyof Movement) => {
        const data = movement[category];
        return (
            <div className="flex items-center gap-2 mb-2">
                <label className="w-24 text-sm font-bold text-leather">{label}</label>
                <input
                    type="number"
                    value={data.base}
                    onChange={(e) => handleMovementChange(category, 'base', e.target.value)}
                    className="w-16 bg-white/50 border border-leather/30 rounded text-center"
                    placeholder="Base"
                />
                <span className="text-leather-light">+</span>
                <input
                    type="number"
                    value={data.temp}
                    onChange={(e) => handleMovementChange(category, 'temp', e.target.value)}
                    className="w-16 bg-white/50 border border-leather/30 rounded text-center"
                    placeholder="Add"
                />
                <span className="text-leather-light">=</span>
                <span className="w-8 font-bold text-center">{data.base + data.temp}</span>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
            {/* Protections */}
            <div className="p-4 bg-parchment/30 rounded border border-leather/20">
                <h3 className="font-serif font-bold text-leather font-xl uppercase mb-4 border-b border-leather/20 pb-2 flex justify-between">
                    Protections
                    <span className="text-sm normal-case opacity-75">Total: <strong className="text-lg">{calculateTotalProtection()}</strong></span>
                </h3>

                {renderProtectionRow("Naturelle", "naturelle")}
                {renderProtectionRow("Solide", "solide")}
                {renderProtectionRow("Spéciale", "speciale")}
                {renderProtectionRow("Magique", "magique")}

                <div className="mt-4 flex items-center justify-between bg-leather/10 p-2 rounded">
                    <span className="font-bold text-leather">Bouclier Actif</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={defenses.bouclier_actif}
                            onChange={handleShieldToggle}
                        />
                        <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-leather"></div>
                    </label>
                </div>
            </div>

            {/* Movement */}
            <div className="p-4 bg-parchment/30 rounded border border-leather/20 h-min">
                <h3 className="font-serif font-bold text-leather font-xl uppercase mb-4 border-b border-leather/20 pb-2">
                    Déplacement
                </h3>
                {renderMovementRow("Marche", "marche")}
                {renderMovementRow("Course", "course")}
            </div>
        </div>
    );
};
