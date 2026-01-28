import React from 'react';
import { Equipement, RefEquipement } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface EquipementTableProps {
    title: string;
    items: Equipement[];
    onItemsChange: (items: Equipement[]) => void;
    referenceOptions: RefEquipement[];
    type: 'Armure' | 'Arme' | 'Sac' | 'Autre';
    defaultItem?: Partial<Equipement>; // Optional default values
}

export const EquipementTable: React.FC<EquipementTableProps> = ({ title, items, onItemsChange, referenceOptions, type, defaultItem }) => {

    const handleAddRow = () => {
        const newItem: Equipement = {
            id: uuidv4(),
            refId: 0,
            originalRefId: 0,
            nom: '',
            poids: 0,
            esquive_bonus: 0,
            degats_pr: '',
            equipement_type: type,
            equipe: true,
            ...defaultItem // Merge default values
        };
        onItemsChange([...items, newItem]);
    };

    const handleRemoveRow = (id: string) => {
        onItemsChange(items.filter(item => item.id !== id));
    };

    const handleRemoveLastRow = () => {
        if (items.length > 0) {
            onItemsChange(items.slice(0, -1));
        }
    };

    const handleSelectChange = (id: string, refIdStr: string) => {
        const refId = parseInt(refIdStr);
        const refItem = referenceOptions.find(r => r.id === refId);

        if (refItem) {
            onItemsChange(items.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        refId: refItem.id,
                        nom: refItem.nom,
                        poids: refItem.poids,
                        esquive_bonus: refItem.esquive_bonus,
                        degats_pr: refItem.degats_pr
                    };
                }
                return item;
            }));
        }
    };

    const handleToggleEquip = (id: string) => {
        onItemsChange(items.map(item => {
            if (item.id === id) {
                return { ...item, equipe: !item.equipe };
            }
            return item;
        }));
    };

    return (
        <div className="mb-6 p-4 bg-parchment/50 rounded-lg border-2 border-leather shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4 border-b border-leather/30 pb-2">
                <h3 className="text-xl font-bold text-leather-dark font-serif tracking-wide">{title}</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleRemoveLastRow}
                        className="px-3 py-1 bg-parchment border border-leather text-leather font-serif font-bold rounded hover:bg-leather hover:text-parchment active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={items.length === 0}
                        title="Supprimer la dernière ligne"
                    >
                        -
                    </button>
                    <button
                        onClick={handleAddRow}
                        className="px-3 py-1 bg-leather text-parchment font-serif font-bold rounded hover:bg-leather-dark active:scale-95 transition-all shadow-sm"
                        title="Ajouter une ligne"
                    >
                        +
                    </button>
                </div>
            </div>
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-sm font-serif font-bold text-leather uppercase tracking-wider border-b-2 border-leather">
                        <th className="p-2 w-8">Eq.</th>
                        <th className="p-2">Nom</th>
                        <th className="p-2 w-24">Poids (kg)</th>
                        <th className="p-2 w-16">ES</th>
                        <th className="p-2 w-24">Dég./PR</th>
                        <th className="p-2 w-8"></th>
                    </tr>
                </thead>
                <tbody className="text-ink">
                    {items.map(item => (
                        <tr key={item.id} className="border-b border-leather-light/30 hover:bg-leather/5">
                            <td className="p-2 text-center">
                                <input
                                    type="checkbox"
                                    checked={item.equipe}
                                    onChange={() => handleToggleEquip(item.id)}
                                    className="accent-leather cursor-pointer"
                                />
                            </td>
                            <td className="p-2">
                                <select
                                    value={item.refId || ''}
                                    onChange={(e) => handleSelectChange(item.id, e.target.value)}
                                    className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none"
                                >
                                    <option value="">-- Sélectionner --</option>
                                    {referenceOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.nom}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="p-2 text-center">{item.poids.toFixed(2)}</td>
                            <td className="p-2 text-center">{item.esquive_bonus > 0 ? `+${item.esquive_bonus}` : item.esquive_bonus}</td>
                            <td className="p-2 text-center">{item.degats_pr}</td>
                            <td className="p-2 text-center">
                                <button
                                    onClick={() => handleRemoveRow(item.id)}
                                    className="text-red-600 hover:text-red-800 font-bold"
                                >
                                    &times;
                                </button>
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-4 text-center text-ink-light italic">Aucun équipement</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
