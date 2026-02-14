import React, { useState } from 'react';
import { Defenses, ProtectionValue, StatDetail } from '../../../types';
import { Tooltip } from '../../Shared/Tooltip';
import { CalculationDetails } from '../Fiche/CalculationDetails';
import { SmartInput } from '../../Shared/SmartInput';


interface ProtectionsPanelProps {
    defenses: Defenses;
    computedDefenses?: {
        solide: { value: number, details: StatDetail },
        speciale: { value: number, details: StatDetail },
        magique: { value: number, details: StatDetail }
    };
    onDefenseChange: (defenses: Defenses) => void;
}

const ProtectionsPanelComponent: React.FC<ProtectionsPanelProps> = ({ defenses, computedDefenses, onDefenseChange }) => {
    const [hoveredInfo, setHoveredInfo] = useState<{ details: StatDetail, x: number, y: number } | null>(null);

    const handleProtectionChange = (category: keyof Defenses, field: keyof ProtectionValue, value: string | number) => {
        const num = typeof value === 'string' ? parseInt(value) || 0 : value;
        // @ts-ignore - Dynamic access to Defenses properties
        const currentProt = defenses[category] as ProtectionValue;
        onDefenseChange({
            ...defenses,
            [category]: { ...currentProt, [field]: num }
        });
    };

    const handleShieldToggle = () => {
        onDefenseChange({ ...defenses, bouclier_actif: !defenses.bouclier_actif });
    };

    // Calculate effective total using computed base if available, else state base
    const getEffectiveBase = (category: keyof Defenses) => {
        if (!computedDefenses) return (defenses[category] as ProtectionValue).base;

        if (category === 'solide') return computedDefenses.solide.value;
        if (category === 'speciale') return computedDefenses.speciale.value;
        if (category === 'magique') return computedDefenses.magique.value;
        return (defenses[category] as ProtectionValue).base;
    };

    const calculateTotalProtection = () => {
        const nat = defenses.naturelle.base + defenses.naturelle.temp;
        // For others, use effective base which comes from inventory
        const sol = getEffectiveBase('solide') + defenses.solide.temp;
        const spe = getEffectiveBase('speciale') + defenses.speciale.temp;
        const mag = getEffectiveBase('magique') + defenses.magique.temp;

        return nat + sol + spe + mag;
    };

    const renderProtectionRow = (label: string, category: keyof Defenses) => {
        // @ts-ignore
        const data = defenses[category] as ProtectionValue;

        // Determine if this row is auto-calculated
        let isComputed = false;
        let baseValue = data.base;
        let details: StatDetail | undefined;

        if (computedDefenses) {
            if (category === 'solide') { baseValue = computedDefenses.solide.value; details = computedDefenses.solide.details; isComputed = true; }
            if (category === 'speciale') { baseValue = computedDefenses.speciale.value; details = computedDefenses.speciale.details; isComputed = true; }
            if (category === 'magique') { baseValue = computedDefenses.magique.value; details = computedDefenses.magique.details; isComputed = true; }
        }

        return (
            <div className="flex items-center gap-1 mb-2">
                <label className="flex-1 text-sm font-bold text-leather leading-tight mr-1">{label}</label>
                <div className="flex flex-col items-center relative">
                    <span className="text-[10px] uppercase opacity-60">Base</span>
                    <div
                        className="relative"
                        onMouseEnter={(e) => {
                            if (isComputed && details) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setHoveredInfo({
                                    details,
                                    x: rect.left + (rect.width / 2),
                                    y: rect.top
                                });
                            }
                        }}
                        onMouseLeave={() => setHoveredInfo(null)}
                    >
                        <SmartInput
                            type="number"
                            value={isComputed ? baseValue : (data.base || 0)}
                            onCommit={(val) => !isComputed && handleProtectionChange(category, 'base', val)}
                            readOnly={isComputed}
                            className={`w-14 md:w-16 border border-leather/30 rounded text-center outline-none focus:border-leather ${isComputed ? 'bg-black/5 text-leather-dark cursor-help font-bold' : 'bg-input-bg'}`}
                        />
                    </div>
                </div>
                <span className="text-leather-light mt-4 px-1">+</span>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase opacity-60">Add.</span>
                    <SmartInput
                        type="number"
                        value={data.temp || 0}
                        onCommit={(val) => handleProtectionChange(category, 'temp', val)}
                        className="w-14 md:w-16 bg-input-bg border border-leather/30 rounded text-center outline-none focus:border-leather"
                    />
                </div>
                <span className="text-leather-light mt-4 px-1">=</span>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase opacity-60">Total</span>
                    <span className="min-w-[2.5rem] w-auto px-2 py-1 font-bold text-center bg-leather/10 rounded my-auto block border border-leather/20">
                        {baseValue + (data.temp || 0)}
                    </span>
                </div>
            </div>
        );
    };

    return (
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

            <Tooltip visible={!!hoveredInfo} position={hoveredInfo ? { x: hoveredInfo.x, y: hoveredInfo.y } : { x: 0, y: 0 }} title="Détails du Calcul">
                {hoveredInfo && <CalculationDetails details={hoveredInfo.details} />}
            </Tooltip>
        </div>
    );
};
export const ProtectionsPanel = React.memo(ProtectionsPanelComponent);
