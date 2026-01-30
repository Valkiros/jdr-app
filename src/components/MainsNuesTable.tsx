import React from 'react';
import { Equipement, RefEquipement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SearchableSelect } from './SearchableSelect';

interface MainsNuesTableProps {
    items: Equipement[];
    onItemsChange: (items: Equipement[]) => void;
    referenceOptions: RefEquipement[];
    defaultItem?: Partial<Equipement>;
    characterForce: number;
}

export const MainsNuesTable: React.FC<MainsNuesTableProps> = ({ items, onItemsChange, referenceOptions, defaultItem, characterForce }) => {

    const handleAddRow = () => {
        const newItem: Equipement = {
            id: uuidv4(),
            refId: 0,
            originalRefId: 0,
            nom: '',
            poids: 0,
            esquive_bonus: 0,
            degats_pr: '',
            equipement_type: 'MainsNues',
            equipe: true,
            modif_pi: '',
            bonus_fo: 0,
            rupture: '',
            modif_rupture: '',
            ...defaultItem
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
                        degats_pr: refItem.degats_pr,
                        // Attempt to extract rupture/details from raw if standard fields don't have it
                        rupture: refItem.rupture || refItem.raw.details?.rupture || '',
                        description: refItem.description,
                        char_values: refItem.raw.caracteristiques // Copy base characteristics
                    };
                }
                return item;
            }));
        } else {
            // Reset to default if cleared
            onItemsChange(items.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        refId: 0,
                        nom: '', // Keep empty or reset to 'Main nue'? 'Main nue' is default but user cleared it... maybe empty is better interaction
                        poids: 0,
                        esquive_bonus: 0,
                        degats_pr: '',
                        rupture: '',
                        modif_pi: '',
                        bonus_fo: 0,
                        modif_rupture: '',
                        description: ''
                    };
                }
                return item;
            }));
        }
    };

    const handleUpdateField = (id: string, field: keyof Equipement, value: any) => {
        onItemsChange(items.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };


    const calculateTotal = (degats: string, refPi: number, modif: string, bonusFo: number): string => {
        if (!degats) return '';

        // 1. Separate Dice from Degats (ignoring internal bonuses as we now have explicit PI)
        let dicePart = degats;

        // 2. Parse modif_pi
        let modifVal = 0;
        if (modif) {
            const parsedModif = parseInt(modif);
            if (!isNaN(parsedModif)) {
                modifVal = parsedModif;
            }
        }

        // 3. Calculate Total PI
        const totalPi = (refPi || 0) + modifVal + (bonusFo || 0);

        // 4. Format
        if (totalPi > 0) {
            return `${dicePart} + ${totalPi}`;
        } else if (totalPi < 0) {
            return `${dicePart} - ${Math.abs(totalPi)}`;
        }
        return dicePart;
    };

    // Helper to get Ref PI
    const getRefPi = (refId: number): number => {
        const r = referenceOptions.find(o => o.id === refId);
        return r ? r.pi : 0;
    };

    const getRefRupture = (refId: number): string => {
        const r = referenceOptions.find(o => o.id === refId);
        return r ? r.rupture : '';
    };

    const getRefDescription = (refId: number): string => {
        const r = referenceOptions.find(o => o.id === refId);
        return r ? r.description : '';
    };

    const getRefCategory = (refId: number): string => {
        const r = referenceOptions.find(o => o.id === refId);
        return r ? r.category : '';
    };

    return (
        <div className="mb-6 p-4 bg-parchment/50 rounded-lg border-2 border-leather shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4 border-b border-leather/30 pb-2">
                <h3 className="text-xl font-bold text-leather-dark font-serif tracking-wide">Mains Nues</h3>
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
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="text-sm font-serif font-bold text-leather uppercase tracking-wider border-b-2 border-leather">
                            <th className="p-2 w-16">N°</th>
                            <th className="p-2 w-16">ID</th>
                            <th className="p-2 w-24">Type</th>
                            <th className="p-2 w-48">Nom</th>
                            <th className="p-2 w-24">Dégâts</th>
                            <th className="p-2 w-20">Modif (PI)</th>
                            <th className="p-2 w-20">Bonus FO</th>
                            <th className="p-2 w-32">Total</th>
                            <th className="p-2 w-24">Rupture</th>
                            <th className="p-2 w-20">Modif (Rup)</th>
                            <th className="p-2">Effet</th>
                            <th className="p-2 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="text-ink">
                        {items.map((item, index) => {
                            // Calculate Bonus FO
                            const itemForceBonus = item.char_values?.force || 0;
                            const totalForce = characterForce + itemForceBonus;
                            const bonusFo = Math.max(0, totalForce - 12);

                            return (
                                <tr key={item.id} className="border-b border-leather-light/30 hover:bg-leather/5">
                                    <td className="p-2 font-bold text-leather-dark">M{index + 1}</td>
                                    <td className="p-2 text-xs text-ink-light">{item.refId || '-'}</td>
                                    <td className="p-2 text-sm italic">{(() => {
                                        const r = referenceOptions.find(o => o.id === item.refId);
                                        return r?.item_type || getRefCategory(item.refId) || item.equipement_type;
                                    })()}</td>
                                    <td className="p-2 w-48 max-w-[12rem]">
                                        <SearchableSelect
                                            options={referenceOptions.map(r => ({ id: r.id, label: r.nom }))}
                                            value={item.refId}
                                            onChange={(val) => handleSelectChange(item.id, val)}
                                            className="w-full"
                                        />
                                    </td>
                                    <td className="p-2">
                                        {/* Display Dice + Base PI (e.g. "1D + 3") */}
                                        {(() => {
                                            const pi = getRefPi(item.refId);
                                            const dice = item.degats_pr;
                                            if (pi > 0 && dice) return `${dice} + ${pi}`;
                                            if (pi < 0 && dice) return `${dice} - ${Math.abs(pi)}`;
                                            if (pi !== 0 && !dice) return `${pi}`;
                                            return dice;
                                        })()}
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.modif_pi || ''}
                                            onChange={(e) => handleUpdateField(item.id, 'modif_pi', e.target.value)}
                                            className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-center"
                                            placeholder="+0"
                                        />
                                    </td>
                                    <td className="p-2 text-center text-ink-light font-mono">
                                        {/* Display computed Bonus FO */}
                                        {bonusFo > 0 ? `+${bonusFo}` : '0'}
                                    </td>
                                    <td className="p-2 font-bold text-leather">
                                        {calculateTotal(item.degats_pr, getRefPi(item.refId), item.modif_pi || '', bonusFo)}
                                    </td>
                                    <td className="p-2">{getRefRupture(item.refId) || '-'}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.modif_rupture || ''}
                                            onChange={(e) => handleUpdateField(item.id, 'modif_rupture', e.target.value)}
                                            className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-center"
                                            placeholder="+0"
                                        />
                                    </td>
                                    <td className="p-2 text-sm max-w-[150px] truncate" title={getRefDescription(item.refId)}>
                                        {getRefDescription(item.refId) || ''}
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => handleRemoveRow(item.id)}
                                            className="text-red-600 hover:text-red-800 font-bold"
                                        >
                                            &times;
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
