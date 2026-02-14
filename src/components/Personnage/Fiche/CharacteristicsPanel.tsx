import React, { useState, useEffect } from 'react';
import { Characteristics, CharacteristicColumn, Equipement } from '../../../types';
import { Tooltip } from '../../Shared/Tooltip';
import { SmartInput } from '../../Shared/SmartInput';
import { CalculationDetails } from './CalculationDetails';
import { calculateFinalRupture } from '../../../utils/sacUtils';


interface DetailedValue {
    value: number;
    components: { label: string; value: number; displayValue?: string }[];
    overrideDisplay?: string;
}

interface CharacteristicsPanelProps {
    characteristics: Characteristics;
    equippedValues: Record<keyof Characteristics, DetailedValue>;
    inventory: Equipement[];
    referenceOptions: any[];
    onChange: (characteristics: Characteristics) => void;
    globalModifiers?: {
        pi?: number;
    };
}

const CharacteristicsPanelComponent: React.FC<CharacteristicsPanelProps> = ({
    characteristics,
    equippedValues,
    inventory = [],
    referenceOptions = [],
    onChange,
    globalModifiers
}) => {
    const [hoveredInfo, setHoveredInfo] = useState<{ id: string, x: number, y: number, content?: any } | null>(null);
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Control') setIsCtrlPressed(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Update 'Naturel' or standard columns
    const handleCharacteristicChange = (row: keyof Characteristics, col: keyof CharacteristicColumn, value: string) => {
        const num = parseInt(value) || 0;
        onChange({
            ...characteristics,
            [row]: { ...characteristics[row], [col]: num }
        });
    };


    const rows: { key: keyof Characteristics; label: string }[] = [
        { key: 'courage', label: 'Courage' },
        { key: 'intelligence', label: 'Intelligence' },
        { key: 'charisme', label: 'Charisme' },
        { key: 'adresse', label: 'Adresse' },
        { key: 'force', label: 'Force' },
        { key: 'perception', label: 'Perception' },
        { key: 'esquive', label: 'Esquive' },
        { key: 'attaque', label: 'Attaque' },
        { key: 'parade', label: 'Parade' },
        { key: 'degats', label: 'Dégâts' },
    ];

    // Filter and label dynamic columns
    const mainsNues = inventory.filter(i => i.equipement_type === 'MainsNues');
    const armes = inventory.filter(i => i.equipement_type === 'Armes');

    const dynamicColumns = [
        ...mainsNues.map((item, idx) => ({
            id: item.uid,
            label: `M${idx + 1}`,
            type: 'MainsNues'
        })),
        ...armes.map((item, idx) => ({
            id: item.uid,
            label: `A${idx + 1}`,
            type: 'Armes'
        }))
    ];

    return (
        <div className="overflow-x-auto my-6 p-4 bg-parchment/30 rounded border border-leather/20">
            <h3 className="font-serif font-bold text-leather font-xl uppercase mb-4 border-b border-leather/20 pb-2">
                Caractéristiques
            </h3>
            <table className="w-full text-center border-collapse">
                <thead>
                    <tr className="text-xs font-bold uppercase text-leather-light tracking-wider">
                        <th className="p-2 text-left w-32">Nom</th>
                        <th className="p-2 w-16 text-leather-dark min-w-[60px]">Naturel</th>

                        <th className="p-2 bg-leather/5 border-l border-white/20 w-12"></th>
                        <th className="p-2 w-16 min-w-[60px]">T1</th>
                        <th className="p-2 w-16 min-w-[60px]">T2</th>
                        <th className="p-2 w-16 min-w-[60px]">T3</th>

                        <th className="p-2 bg-leather/5 border-l border-white/20 w-12"></th>
                        <th className="p-2 w-20 min-w-[60px]">Équipé</th>

                        {/* Dynamic Headers with Tooltip Event */}
                        {dynamicColumns.map(col => (
                            <th
                                key={col.id}
                                className="p-2 w-16 text-leather-dark cursor-help relative group min-w-[60px]"
                                onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredInfo({
                                        id: col.id,
                                        x: rect.left + (rect.width / 2),
                                        y: rect.top - 10 // Slightly above
                                    });
                                }}
                                onMouseLeave={() => setHoveredInfo(null)}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="font-serif text-leather-dark">
                    {rows.map(({ key, label }) => {
                        const data = characteristics[key];
                        // Safety check if data structure is incomplete during dev
                        if (!data) return null;

                        return (
                            <tr key={key} className="border-b border-leather/10 hover:bg-leather/5 transition-colors">
                                <td className="p-2 text-left font-bold">{label}</td>

                                <td className="p-2">
                                    <SmartInput
                                        type="number"
                                        value={data.naturel || 0}
                                        onCommit={(val) => handleCharacteristicChange(key, 'naturel', String(val))}
                                        readOnly={key === 'degats'}
                                        className={`w-full bg-input-bg border border-leather/30 rounded text-center py-1 font-bold text-leather-dark ${key === 'degats' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </td>

                                <td className="p-2 bg-leather/5 border-l border-white/20"></td>

                                {/* Static Temp Modifiers Inputs */}
                                <td className="p-2">
                                    <SmartInput
                                        type="number"
                                        value={data.t1 || 0}
                                        onCommit={(val) => handleCharacteristicChange(key, 't1', String(val))}
                                        readOnly={key === 'degats'}
                                        className={`w-full bg-input-bg border border-leather/30 rounded text-center py-1 ${key === 'degats' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </td>
                                <td className="p-2">
                                    <SmartInput
                                        type="number"
                                        value={data.t2 || 0}
                                        onCommit={(val) => handleCharacteristicChange(key, 't2', String(val))}
                                        readOnly={key === 'degats'}
                                        className={`w-full bg-input-bg border border-leather/30 rounded text-center py-1 ${key === 'degats' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </td>
                                <td className="p-2">
                                    <SmartInput
                                        type="number"
                                        value={data.t3 || 0}
                                        onCommit={(val) => handleCharacteristicChange(key, 't3', String(val))}
                                        readOnly={key === 'degats'}
                                        className={`w-full bg-input-bg border border-leather/30 rounded text-center py-1 ${key === 'degats' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </td>

                                <td className="p-2 bg-leather/5 border-l border-white/20"></td>

                                <td className={`p-2 relative ${key === 'degats' ? 'cursor-default' : 'cursor-help'}`}
                                    onMouseEnter={(e) => {
                                        if (key === 'degats') return;
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setHoveredInfo({
                                            id: `equipped-${key}`,
                                            x: rect.left + (rect.width / 2),
                                            y: rect.top - 10,
                                            content: equippedValues[key]
                                        });
                                    }}
                                    onMouseLeave={() => setHoveredInfo(null)}
                                >
                                    <span className={`block w-full text-center font-bold bg-leather/10 rounded py-1 border border-leather/20 ${equippedValues[key]?.overrideDisplay ? 'text-red-600' : ''}`}>
                                        {key === 'degats' ? '-' : (equippedValues[key]?.overrideDisplay || equippedValues[key]?.value || 0)}
                                    </span>
                                </td>

                                {/* Dynamic Inputs */}
                                {dynamicColumns.map(col => {
                                    const item = inventory.find(i => i.uid === col.id) as any;

                                    if (key === 'degats') {
                                        if (!item) return <td key={col.id}></td>;

                                        const refItem = referenceOptions.find(r => r.id === item.refId);

                                        // Resolve Dice: Item Override > Ref Object (New) > Ref String (Legacy/Flat) > Empty
                                        let dice = item.degats;
                                        if (!dice && refItem) {
                                            if (typeof refItem.degats === 'object') {
                                                dice = refItem.degats.degats || refItem.degats.valeur;
                                            } else if (typeof refItem.degats === 'string') {
                                                dice = refItem.degats;
                                            }
                                        }
                                        dice = dice || '';

                                        // Resolve PI from Reference (Legacy Root or New Object)
                                        let refPi = refItem ? (refItem.pi || 0) : 0;
                                        if (refItem?.degats && typeof refItem.degats === 'object') {
                                            const val = parseInt(refItem.degats.pi, 10);
                                            if (!isNaN(val)) refPi = val;
                                        }

                                        let modifVal = 0;
                                        if (item.modif_pi) {
                                            const val = Number(item.modif_pi);
                                            if (!isNaN(val)) modifVal = val;
                                        }

                                        // Calculate Bonus FO for this specific item column
                                        // 1. Get Base Force (Character Total without this weapon)
                                        const baseForce = equippedValues.force?.value || 0;
                                        // 2. Get Item Force Bonus (Instance + Reference)
                                        const instanceForceBonus = item.char_values?.force || 0;

                                        const refValCarac = (refItem as any)?.caracteristiques?.force;
                                        const refValRoot = (refItem as any)?.force;
                                        const refValRaw = refItem?.raw?.caracteristiques?.force;
                                        const refForceBonus = parseInt(String(refValCarac || refValRoot || refValRaw || 0), 10);

                                        // 3. Compute Effective Force for this item
                                        const effectiveForce = baseForce + instanceForceBonus + refForceBonus;
                                        // 4. Compute Bonus FO
                                        const rawBonusFo = Math.max(0, effectiveForce - 12);

                                        // Check for excluded types
                                        // Try to find type in details (new), direct (legacy), or fallback
                                        const type = (refItem as any)?.details?.type || (refItem as any)?.type || item.equipement_type || '';
                                        const excludedTypes = ['Arbalète', 'Pistolet', 'Fusil', 'Arme de siège', 'Engins explosifs', 'Engin incendiaire', 'Arme à projectiles'];
                                        const isExcluded = excludedTypes.includes(type);

                                        const bonusFo = isExcluded ? 0 : rawBonusFo;

                                        // Global PI modifiers (Alcohol, Hangover...)
                                        const globalPi = (globalModifiers?.pi || 0);

                                        const totalPi = (refPi || 0) + modifVal + bonusFo + globalPi;

                                        let display = dice;
                                        if (totalPi > 0) display += ` + ${totalPi}`;
                                        else if (totalPi < 0) display += ` - ${Math.abs(totalPi)}`;

                                        // Tooltip details construction
                                        let tooltipText = `Dégâts Total (Bonus FO: ${bonusFo})`;
                                        if (globalPi !== 0) {
                                            tooltipText += `\nModif. Global (Alcool): ${globalPi > 0 ? '+' : ''}${globalPi}`;
                                        }
                                        if (display) tooltipText += `\n${display}`;

                                        return (
                                            <td key={col.id} className="p-2">
                                                <span className="block w-full text-center py-1 opacity-70 text-xs font-bold truncate px-1" title={tooltipText}>
                                                    {display || '-'}
                                                </span>
                                            </td>
                                        );
                                    }

                                    const refItem = referenceOptions.find(r => r.id === item.refId);

                                    // Calculate bonus from Item Instance (modifiers) AND Reference Item (base stats)
                                    // Use parseInt for robust parsing of strings like "+2" or "-1"
                                    const instanceBonus = parseInt(String(item?.char_values?.[key] || 0), 10);

                                    // Check RefItem root, nested caracteristiques, or raw
                                    // Priority: Nested (New Schema) > Root (Old) > Raw (Legacy)
                                    const refValRoot = (refItem as any)?.[key];
                                    const refValCarac = (refItem as any)?.caracteristiques?.[key];
                                    const refValRaw = refItem?.raw?.caracteristiques?.[key];

                                    const refBonus = parseInt(String(refValCarac || refValRoot || refValRaw || 0), 10);

                                    const total = (equippedValues[key]?.value || 0) + instanceBonus + refBonus;

                                    // Override Display check for dynamic columns (Impossible Dodge)
                                    if (equippedValues[key]?.overrideDisplay) {
                                        return (
                                            <td key={col.id} className="p-2">
                                                <span className="block w-full text-center py-1 font-bold text-red-600 text-xs">
                                                    {equippedValues[key].overrideDisplay}
                                                </span>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td key={col.id} className="p-2">
                                            <span className="block w-full text-center py-1 opacity-70">
                                                {total || '-'}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Floating Tooltip */}
            {hoveredInfo && isCtrlPressed && (() => {
                // Check if it's an equipped value tooltip (has content)
                if (hoveredInfo.content) {
                    const details = hoveredInfo.content as DetailedValue;
                    return (
                        <Tooltip visible={!!hoveredInfo} position={{ x: hoveredInfo.x, y: hoveredInfo.y }} title="Détail du calcul">
                            <CalculationDetails details={details} />
                        </Tooltip>
                    );
                }

                // Standard Item Tooltip (Dynamic Columns)
                const item = inventory.find(i => i.uid === hoveredInfo.id);
                if (!item) return null;
                const refItem = referenceOptions.find(r => r.id === item.refId);

                // Prioritize 'details' object from correct backend schema
                const details = refItem?.details || {};


                const effet = details.effet || '-';
                const aura = details.aura || '-';
                const rupture = calculateFinalRupture(details.rupture, item.modif_rupture);
                const type = details.type || '-';

                const idDisplay = refItem?.ref_id || '-';

                return (
                    <Tooltip visible={!!hoveredInfo} position={{ x: hoveredInfo.x, y: hoveredInfo.y }} title={refItem?.nom || 'Objet Inconnu'}>
                        <div className="flex flex-col gap-1 text-xs min-w-[150px]">
                            <div className="flex justify-between items-center">
                                <span className="text-tooltip-label font-medium">ID :</span>
                                <span className="font-mono text-tooltip-text text-right">{idDisplay}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-tooltip-label font-medium">Type :</span>
                                <span className="text-tooltip-text text-right">{type}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-tooltip-label font-medium">Aura :</span>
                                <span className="font-bold text-tooltip-title text-right">{aura}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-tooltip-label font-medium">Rupture :</span>
                                <span className="text-tooltip-text text-right">{rupture}</span>
                            </div>
                            <div className="border-t border-tooltip-border/50 mt-1 pt-1 italic text-xs text-center text-tooltip-label/80 leading-relaxed font-serif">
                                {effet}
                            </div>
                        </div>
                    </Tooltip>
                );
            })()}
        </div>
    );
};
export const CharacteristicsPanel = React.memo(CharacteristicsPanelComponent);
