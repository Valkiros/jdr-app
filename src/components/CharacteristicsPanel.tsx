import React from 'react';
import { Characteristics, CharacteristicColumn, Equipement } from '../types';
import { Tooltip } from './Tooltip';

interface CharacteristicsPanelProps {
    characteristics: Characteristics;
    equippedValues: Record<keyof Characteristics, number>;
    inventory: Equipement[];
    referenceOptions: any[]; // Using any[] to match refs passing
    onChange: (characteristics: Characteristics) => void;
}

export const CharacteristicsPanel: React.FC<CharacteristicsPanelProps> = ({
    characteristics,
    equippedValues,
    inventory = [], // Default to empty array if undefined
    referenceOptions = [],
    onChange
}) => {
    const [hoveredInfo, setHoveredInfo] = React.useState<{ id: string, x: number, y: number } | null>(null);

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
    const armes = inventory.filter(i => i.equipement_type === 'Arme');

    const dynamicColumns = [
        ...mainsNues.map((item, idx) => ({
            id: item.id,
            label: `M${idx + 1}`,
            type: 'MainsNues'
        })),
        ...armes.map((item, idx) => ({
            id: item.id,
            label: `A${idx + 1}`,
            type: 'Arme'
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
                        <th className="p-2 w-16 text-leather-dark">Naturel</th>

                        <th className="p-2 bg-leather/5 border-l border-white/20 w-12"></th> {/* Spacer */}

                        {/* Static Temp Modifiers */}
                        <th className="p-2 w-16">T1</th>
                        <th className="p-2 w-16">T2</th>
                        <th className="p-2 w-16">T3</th>

                        <th className="p-2 bg-leather/5 border-l border-white/20 w-12"></th> {/* Spacer */}
                        <th className="p-2 w-20">Équipé</th>

                        {/* Dynamic Headers with Tooltip Event */}
                        {dynamicColumns.map(col => (
                            <th
                                key={col.id}
                                className="p-2 w-16 text-leather-dark cursor-help relative group"
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
                                    <input
                                        type="number"
                                        value={data.naturel || ''}
                                        onChange={(e) => handleCharacteristicChange(key, 'naturel', e.target.value)}
                                        readOnly={key === 'degats'}
                                        className={`w-full bg-white/50 border border-leather/30 rounded text-center py-1 font-bold text-leather-dark ${key === 'degats' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </td>

                                <td className="p-2 bg-leather/5 border-l border-white/20"></td>

                                {/* Static Temp Modifiers Inputs */}
                                <td className="p-2">
                                    <input
                                        type="number"
                                        value={data.t1 || ''}
                                        onChange={(e) => handleCharacteristicChange(key, 't1', e.target.value)}
                                        readOnly={key === 'degats'}
                                        className={`w-full bg-white/50 border border-leather/30 rounded text-center py-1 ${key === 'degats' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        value={data.t2 || ''}
                                        onChange={(e) => handleCharacteristicChange(key, 't2', e.target.value)}
                                        readOnly={key === 'degats'}
                                        className={`w-full bg-white/50 border border-leather/30 rounded text-center py-1 ${key === 'degats' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        value={data.t3 || ''}
                                        onChange={(e) => handleCharacteristicChange(key, 't3', e.target.value)}
                                        readOnly={key === 'degats'}
                                        className={`w-full bg-white/50 border border-leather/30 rounded text-center py-1 ${key === 'degats' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </td>

                                <td className="p-2 bg-leather/5 border-l border-white/20"></td>

                                <td className="p-2">
                                    <span className="block w-full text-center font-bold bg-leather/10 rounded py-1 border border-leather/20">
                                        {key === 'degats' ? '-' : (equippedValues[key] || 0)}
                                    </span>
                                </td>

                                {/* Dynamic Inputs */}
                                {dynamicColumns.map(col => {
                                    const item = inventory.find(i => i.id === col.id);

                                    if (key === 'degats') {
                                        if (!item) return <td key={col.id}></td>;

                                        const dice = item.degats_pr || '';
                                        const refItem = referenceOptions.find(r => r.id === item.refId);
                                        const refPi = refItem ? refItem.pi : 0;

                                        let modifVal = 0;
                                        if (item.modif_pi) {
                                            const parsed = parseInt(item.modif_pi);
                                            if (!isNaN(parsed)) modifVal = parsed;
                                        }

                                        // Calculate Bonus FO for this specific item column
                                        // 1. Get Base Force (Character Total)
                                        const baseForce = equippedValues.force;
                                        // 2. Get Item Force Bonus (if any)
                                        const itemForceBonus = item.char_values?.force || 0;
                                        // 3. Compute Effective Force for this item
                                        const effectiveForce = baseForce + itemForceBonus;
                                        // 4. Compute Bonus FO
                                        const bonusFo = Math.max(0, effectiveForce - 12);

                                        const totalPi = (refPi || 0) + modifVal + bonusFo;

                                        let display = dice;
                                        if (totalPi > 0) display += ` + ${totalPi}`;
                                        else if (totalPi < 0) display += ` - ${Math.abs(totalPi)}`;

                                        return (
                                            <td key={col.id} className="p-2">
                                                <span className="block w-full text-center py-1 opacity-70 text-xs font-bold" title={`Dégâts Total (Bonus FO: ${bonusFo})`}>
                                                    {display || '-'}
                                                </span>
                                            </td>
                                        );
                                    }

                                    const bonus = item?.char_values?.[key] || 0;
                                    const total = (equippedValues[key] || 0) + bonus;

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
            {hoveredInfo && (() => {
                const item = inventory.find(i => i.id === hoveredInfo.id);
                if (!item) return null;
                const refItem = referenceOptions.find(r => r.id === item.refId);
                const description = refItem?.description || item.description || '-';
                // Try to infer Aura from PR Mag
                const aura = refItem?.pr_mag || '-';
                const rupture = item.rupture || refItem?.rupture || '-';
                // Fix: Priority to Ref Type (Specific) > Ref Category > Item Type (Generic)
                const type = refItem?.item_type || refItem?.category || item.equipement_type || '-';
                const idDisplay = item.refId || '-';

                return (
                    <Tooltip visible={!!hoveredInfo} position={{ x: hoveredInfo.x, y: hoveredInfo.y }} title={item.nom || refItem?.nom || 'Objet Inconnu'}>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-[#cca43b] font-semibold">ID :</span>
                            <span className="font-mono">{idDisplay}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-[#cca43b] font-semibold">Type :</span>
                            <span>{type}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-[#cca43b] font-semibold">Aura :</span>
                            <span className="font-bold text-[#eebb44]">{aura}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-[#cca43b] font-semibold">Rupture :</span>
                            <span>{rupture}</span>
                        </div>
                        <div className="border-t border-[#cca43b]/20 pt-2 mt-2 italic text-xs text-center text-[#f0e6d2]/80 leading-relaxed">
                            {description}
                        </div>
                    </Tooltip>
                );
            })()}
        </div>
    );
};
