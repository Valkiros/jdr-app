import React from 'react';
import { Equipement, RefEquipement } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { SearchableSelect } from '../../Shared/SearchableSelect';
import { SmartInput } from '../../Shared/SmartInput';
import { calculateFinalRupture, getMaxRuptureOptions } from '../../../utils/sacUtils';

interface ArmesDeJetTableProps {
    items: Equipement[];
    onItemsChange: (items: Equipement[]) => void;
    referenceOptions: RefEquipement[];
    characterForce: number;
}

export const ArmesDeJetTable: React.FC<ArmesDeJetTableProps> = ({ items, onItemsChange, referenceOptions, characterForce }) => {

    const handleAddRow = () => {
        const newItem: Equipement = {
            uid: uuidv4(),
            id: '',
            refId: 0,
            equipement_type: 'Armes_de_jet',
            etat: 'Intact',
            modif_pi: 0,
            modif_rupture: 0,
            quantite: 1
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
            onItemsChange(items.map(item => item.uid === uid ? { ...item, refId: 0, modif_pi: 0, modif_rupture: 0 } : item));
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

    const calculateTotal = (dice: string, refPi: number, modif: number, bonusFo: number) => {
        const totalPi = (refPi || 0) + (modif || 0) + (bonusFo || 0);
        if (totalPi > 0) return `${dice} + ${totalPi}`;
        if (totalPi < 0) return `${dice} - ${Math.abs(totalPi)}`;
        return dice;
    };

    return (
        <div className="mb-6 p-4 bg-parchment/30 rounded border border-leather/20">
            <div className="flex justify-between items-center mb-2 border-b border-leather/20 pb-1">
                <h3 className="font-bold text-leather uppercase">Armes de Jet</h3>
                <button onClick={handleAddRow} className="px-2 py-0.5 bg-leather text-parchment rounded hover:bg-leather-dark transition-colors font-bold">+</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="text-xs font-bold text-leather uppercase tracking-wider border-b border-leather/20">
                            <th className="p-2 w-16 text-center">Qté</th>
                            <th className="p-2 w-48">Nom</th>
                            <th className="p-2 w-24">Dégâts</th>
                            <th className="p-2 w-16">Modif PI</th>
                            <th className="p-2 w-16">Bonus FO</th>
                            <th className="p-2 w-24">Total</th>
                            <th className="p-2 w-16">Portée</th>
                            <th className="p-2">Effet</th>
                            <th className="p-2 w-28 text-center">Etat</th>
                            <th className="p-2 w-16 text-center">Rupture</th>
                            <th className="p-2 w-16 text-center">Modif</th>
                            <th className="p-2 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {items.map(item => {
                            const refItem = referenceOptions.find(r => r.id === item.refId);
                            // Fix: Handle case where degats is an object {degats: "...", pi: ...} or string
                            let degatsStr = '-';
                            if (refItem?.degats) {
                                if (typeof refItem.degats === 'object') {
                                    // @ts-ignore
                                    degatsStr = refItem.degats.degats || '-';
                                } else {
                                    degatsStr = refItem.degats;
                                }
                            }
                            const refPi = refItem?.pi || 0;
                            // Bonus FO logic (Force Equipped - 12)
                            // Normally Bonus FO uses total character force.
                            // const itemForceBonus = refItem?.force || 0; // if provided in ref
                            const bonusFo = Math.max(0, characterForce - 12);

                            return (
                                <tr key={item.uid} className="border-b border-leather/10 hover:bg-leather/5">
                                    <td className="p-2">
                                        <SmartInput
                                            type="number"
                                            value={item.quantite || 1}
                                            onCommit={(val) => handleUpdateField(item.uid, 'quantite', Number(val))}
                                            className="w-full bg-input-bg text-ink border-b border-leather/20 text-center focus:border-leather outline-none"
                                        // min={1}
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
                                    <td className="p-2 text-ink-light">
                                        {degatsStr} {refPi !== 0 ? `(${refPi > 0 ? '+' : ''}${refPi})` : ''}
                                    </td>
                                    <td className="p-2">
                                        <SmartInput
                                            type="number"
                                            value={item.modif_pi || 0}
                                            onCommit={(val) => handleUpdateField(item.uid, 'modif_pi', Number(val))}
                                            className="w-full bg-input-bg text-ink border-b border-leather/20 text-center focus:border-leather outline-none"
                                            placeholder="+0"
                                        />
                                    </td>
                                    <td className="p-2 text-center text-ink-light">
                                        {bonusFo > 0 ? `+${bonusFo}` : '0'}
                                    </td>
                                    <td className="p-2 font-bold text-leather">
                                        {calculateTotal(degatsStr, refPi, item.modif_pi || 0, bonusFo)}
                                    </td>
                                    <td className="p-2 text-center text-ink-light">
                                        {refItem?.portee || getRefValue(item.refId, 'details', 'portee') || '-'}
                                    </td>
                                    <td className="p-2 italic text-ink-light truncate max-w-[150px]" title={refItem?.effet || getRefValue(item.refId, 'details', 'effet')}>
                                        {refItem?.effet || getRefValue(item.refId, 'details', 'effet') || '-'}
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={item.etat || 'Intact'}
                                            onChange={(e) => handleUpdateField(item.uid, 'etat', e.target.value)}
                                            className="w-full p-1 bg-input-bg text-ink border-b border-leather-light focus:border-leather outline-none text-sm text-center"
                                        >
                                            <option value="Intact">Intact</option>
                                            <option value="Endommagé">Endommagé</option>
                                            <option value="Cassé">Cassé</option>
                                        </select>
                                    </td>
                                    <td className="p-2 text-center text-ink-light">
                                        {calculateFinalRupture(refItem?.rupture || getRefValue(item.refId, 'details', 'rupture'), item.modif_rupture)}
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={item.modif_rupture || 0}
                                            onChange={(e) => handleUpdateField(item.uid, 'modif_rupture', parseInt(e.target.value) || 0)}
                                            className="w-full bg-input-bg text-ink border-b border-leather/20 text-center focus:border-leather outline-none text-sm"
                                        >
                                            {getMaxRuptureOptions(refItem?.rupture || getRefValue(item.refId, 'details', 'rupture')).map(opt => (
                                                <option key={opt} value={opt}>+{opt}</option>
                                            ))}
                                        </select>
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
        </div>
    );
};
