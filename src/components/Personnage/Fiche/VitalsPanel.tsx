import React, { useState } from 'react';
import { Vitals, ValueMax, Corruption, CorruptionOrigineRef, CorruptionPalierRef } from '../../../types';
import { Tooltip } from '../../Shared/Tooltip';

interface VitalsPanelProps {
    vitals: Vitals;
    onChange: (vitals: Vitals) => void;
    origine?: string;
    corruptionRules?: {
        origine: CorruptionOrigineRef[];
        palier: CorruptionPalierRef[];
    } | null;
}

export const VitalsPanel: React.FC<VitalsPanelProps> = ({ vitals, onChange, origine, corruptionRules }) => {
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number, y: number } | null>(null);

    const handleValueMaxChange = (category: 'pv' | 'pm', field: keyof ValueMax, value: string) => {
        const num = parseInt(value) || 0;
        onChange({
            ...vitals,
            [category]: { ...vitals[category], [field]: num }
        });
    };

    const handleCorruptionChange = (field: keyof Corruption, value: string) => {
        const num = parseInt(value) || 0;
        onChange({
            ...vitals,
            corruption: { ...vitals.corruption, [field]: num }
        });
    };

    const renderBar = (label: string, data: ValueMax, category: 'pv' | 'pm', colorClass: string, tempColorClass: string) => {
        // Total capacity for the visual bar is Max + Additional points
        const totalCapacity = (data.max || 1) + (data.temp || 0);

        // Calculate percentages based on the total capacity
        const currentPct = Math.min(100, (data.current / totalCapacity) * 100);
        const tempPct = Math.min(100, (data.temp / totalCapacity) * 100);

        return (
            <div className="flex flex-col gap-1 p-3 bg-parchment/40 rounded border border-leather/20">
                <h3 className="font-serif font-bold text-leather uppercase text-sm">{label}</h3>

                {/* Bar Visual */}
                <div className="w-full h-4 bg-gray-300 rounded overflow-hidden mb-2 border border-gray-400 flex">
                    <div
                        className={`h-full ${colorClass}`}
                        style={{ width: `${currentPct}%` }}
                    />
                    {data.temp > 0 && (
                        <div
                            className={`h-full ${tempColorClass}`}
                            style={{ width: `${tempPct}%` }}
                        />
                    )}
                </div>

                {/* Inputs */}
                <div className="flex gap-2 text-center text-sm">
                    <div className="flex flex-col w-1/3">
                        <label className="text-[10px] uppercase opacity-70">Actuel</label>
                        <input
                            type="number"
                            value={data.current || ''}
                            onChange={(e) => handleValueMaxChange(category, 'current', e.target.value)}
                            className="bg-input-bg border border-leather/30 rounded px-1 w-full text-center"
                        />
                    </div>
                    <div className="flex flex-col w-1/3">
                        <label className="text-[10px] uppercase opacity-70">Max</label>
                        <input
                            type="number"
                            value={data.max || ''}
                            onChange={(e) => handleValueMaxChange(category, 'max', e.target.value)}
                            className="bg-input-bg border border-leather/30 rounded px-1 w-full text-center"
                        />
                    </div>
                    <div className="flex flex-col w-1/3">
                        <label className="text-[10px] uppercase opacity-70">Add.</label>
                        <input
                            type="number"
                            value={data.temp || ''}
                            onChange={(e) => handleValueMaxChange(category, 'temp', e.target.value)}
                            className="bg-input-bg border border-leather/30 rounded px-1 w-full text-center font-bold"
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            {renderBar('Points de Vie', vitals.pv, 'pv', 'bg-red-600', 'bg-red-400')}
            {renderBar('Points de Mana', vitals.pm, 'pm', 'bg-blue-600', 'bg-blue-400')}

            {/* Corruption Section */}
            <div
                className="flex flex-col gap-1 p-3 bg-parchment/40 rounded border border-leather/20 relative cursor-help"
                onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltipPosition({
                        x: rect.left + (rect.width / 2),
                        y: rect.bottom
                    });
                }}
                onMouseLeave={() => setTooltipPosition(null)}
            >
                <h3 className="font-serif font-bold text-leather uppercase text-sm flex items-center gap-2">
                    Corruption
                </h3>

                {/* Bar Visual */}
                <div className="w-full h-4 bg-gray-300 rounded overflow-hidden mb-2 border border-gray-400 relative">
                    <div
                        className="h-full bg-purple-700"
                        style={{ width: `${Math.min(100, (vitals.corruption.current / 100) * 100)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold drop-shadow-md">
                        {vitals.corruption.current} / 100
                    </span>
                </div>

                <div className="flex gap-2 text-center text-sm">
                    <div className="flex flex-col w-1/2">
                        <label className="text-[10px] uppercase opacity-70">Actuel</label>
                        <input
                            type="number"
                            value={vitals.corruption.current || ''}
                            onChange={(e) => handleCorruptionChange('current', e.target.value)}
                            className="bg-input-bg border border-leather/30 rounded px-1 w-full text-center"
                        />
                    </div>
                    <div className="flex flex-col w-1/2">
                        <label className="text-[10px] uppercase opacity-70">Par Jour</label>
                        <input
                            type="number"
                            value={vitals.corruption.daily || ''}
                            onChange={(e) => handleCorruptionChange('daily', e.target.value)}
                            className="bg-input-bg border border-leather/30 rounded px-1 w-full text-center"
                        />
                    </div>
                </div>
            </div>

            <Tooltip
                visible={!!tooltipPosition}
                position={tooltipPosition || { x: 0, y: 0 }}
                title="Effets de Corruption"
                direction="bottom"
            >
                {(() => {
                    const current = vitals.corruption.current;

                    // Origin Effect
                    const originEffect = (origine && corruptionRules?.origine)
                        ? corruptionRules.origine.find((o) => o.Masculin === origine || o.Féminin === origine)
                        : null;

                    // Palier Effect (Highest threshold reached)
                    const relevantPaliers = corruptionRules?.palier
                        ? corruptionRules.palier.filter((p) => p.Paliers <= current)
                        : [];

                    const palierEffect = relevantPaliers.length > 0
                        ? relevantPaliers.reduce((prev, current) => (prev.Paliers > current.Paliers) ? prev : current)
                        : null;

                    return (
                        <div className="space-y-4">
                            {/* Section 1: Effets généraux */}
                            <div>
                                <div className="font-bold text-leather-dark border-b border-leather/20 mb-1">Effets généraux :</div>
                                {palierEffect ? (
                                    <>
                                        <div className="text-xs text-leather mb-2 font-bold opacity-80">
                                            Palier actuel: {palierEffect.Paliers}%
                                        </div>
                                        <p className="text-xs leading-relaxed text-ink mb-2 italic">
                                            {palierEffect.Effets || "Aucun effet narratif."}
                                        </p>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs opacity-90 bg-leather/5 p-2 rounded">
                                            {palierEffect["Force (FO)"] !== 0 && (
                                                <div className="flex justify-between text-ink"><span>Force:</span> <span className={`${palierEffect["Force (FO)"] > 0 ? 'text-leather-dark' : 'text-red-600'} font-bold`}>{palierEffect["Force (FO)"] > 0 ? '+' : ''}{palierEffect["Force (FO)"]}</span></div>
                                            )}
                                            {palierEffect["Intelligence (INT)"] !== 0 && (
                                                <div className="flex justify-between text-ink"><span>Intelligence:</span> <span className={`${palierEffect["Intelligence (INT)"] > 0 ? 'text-leather-dark' : 'text-red-600'} font-bold`}>{palierEffect["Intelligence (INT)"] > 0 ? '+' : ''}{palierEffect["Intelligence (INT)"]}</span></div>
                                            )}
                                            {palierEffect["Charisme (CHA)"] !== 0 && (
                                                <div className="flex justify-between text-ink"><span>Charisme:</span> <span className={`${palierEffect["Charisme (CHA)"] > 0 ? 'text-leather-dark' : 'text-red-600'} font-bold`}>{palierEffect["Charisme (CHA)"] > 0 ? '+' : ''}{palierEffect["Charisme (CHA)"]}</span></div>
                                            )}
                                            {palierEffect["Résistance magique (RM)"] !== 0 && (
                                                <div className="flex justify-between text-ink"><span>Résistance Mag.:</span> <span className={`${palierEffect["Résistance magique (RM)"] > 0 ? 'text-leather-dark' : 'text-red-600'} font-bold`}>{palierEffect["Résistance magique (RM)"] > 0 ? '+' : ''}{palierEffect["Résistance magique (RM)"]}</span></div>
                                            )}
                                            {palierEffect["Aura chaotique (arme)"] !== 0 && (
                                                <div className="flex justify-between text-red-600"><span>Aura Chaotique (Arme):</span> <span className="font-bold">{palierEffect["Aura chaotique (arme)"]}</span></div>
                                            )}
                                            {palierEffect["Aura divine (arme)"] !== 0 && (
                                                <div className="flex justify-between text-blue-600"><span>Aura Divine (Arme):</span> <span className="font-bold">{palierEffect["Aura divine (arme)"]}</span></div>
                                            )}
                                            {palierEffect["Aura chaotique (protection)"] !== 0 && (
                                                <div className="flex justify-between text-red-600"><span>Aura Chaotique (Prot):</span> <span className="font-bold">{palierEffect["Aura chaotique (protection)"]}</span></div>
                                            )}
                                            {palierEffect["Aura divine (protection)"] !== 0 && (
                                                <div className="flex justify-between text-blue-600"><span>Aura Divine (Prot):</span> <span className="font-bold">{palierEffect["Aura divine (protection)"]}</span></div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-ink-light italic text-xs">Aucun effet général actif (Corruption - de 5%)</div>
                                )}
                            </div>

                            {/* Section 2: Effets liés à l'origine (affiché seulement si corruption > 0) */}
                            {current > 0 && (
                                <div>
                                    <div className="font-bold text-leather-dark border-b border-leather/20 mb-1">Effets liés à l'origine :</div>
                                    <div className="bg-leather/5 p-2 rounded">
                                        <div className="text-xs text-leather mb-1 font-bold opacity-80">{origine || 'Inconnue'}</div>
                                        <p className="text-xs leading-relaxed text-ink italic">
                                            {originEffect ? originEffect.Effets : "Aucun effet spécifique ou origine inconnue."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Tooltip>
        </div>
    );
};
