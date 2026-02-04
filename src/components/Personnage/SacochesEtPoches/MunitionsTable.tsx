import React from 'react';
import { Equipement, RefEquipement } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { SearchableSelect } from '../../Shared/SearchableSelect';

interface MunitionsTableProps {
    items: Equipement[];
    onItemsChange: (items: Equipement[]) => void;
    referenceOptions: RefEquipement[];
}

export const MunitionsTable: React.FC<MunitionsTableProps> = ({ items, onItemsChange, referenceOptions }) => {

    const handleAddRow = () => {
        const newItem: Equipement = {
            uid: uuidv4(),
            id: '',
            refId: 0,
            equipement_type: 'Munitions',
            modif_rupture: 0,
            // @ts-ignore
            quantite: undefined
        };
        onItemsChange([...items, newItem]);
    };

    const handleRemoveRow = (uid: string) => {
        onItemsChange(items.filter(item => item.uid !== uid));
    };

    const handleSelectChange = (uid: string, refIdStr: string) => {
        const refId = parseInt(refIdStr);
        const refItem = referenceOptions.find(r => r.id === refId);
        if (refItem) {
            onItemsChange(items.map(item => item.uid === uid ? { ...item, refId: refItem.id } : item));
        } else {
            onItemsChange(items.map(item => item.uid === uid ? { ...item, refId: 0, modif_rupture: 0 } : item));
        }
    };

    const handleUpdateField = (uid: string, field: string, value: any) => {
        onItemsChange(items.map(item => item.uid === uid ? { ...item, [field]: value } : item));
    };

    const getRefValue = (refId: number, key: string, subKey?: string) => {
        const r = referenceOptions.find(o => o.id === refId);
        if (!r) return '';
        if (subKey && r.raw && r.raw.details) return r.raw.details[subKey];
        if (subKey && (r as any)[key]) return (r as any)[key][subKey];
        return (r as any)[key] || '';
    };

    return (
        <div className="mb-6 p-4 bg-parchment/30 rounded border border-leather/20">
            <div className="flex justify-between items-center mb-2 border-b border-leather/20 pb-1">
                <h3 className="font-bold text-leather uppercase">Munitions</h3>
                <button onClick={handleAddRow} className="px-2 py-0.5 bg-leather text-parchment rounded hover:bg-leather-dark transition-colors font-bold">+</button>
            </div>
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-xs font-bold text-leather uppercase tracking-wider border-b border-leather/20">
                        <th className="p-2 w-16 text-center">Qté</th>
                        <th className="p-2 w-1/3">Nom</th>
                        <th className="p-2 text-left">Effet</th>
                        <th className="p-2 w-16 text-center">Rupture</th>
                        <th className="p-2 w-16 text-center">Modif</th>
                        <th className="p-2 w-8"></th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {items.map(item => {
                        const refItem = referenceOptions.find(r => r.id === item.refId);
                        return (
                            <tr key={item.uid} className="border-b border-leather/10 hover:bg-leather/5">
                                <td className="p-2">
                                    <input
                                        type="number"
                                        // @ts-ignore
                                        value={item.quantite ?? ''}
                                        onChange={(e) => handleUpdateField(item.uid, 'quantite', e.target.value === '' ? undefined : parseInt(e.target.value))}
                                        className="w-full bg-transparent border-b border-leather/20 text-center focus:border-leather outline-none font-bold"
                                        placeholder="0"
                                    />
                                </td>
                                <td className="p-2">
                                    <SearchableSelect
                                        options={referenceOptions.map(r => ({ id: r.id, label: r.nom }))}
                                        value={item.refId}
                                        onChange={(val) => handleSelectChange(item.uid, val)}
                                        className="w-full"
                                    />
                                </td>
                                <td className="p-2 italic text-ink-light truncate max-w-[200px]" title={refItem?.effet || getRefValue(item.refId, 'details', 'effet')}>
                                    {refItem?.effet || getRefValue(item.refId, 'details', 'effet') || '-'}
                                </td>
                                <td className="p-2 text-center text-ink-light">
                                    {refItem?.rupture || getRefValue(item.refId, 'details', 'rupture') || '-'}
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        value={item.modif_rupture || ''}
                                        onChange={(e) => handleUpdateField(item.uid, 'modif_rupture', parseInt(e.target.value) || 0)}
                                        className="w-full bg-transparent border-b border-leather/20 text-center focus:border-leather outline-none"
                                        placeholder="+0"
                                    />
                                </td>
                                <td className="p-2 text-center">
                                    <button onClick={() => handleRemoveRow(item.uid)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
