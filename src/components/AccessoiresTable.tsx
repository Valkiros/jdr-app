import React from 'react';
import { Equipement, RefEquipement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SearchableSelect } from './SearchableSelect';

interface AccessoiresTableProps {
    items: Equipement[];
    onItemsChange: (items: Equipement[]) => void;
    referenceOptions: RefEquipement[];
    defaultItem?: Partial<Equipement>;
}

export const AccessoiresTable: React.FC<AccessoiresTableProps> = ({ items, onItemsChange, referenceOptions, defaultItem }) => {

    const handleAddRow = () => {
        const newItem: Equipement = {
            id: uuidv4(),
            refId: 0,
            originalRefId: 0,
            nom: '',
            poids: 0,
            esquive_bonus: 0,
            degats_pr: '',
            equipement_type: 'Autre',
            equipe: true,
            rupture: '',
            modif_rupture: '',
            description: '',
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
                        rupture: refItem.rupture || refItem.raw.details?.rupture || '',
                        description: refItem.description,
                        modif_pr_sol: '',
                        modif_pr_spe: '',
                        modif_pr_mag: '',
                        modif_rupture: ''
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
                        nom: '',
                        poids: 0,
                        esquive_bonus: 0,
                        degats_pr: '',
                        rupture: '',
                        modif_pr_sol: '',
                        modif_pr_spe: '',
                        modif_pr_mag: '',
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

    // Helper functions
    const getRefValue = (refId: number, field: keyof RefEquipement): any => {
        const r = referenceOptions.find(o => o.id === refId);
        return r ? r[field] : '';
    };

    return (
        <div className="mb-6 p-4 bg-parchment/50 rounded-lg border-2 border-leather shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4 border-b border-leather/30 pb-2">
                <h3 className="text-xl font-bold text-leather-dark font-serif tracking-wide">Accessoires</h3>
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
                <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                        <tr className="text-sm font-serif font-bold text-leather uppercase tracking-wider border-b-2 border-leather">
                            <th className="p-2 w-12">ID</th>
                            <th className="p-2 w-24">Type</th>
                            <th className="p-2 w-48">Nom</th>

                            <th className="p-2 w-16 text-center">Pr Sol</th>
                            <th className="p-2 w-16 text-center">Mod</th>

                            <th className="p-2 w-16 text-center">Pr Spé</th>
                            <th className="p-2 w-16 text-center">Mod</th>

                            <th className="p-2 w-16 text-center">Pr Mag</th>
                            <th className="p-2 w-16 text-center">Mod</th>

                            <th className="p-2 w-20 text-center">Rupture</th>
                            <th className="p-2 w-16 text-center">Mod</th>
                            <th className="p-2">Effet</th>
                            <th className="p-2 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="text-ink">
                        {items.map((item) => {
                            const refRupture = getRefValue(item.refId, 'rupture');
                            // Use degats_pr for PR Sol as per ProtectionsTable logic if that's where it's stored?
                            // Wait, in ProtectionsTable: degats_pr: refItem.degats_pr, // This is PR Sol for armors
                            // Let's verify if Accessoires use degats_pr for PR Sol or if they use pr_sol field directly?
                            // In seeds.rs: degats_pr = item.degats.or(item.pr).unwrap_or_default();
                            // In Accessoires, "pr_sol": "0". "pr" alias is "pr_sol".
                            // So degats_pr holds Pr Sol.
                            const basePrSol = getRefValue(item.refId, 'degats_pr');
                            const basePrSpe = getRefValue(item.refId, 'pr_spe');
                            const basePrMag = getRefValue(item.refId, 'pr_mag');

                            return (
                                <tr key={item.id} className="border-b border-leather-light/30 hover:bg-leather/5">
                                    <td className="p-2 text-xs text-ink-light">{item.refId || '-'}</td>
                                    <td className="p-2 text-sm italic">{getRefValue(item.refId, 'item_type') || item.equipement_type}</td>
                                    <td className="p-2 w-48 max-w-[12rem]">
                                        <SearchableSelect
                                            options={referenceOptions.map(r => ({ id: r.id, label: r.nom }))}
                                            value={item.refId}
                                            onChange={(val) => handleSelectChange(item.id, val)}
                                            className="w-full"
                                            direction="up" // Force open upwards
                                        />
                                    </td>

                                    {/* PR Solide */}
                                    <td className="p-2 text-center">{basePrSol || '-'}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.modif_pr_sol || ''}
                                            onChange={(e) => handleUpdateField(item.id, 'modif_pr_sol', e.target.value)}
                                            className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-center"
                                            placeholder="+0"
                                        />
                                    </td>

                                    {/* PR Spéciale */}
                                    <td className="p-2 text-center">{basePrSpe || '-'}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.modif_pr_spe || ''}
                                            onChange={(e) => handleUpdateField(item.id, 'modif_pr_spe', e.target.value)}
                                            className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-center"
                                            placeholder="+0"
                                        />
                                    </td>

                                    {/* PR Magique */}
                                    <td className="p-2 text-center">{basePrMag || '-'}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.modif_pr_mag || ''}
                                            onChange={(e) => handleUpdateField(item.id, 'modif_pr_mag', e.target.value)}
                                            className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-center"
                                            placeholder="+0"
                                        />
                                    </td>

                                    {/* Rupture */}
                                    <td className="p-2 text-center">{refRupture || '-'}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            value={item.modif_rupture || ''}
                                            onChange={(e) => handleUpdateField(item.id, 'modif_rupture', e.target.value)}
                                            className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-center"
                                            placeholder="+0"
                                        />
                                    </td>

                                    <td className="p-2 text-sm max-w-[200px] truncate" title={getRefValue(item.refId, 'description')}>
                                        {getRefValue(item.refId, 'description') || ''}
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
