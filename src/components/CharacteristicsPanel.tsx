import React from 'react';
import { Characteristics, CharacteristicColumn } from '../types';

interface CharacteristicsPanelProps {
    characteristics: Characteristics;
    equippedValues: Record<keyof Characteristics, number>;
    onChange: (characteristics: Characteristics) => void;
}

export const CharacteristicsPanel: React.FC<CharacteristicsPanelProps> = ({ characteristics, equippedValues, onChange }) => {

    const handleChange = (row: keyof Characteristics, col: keyof CharacteristicColumn, value: string) => {
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

    return (
        <div className="overflow-x-auto my-6 p-4 bg-parchment/30 rounded border border-leather/20">
            <h3 className="font-serif font-bold text-leather font-xl uppercase mb-4 border-b border-leather/20 pb-2">
                Caractéristiques
            </h3>
            <table className="w-full text-center border-collapse">
                <thead>
                    <tr className="text-xs font-bold uppercase text-leather-light tracking-wider">
                        <th className="p-2 text-left w-32">Nom</th>
                        <th className="p-2 bg-leather/5 border-l border-white/20 w-12"></th> {/* Spacer */}
                        <th className="p-2 w-16">T1</th>
                        <th className="p-2 w-16">T2</th>
                        <th className="p-2 w-16">T3</th>
                        <th className="p-2 bg-leather/5 border-l border-white/20 w-12"></th> {/* Spacer */}
                        <th className="p-2 w-20">Équipé</th>
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
                                <td className="p-2 bg-leather/5 border-l border-white/20"></td>

                                <td className="p-2">
                                    <input
                                        type="number"
                                        value={data.t1}
                                        onChange={(e) => handleChange(key, 't1', e.target.value)}
                                        className="w-full bg-white/50 border border-leather/30 rounded text-center py-1"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        value={data.t2}
                                        onChange={(e) => handleChange(key, 't2', e.target.value)}
                                        className="w-full bg-white/50 border border-leather/30 rounded text-center py-1"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        value={data.t3}
                                        onChange={(e) => handleChange(key, 't3', e.target.value)}
                                        className="w-full bg-white/50 border border-leather/30 rounded text-center py-1"
                                    />
                                </td>

                                <td className="p-2 bg-leather/5 border-l border-white/20"></td>

                                <td className="p-2">
                                    <span className="block w-full text-center font-bold bg-leather/10 rounded py-1 border border-leather/20">
                                        {equippedValues[key] || 0}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
