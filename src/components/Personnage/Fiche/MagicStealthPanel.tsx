import React, { useState } from 'react';
import { MagicStealth, ProtectionValue, StatDetail } from '../../../types';
import { Tooltip } from '../../Shared/Tooltip';
import { CalculationDetails } from './CalculationDetails';
import { SmartInput } from '../../Shared/SmartInput';


interface MagicStealthPanelProps {
    stats: MagicStealth;
    computedMagic?: {
        magie_physique: { value: number, details: StatDetail },
        magie_psychique: { value: number, details: StatDetail },
        resistance_magique: { value: number, details: StatDetail },
        // Protection Status
        protection_pluie: { value: number, details: StatDetail },
        protection_froid: { value: number, details: StatDetail },
        protection_chaleur: { value: number, details: StatDetail }
    };
    onChange: (stats: MagicStealth) => void;
}

const MagicStealthPanelComponent: React.FC<MagicStealthPanelProps> = ({ stats, computedMagic, onChange }) => {
    const [hoveredInfo, setHoveredInfo] = useState<{ details: StatDetail, x: number, y: number } | null>(null);

    const handleChange = (category: keyof MagicStealth, field: keyof ProtectionValue, value: string | number) => {
        const num = typeof value === 'string' ? parseInt(value) || 0 : value;
        onChange({
            ...stats,
            [category]: { ...stats[category], [field]: num }
        });
    };

    const renderRow = (label: string, category: keyof MagicStealth) => {
        const data = stats[category];

        let isComputed = false;
        let baseValue = data.base;
        let details: StatDetail | undefined;

        if (computedMagic) {
            // Check if this category exists in computedMagic (it should for all displayed here)
            // @ts-ignore - Dynamic access to computedMagic
            const computed = computedMagic[category as keyof typeof computedMagic];
            if (computed) {
                baseValue = computed.value;
                details = computed.details;
                isComputed = true;
            }
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
                            onCommit={(val) => !isComputed && handleChange(category, 'base', val)}
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
                        onCommit={(val) => handleChange(category, 'temp', val)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            {/* Box 1: Magie + Résistance Magique */}
            <div className="p-4 bg-parchment/30 rounded border border-leather/20">
                <h3 className="font-serif font-bold text-leather font-xl uppercase mb-4 border-b border-leather/20 pb-2">
                    Magie
                </h3>
                <div className="flex flex-col gap-2">
                    {renderRow("Physique", "magie_physique")}
                    {renderRow("Psychique", "magie_psychique")}
                    {renderRow("Résistance Magique", "resistance_magique")}
                </div>
            </div>

            {/* Box 2: Protection Status */}
            <div className="p-4 bg-parchment/30 rounded border border-leather/20">
                <h3 className="font-serif font-bold text-leather font-xl uppercase mb-4 border-b border-leather/20 pb-2">
                    Protection Status
                </h3>
                <div className="flex flex-col gap-2">
                    {renderRow("Pluie", "protection_pluie")}
                    {renderRow("Froid", "protection_froid")}
                    {renderRow("Chaleur", "protection_chaleur")}
                </div>
            </div>

            <Tooltip visible={!!hoveredInfo} position={hoveredInfo ? { x: hoveredInfo.x, y: hoveredInfo.y } : { x: 0, y: 0 }} title="Détails du Calcul">
                {hoveredInfo && <CalculationDetails details={hoveredInfo.details} />}
            </Tooltip>
        </div>
    );
};
export const MagicStealthPanel = React.memo(MagicStealthPanelComponent);
