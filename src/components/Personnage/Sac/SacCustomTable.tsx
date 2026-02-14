import React from 'react';
import { CustomSacItem } from '../../../types';
import { SmartInput } from '../../Shared/SmartInput';
import { v4 as uuidv4 } from 'uuid';

interface SacCustomTableProps {
    items: CustomSacItem[];
    onItemsChange: (items: CustomSacItem[]) => void;
}

const SacCustomRow = React.memo(({ item, onUpdate, onRemove }: {
    item: CustomSacItem,
    onUpdate: (uid: string, field: keyof CustomSacItem, value: any) => void,
    onRemove: (uid: string) => void
}) => {
    // Local states removed in favor of SmartInput

    return (
        <tr className="border-b border-leather/10 hover:bg-leather/5 transition-colors">
            <td className="p-2 align-top pt-2">
                <SmartInput
                    type="text"
                    value={item.nom}
                    onCommit={(val) => onUpdate(item.uid, 'nom', String(val))}
                    className="w-full bg-transparent border-b border-leather/20 focus:border-leather outline-none font-bold text-leather"
                    placeholder="Nom de l'objet..."
                />
            </td>
            <td className="p-2 text-center align-top pt-2">
                <SmartInput
                    type="number"
                    min={0}
                    value={item.poids}
                    onCommit={(val) => onUpdate(item.uid, 'poids', Number(val))}
                    className="w-16 text-center bg-transparent border-b border-leather/20 focus:border-leather outline-none font-medium text-ink-light"
                    placeholder="Poids"
                />
            </td>
            <td className="p-2 text-center align-top pt-2">
                <SmartInput
                    type="number"
                    min={0}
                    value={item.quantite}
                    onCommit={(val) => onUpdate(item.uid, 'quantite', Number(val))}
                    className="w-12 text-center bg-transparent border-b border-leather/20 focus:border-leather outline-none font-medium"
                    placeholder="Qté"
                />
            </td>
            <td className="p-2 text-center font-medium text-leather align-top pt-3">
                {(item.quantite * item.poids).toFixed(1)} g
            </td>
            <td className="p-2 text-center align-top pt-2">
                <button
                    onClick={() => onRemove(item.uid)}
                    className="text-red-500 hover:text-red-700 font-bold p-1 hover:bg-red-50 rounded"
                    title="Retirer"
                >
                    &times;
                </button>
            </td>
        </tr>
    );
});

export const SacCustomTable: React.FC<SacCustomTableProps> = ({ items, onItemsChange }) => {

    const handleAddRow = () => {
        const newItem: CustomSacItem = {
            uid: uuidv4(),
            nom: "",
            quantite: 1,
            poids: 0
        };
        onItemsChange([...items, newItem]);
    };

    const handleRemoveRow = (uid: string) => {
        onItemsChange(items.filter(item => item.uid !== uid));
    };

    const handleUpdate = (uid: string, field: keyof CustomSacItem, value: any) => {
        onItemsChange(items.map(item => {
            if (item.uid === uid) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    return (
        <div className="mb-6 p-4 bg-parchment/30 rounded border border-leather/20">
            <div className="flex justify-between items-center mb-2 border-b border-leather/20 pb-1">
                <h3 className="font-bold text-leather uppercase text-lg">Contenu Supplémentaire</h3>
                <button
                    onClick={handleAddRow}
                    className="px-2 py-0.5 bg-leather text-parchment rounded hover:bg-leather-dark transition-colors font-bold"
                    title="Ajouter une ligne"
                >
                    +
                </button>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-4 text-ink-light italic opacity-70 text-sm">
                    Aucun objet supplémentaire.
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs font-bold text-leather uppercase tracking-wider border-b border-leather/20">
                            <th className="p-2 w-1/2">Objet</th>
                            <th className="p-2 w-1/6 text-center">Poids Unit.</th>
                            <th className="p-2 w-1/6 text-center">Qté</th>
                            <th className="p-2 w-1/6 text-center">Poids Total</th>
                            <th className="p-2 w-8"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <SacCustomRow
                                key={item.uid}
                                item={item}
                                onUpdate={handleUpdate}
                                onRemove={handleRemoveRow}
                            />
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
