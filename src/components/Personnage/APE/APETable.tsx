import React, { useMemo } from 'react';
import { ApeEntry } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { SearchableSelect } from '../../Shared/SearchableSelect';
import { APE_DATA } from '../../../data/apeData';
import { getApeOriginKey } from '../../../utils/apeUtils';

interface APETableProps {
    items: ApeEntry[];
    onItemsChange: (items: ApeEntry[]) => void;
    origin: string;
}

export const APETable: React.FC<APETableProps> = ({ items, onItemsChange, origin }) => {

    const handleAddRow = () => {
        const newItem: ApeEntry = {
            uid: uuidv4(),
            id: 0,
            niveau: 0
        };
        onItemsChange([...items, newItem]);
    };

    const handleRemoveRow = (uid: string) => {
        onItemsChange(items.filter(item => item.uid !== uid));
    };

    const handleSelectChange = (uid: string, idStr: string) => {
        const id = parseInt(idStr);
        // Valid id check
        const isValid = APE_DATA.some(r => r.id === id);

        onItemsChange(items.map(item => item.uid === uid ? {
            ...item,
            id: isValid ? id : 0
        } : item));
    };

    const handleNiveauChange = (uid: string, value: number) => {
        onItemsChange(items.map(item => item.uid === uid ? {
            ...item,
            niveau: value
        } : item));
    };

    // Sorted options for the select
    const apeOptions = useMemo(() => {
        return [...APE_DATA]
            .sort((a, b) => a.id - b.id)
            .map(r => ({ id: r.id, label: r.id.toString() }));
    }, []);

    const getOriginContent = (id: number) => {
        const refItem = APE_DATA.find(r => r.id === id);
        if (!refItem) return null;

        const originKey = getApeOriginKey(origin);
        // @ts-ignore
        return refItem[originKey] || refItem['humain'];
    };

    return (
        <div className="mb-6 p-4 bg-parchment/30 rounded border border-leather/20">
            <div className="flex justify-between items-center mb-2 border-b border-leather/20 pb-1">
                <h3 className="font-bold text-leather uppercase">Aptitudes Parfois Étranges (APE)</h3>
                <button
                    onClick={handleAddRow}
                    className="px-2 py-0.5 bg-leather text-parchment rounded hover:bg-leather-dark transition-colors font-bold"
                    title="Ajouter une ligne"
                >
                    +
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="text-xs font-bold text-leather uppercase tracking-wider border-b border-leather/20">
                            <th className="p-2 w-20 text-center">N°</th>
                            <th className="p-2">Description</th>
                            <th className="p-2 w-32">Épreuve</th>
                            <th className="p-2 w-32 border-l border-leather/10 pl-4">Bonus/Malus</th>
                            <th className="p-2 w-20 text-center">NB</th>
                            <th className="p-2 w-8"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-4 text-center italic text-leather/50">
                                    Aucune aptitude ajoutée. Cliquez sur + pour commencer.
                                </td>
                            </tr>
                        )}
                        {items.map((item) => {
                            const originContent = getOriginContent(item.id);

                            // Determine Active Bonus Text
                            let activeBonus = "-";
                            if (originContent) {
                                if (item.niveau === 1) activeBonus = originContent.bonus1;
                                else if (item.niveau === 2) activeBonus = originContent.bonus2;
                                else if (item.niveau === 3) activeBonus = originContent.bonus3;
                            }

                            return (
                                <tr key={item.uid} className="border-b border-leather/10 hover:bg-leather/5 transition-colors">
                                    <td className="p-2">
                                        <SearchableSelect
                                            options={apeOptions}
                                            value={item.id || ''}
                                            onChange={(val) => handleSelectChange(item.uid, val)}
                                            className="w-full text-center font-bold"
                                            placeholder="-"
                                            disableSort={true}
                                        />
                                    </td>
                                    <td className="p-2 align-middle">
                                        <div className="font-serif">
                                            {originContent ? originContent.nom : <span className="text-leather/40 italic">Sélectionnez un N°...</span>}
                                        </div>
                                    </td>
                                    <td className="p-2 align-middle font-bold text-leather-dark">
                                        {originContent ? originContent.epreuve : '-'}
                                    </td>
                                    <td className="p-2 align-middle border-l border-leather/10 pl-4">
                                        <div className={`font-bold ${item.niveau > 0 ? 'text-leather-dark' : 'text-leather/40'}`}>
                                            {activeBonus}
                                        </div>
                                    </td>
                                    <td className="p-2 align-middle">
                                        <select
                                            value={item.niveau}
                                            onChange={(e) => handleNiveauChange(item.uid, parseInt(e.target.value))}
                                            className="w-full bg-parchment/50 border-b border-leather/20 text-center focus:border-leather outline-none font-bold text-leather cursor-pointer appearance-none py-1 hover:bg-leather/5 rounded transition-colors"
                                        >
                                            <option value={0}>0</option>
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                        </select>
                                    </td>
                                    <td className="p-2 text-center align-middle">
                                        <button
                                            onClick={() => handleRemoveRow(item.uid)}
                                            className="text-red-500 hover:text-red-700 font-bold px-2 py-1 hover:bg-red-100 rounded transition-colors"
                                            title="Supprimer"
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
