import React from 'react';
import { Equipement, RefEquipement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SearchableSelect } from './SearchableSelect';

interface ArmesTableProps {
    items: Equipement[];
    onItemsChange: (items: Equipement[]) => void;
    referenceOptions: RefEquipement[];
    defaultItem?: Partial<Equipement>;
    characterForce: number;
    onRemove?: (uid: string) => void;
}

export const ArmesTable: React.FC<ArmesTableProps> = ({ items, onItemsChange, referenceOptions, defaultItem, characterForce, onRemove }) => {

    const handleAddRow = () => {
        const newItem: Equipement = {
            uid: uuidv4(),
            id: '',
            refId: 0,
            equipement_type: 'Armes',
            modif_pi: 0,
            modif_rupture: 0,
            modif_pr_sol: 0,
            modif_pr_mag: 0,
            modif_pr_spe: 0,
            ...defaultItem
        };
        onItemsChange([...items, newItem]);
    };

    const handleRemoveRow = (uid: string) => {
        if (onRemove) {
            onRemove(uid);
        } else {
            onItemsChange(items.filter(item => item.uid !== uid));
        }
    };

    const handleRemoveLastRow = () => {
        if (items.length > 0) {
            onItemsChange(items.slice(0, -1));
        }
    };

    const handleSelectChange = (uid: string, refIdStr: string) => {
        const refId = parseInt(refIdStr);
        const refItem = referenceOptions.find(r => r.id === refId);

        if (refItem) {
            onItemsChange(items.map(item => {
                if (item.uid === uid) {
                    return {
                        ...item,
                        refId: refItem.id,
                        // Removed redundant fields
                    };
                }
                return item;
            }));
        } else {
            // Reset to default if cleared
            onItemsChange(items.map(item => {
                if (item.uid === uid) {
                    return {
                        ...item,
                        refId: 0,
                        modif_pi: 0,
                        modif_rupture: 0
                    };
                }
                return item;
            }));
        }
    };

    const handleUpdateField = (uid: string, field: keyof Equipement, value: any) => {
        onItemsChange(items.map(item => {
            if (item.uid === uid) {
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
        const totalPi = parseInt(String(refPi || 0), 10) + modifVal + (bonusFo || 0);

        // 4. Format
        if (totalPi > 0) {
            return `${dicePart} + ${totalPi}`;
        } else if (totalPi < 0) {
            return `${dicePart} - ${Math.abs(totalPi)}`;
        }
        return dicePart;
    };

    // --- Fonctions Utilitaires ---

    // Récupère une valeur dans la base de référence pour un ID donné.
    // C'est grâce à ça que l'affichage reste à jour même si la base change.
    const getRefPi = (refId: number): number => {
        const r = referenceOptions.find(o => o.id === refId);
        return r?.pi || 0;
    };

    const getRefRupture = (refId: number): string => {
        const r = referenceOptions.find(o => o.id === refId);
        return r?.rupture || '';
    };

    const getRefEffet = (refId: number): string => {
        const r = referenceOptions.find(o => o.id === refId);
        return r?.raw.details?.effet || '';
    };

    const getRefCategory = (refId: number): string => {
        const r = referenceOptions.find(o => o.id === refId);
        return r ? r.category : '';
    };

    const getRefValue = (refId: number, field: keyof RefEquipement): any => {
        const r = referenceOptions.find(o => o.id === refId);
        return r ? r[field] : '';
    };

    return (
        <div className="mb-6 p-4 bg-parchment/50 rounded-lg border-2 border-leather shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4 border-b border-leather/30 pb-2">
                <h3 className="text-xl font-bold text-leather-dark font-serif tracking-wide">Armes</h3>
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
                            return (
                                <tr key={item.uid} className="border-b border-leather-light/30 hover:bg-leather/5">
                                    <td className="p-2 font-bold text-leather-dark">A{index + 1}</td>
                                    {/* Display Ref ID (Supabase) if available, or just '-' */}
                                    <td className="p-2 text-xs text-ink-light">{getRefValue(item.refId, 'ref_id') || '-'}</td>
                                    <td className="p-2 text-sm italic">{(() => {
                                        const r = referenceOptions.find(o => o.id === item.refId);
                                        return r?.type || getRefCategory(item.refId) || item.equipement_type;
                                    })()}</td>
                                    <td className="p-2 w-48 max-w-[12rem]">
                                        <SearchableSelect
                                            options={referenceOptions.map(r => ({ id: r.id, label: r.nom }))}
                                            value={item.refId}
                                            onChange={(val) => handleSelectChange(item.uid, val)}
                                            className="w-full"
                                        />
                                    </td>
                                    <td className="p-2">
                                        {/* Display Dice + Base PI (e.g. "1D + 3") */}
                                        {(() => {
                                            const pi = getRefPi(item.refId);
                                            const r = referenceOptions.find(o => o.id === item.refId);
                                            // Ensure degats is fetched correctly (it might be nested or direct depending on final mock)
                                            // Based on Inventory mapping: degats_pr = (protections.pr_sol || degats.degats).
                                            // But here we need just the dice part for display?
                                            // Or we just display the string 'degats_pr' from ref?
                                            // The previous code displayed 'item.degats_pr'.
                                            // Now we must get it from ref.
                                            // Let's use a helper or direct access.
                                            const dice = r?.degats || '';

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
                                            onChange={(e) => handleUpdateField(item.uid, 'modif_pi', parseInt(e.target.value) || 0)}
                                            className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-center"
                                            placeholder="+0"
                                        />
                                    </td>
                                    <td className="p-2 text-center text-ink-light font-mono">
                                        {(() => {
                                            const r = referenceOptions.find(o => o.id === item.refId);
                                            // Access nested caracs safely
                                            const itemForceBonus = parseInt(String(r?.raw.caracteristiques?.force || 0), 10);
                                            const totalForce = parseInt(String(characterForce), 10) + itemForceBonus;
                                            const bonusFo = Math.max(0, totalForce - 12);
                                            return bonusFo > 0 ? `+${bonusFo}` : '0';
                                        })()}
                                    </td>
                                    <td className="p-2 font-bold text-leather">
                                        {(() => {
                                            const r = referenceOptions.find(o => o.id === item.refId);
                                            const degats = r?.degats || ''; // Use mapped value
                                            const refPi = r?.pi || 0;

                                            const itemForceBonus = parseInt(String(r?.raw.caracteristiques?.force || 0), 10);
                                            const totalForce = parseInt(String(characterForce), 10) + itemForceBonus;
                                            const bonusFo = Math.max(0, totalForce - 12);

                                            return calculateTotal(degats, refPi, String(item.modif_pi || 0), bonusFo);
                                        })()}
                                    </td>
                                    <td className="p-2">{getRefRupture(item.refId) || '-'}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.modif_rupture || ''}
                                            onChange={(e) => handleUpdateField(item.uid, 'modif_rupture', parseInt(e.target.value) || 0)}
                                            className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-center"
                                            placeholder="+0"
                                        />
                                    </td>
                                    <td className="p-2 text-sm max-w-[150px] truncate" title={getRefEffet(item.refId)}>
                                        {getRefEffet(item.refId) || ''}
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => handleRemoveRow(item.uid)}
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
