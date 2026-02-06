import React, { useState, useEffect } from 'react';
import { CustomSacItem } from '../../../types';
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
    // Local state to prevent re-renders on every keystroke
    const [localNom, setLocalNom] = useState(item.nom);
    const [localQuantite, setLocalQuantite] = useState(item.quantite === 0 ? '' : item.quantite.toString());
    const [localPoids, setLocalPoids] = useState(item.poids === 0 ? '' : item.poids.toString());

    // Sync from parent if changed externally
    useEffect(() => { setLocalNom(item.nom); }, [item.nom]);
    useEffect(() => { setLocalQuantite(item.quantite === 0 ? '' : item.quantite.toString()); }, [item.quantite]);
    useEffect(() => { setLocalPoids(item.poids === 0 ? '' : item.poids.toString()); }, [item.poids]);

    const handleBlurNom = () => {
        if (localNom !== item.nom) {
            onUpdate(item.uid, 'nom', localNom);
        }
    };

    const handleBlurQuantite = () => {
        const val = parseInt(localQuantite) || 0;
        if (val !== item.quantite) {
            onUpdate(item.uid, 'quantite', val);
        }
    };

    const handleBlurPoids = () => {
        const val = parseFloat(localPoids) || 0;
        if (val !== item.poids) {
            onUpdate(item.uid, 'poids', val);
        }
    };

    return (
        <tr className="border-b border-leather/10 hover:bg-leather/5 transition-colors">
            <td className="p-2 align-top pt-2">
                <input
                    type="text"
                    value={localNom}
                    onChange={(e) => setLocalNom(e.target.value)}
                    onBlur={handleBlurNom}
                    className="w-full bg-transparent border-b border-leather/20 focus:border-leather outline-none font-bold text-leather"
                    placeholder="Nom de l'objet..."
                />
            </td>
            <td className="p-2 text-center align-top pt-2">
                <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={localPoids}
                    onChange={(e) => setLocalPoids(e.target.value)}
                    onBlur={handleBlurPoids}
                    className="w-16 text-center bg-transparent border-b border-leather/20 focus:border-leather outline-none font-medium text-ink-light"
                    placeholder="Poids"
                />
            </td>
            <td className="p-2 text-center align-top pt-2">
                <input
                    type="number"
                    min="0"
                    value={localQuantite}
                    onChange={(e) => setLocalQuantite(e.target.value)}
                    onBlur={handleBlurQuantite}
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
