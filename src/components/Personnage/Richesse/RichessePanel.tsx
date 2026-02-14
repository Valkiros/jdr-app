import React from 'react';
import { RichesseData } from '../../../types';
import { SmartInput } from '../../Shared/SmartInput';

interface RichessePanelProps {
    richesse: RichesseData;
    onChange: (newRichesse: RichesseData) => void;
}

export const RichessePanel: React.FC<RichessePanelProps> = ({ richesse, onChange }) => {

    const updateField = (path: string, value: number) => {
        // Deep clone for immutability
        const newData = JSON.parse(JSON.stringify(richesse));

        // Helper to set nested property
        const parts = path.split('.');
        let current = newData;
        for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;

        onChange(newData);
    };

    const currencies = [
        { key: 'beryllium', label: 'Berylium [500]' },
        { key: 'thritil', label: 'Thritil [100]' },
        { key: 'or', label: 'Or [1]' },
        { key: 'argent', label: 'Argent [0,1]' },
        { key: 'cuivre', label: 'Cuivre [0,01]' },
    ];

    const locations = [
        { key: 'sur_soi', label: 'Sur soi' },
        { key: 'banque', label: 'Banque' },
        { key: 'maison', label: 'Maison' },
        { key: 'commun', label: 'Commun' },
    ];

    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-serif font-bold text-leather border-b-2 border-leather pb-2">Richesse</h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Colonne de Gauche : Capacité & Statuts */}
                <div className="md:col-span-3 space-y-6">

                    {/* Capacité de la Bourse */}
                    <div className="p-4 bg-parchment/30 rounded-lg shadow-sm border border-leather/20">
                        <label className="block text-leather font-bold font-serif mb-2 text-center">Capacité de la bourse</label>
                        <div className="flex justify-center">
                            <SmartInput
                                type="number"
                                value={richesse.capacite_bourse}
                                onCommit={(val) => updateField('capacite_bourse', Number(val))}
                                className="w-24 p-2 bg-input-bg text-ink border-b border-leather-light focus:border-leather outline-none text-center font-bold text-lg"
                            />
                        </div>
                    </div>

                    {/* Points de Statuts */}
                    <div className="p-4 bg-parchment/30 rounded-lg shadow-sm border border-leather/20">
                        <h3 className="text-lg font-bold text-leather font-serif mb-4 text-center border-b border-leather/10 pb-2">Points de statuts</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-ink-light font-medium mb-1">Honneurs</label>
                                <SmartInput
                                    type="number"
                                    value={richesse.status_points.honneurs}
                                    onCommit={(val) => updateField('status_points.honneurs', Number(val))}
                                    className="w-full p-1 bg-input-bg text-ink border-b border-leather-light focus:border-leather outline-none text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-ink-light font-medium mb-1">SM / SOT</label>
                                <SmartInput
                                    type="number"
                                    value={richesse.status_points.sm_sot}
                                    onCommit={(val) => updateField('status_points.sm_sot', Number(val))}
                                    className="w-full p-1 bg-input-bg text-ink border-b border-leather-light focus:border-leather outline-none text-center"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-ink-light font-medium mb-1">MC / MOT</label>
                                <SmartInput
                                    type="number"
                                    value={richesse.status_points.mc_mot}
                                    onCommit={(val) => updateField('status_points.mc_mot', Number(val))}
                                    className="w-full p-1 bg-input-bg text-ink border-b border-leather-light focus:border-leather outline-none text-center"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Colonne de Droite : Tableau des Monnaies */}
                <div className="md:col-span-9">
                    <div className="p-6 bg-parchment/30 rounded-lg shadow-sm border border-leather/20 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-sm font-serif font-bold text-leather uppercase tracking-wider border-b-2 border-leather">
                                    <th className="p-3">Monnaies</th>
                                    {locations.map(loc => (
                                        <th key={loc.key} className="p-3 text-center w-32">{loc.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-ink">
                                {currencies.map((currency) => (
                                    <tr key={currency.key} className="border-b border-leather-light/30 hover:bg-leather/5 transition-colors">
                                        <td className="p-3 font-medium">{currency.label}</td>
                                        {locations.map(loc => (
                                            <td key={loc.key} className="p-2">
                                                <SmartInput
                                                    type="number"
                                                    value={(richesse.monnaies as any)[currency.key][loc.key]}
                                                    onCommit={(val) => updateField(`monnaies.${currency.key}.${loc.key}`, Number(val))}
                                                    className="w-full p-1 bg-input-bg text-ink border-b border-leather-light focus:border-leather outline-none text-center"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
