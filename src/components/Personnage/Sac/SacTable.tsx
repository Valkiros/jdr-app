import React from 'react';
import { Sac, RefEquipement } from '../../../types';
import { getItemWeight } from '../../../utils/sacUtils';

interface SacTableProps {
    items: Sac[];
    onItemsChange: (items: Sac[]) => void;
    referenceOptions: RefEquipement[];
}

// Memoized Row Component
const SacRow = React.memo(({ item, referenceOptions, onUpdateQuantity, onRemove, onUpdateNotes }: {
    item: Sac,
    referenceOptions: RefEquipement[],
    onUpdateQuantity: (uid: string, qty: number) => void,
    onRemove: (uid: string) => void,
    onUpdateNotes?: (uid: string, notes: string) => void
}) => {
    const refItem = referenceOptions.find(r => r.id === item.refId);
    const unitWeight = getItemWeight(refItem);
    const totalItemWeight = unitWeight * (item.quantite ?? 1);
    const displayRefId = refItem?.ref_id || '-';

    // Check if category allows notes (case insensitive just in case)
    const isFood = refItem?.category?.toLowerCase() === 'bouffes';

    // Local state for notes to avoid re-renders on every keystroke
    const [localNotes, setLocalNotes] = React.useState(item.notes || '');

    // Sync local state if item.notes changes externally
    React.useEffect(() => {
        setLocalNotes(item.notes || '');
    }, [item.notes]);

    const handleNotesBlur = () => {
        if (onUpdateNotes && localNotes !== item.notes) {
            onUpdateNotes(item.uid, localNotes);
        }
    };

    return (
        <tr className="border-b border-leather/10 hover:bg-leather/5 transition-colors">
            <td className="p-2 text-center font-mono text-xs text-ink-light">
                {displayRefId}
            </td>
            <td className="p-2">
                <div className="font-bold text-leather">
                    {refItem?.nom || 'Objet inconnu'}
                </div>
                {refItem?.effet && (
                    <div className="text-xs text-ink-light italic mt-1 ml-2 border-l-2 border-leather/20 pl-2">
                        {refItem.effet}
                    </div>
                )}
                {isFood && onUpdateNotes && (
                    <div className="mt-1 ml-2">
                        <input
                            type="text"
                            placeholder="Notes..."
                            value={localNotes}
                            onChange={(e) => setLocalNotes(e.target.value)}
                            onBlur={handleNotesBlur}
                            className="text-xs text-ink bg-transparent border-b border-leather/20 focus:border-leather outline-none italic w-full placeholder-leather/30 font-serif"
                        />
                    </div>
                )}
            </td>
            <td className="p-2 text-center text-ink-light align-top pt-3">
                {unitWeight > 0 ? `${unitWeight} g` : '-'}
            </td>
            <td className="p-2 text-center align-top pt-2">
                <input
                    type="number"
                    min="0"
                    value={item.quantite || ''}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onUpdateQuantity(item.uid, isNaN(val) ? 0 : val);
                    }}
                    className="w-12 bg-transparent border-b border-leather/20 text-center focus:border-leather outline-none font-medium"
                />
            </td>
            <td className="p-2 text-center font-medium align-top pt-3 text-leather">
                {totalItemWeight > 0 ? `${totalItemWeight} g` : '-'}
            </td>
            <td className="p-2 text-center align-top pt-2">
                <button
                    onClick={() => onRemove(item.uid)}
                    className="text-red-500 hover:text-red-700 font-bold p-1 hover:bg-red-50 rounded"
                    title="Jeter"
                >
                    &times;
                </button>
            </td>
        </tr>
    );
});

export const SacTable: React.FC<SacTableProps & { onUpdateNotes?: (uid: string, notes: string) => void }> = ({ items, onItemsChange, referenceOptions, onUpdateNotes }) => {

    const handleRemoveRow = React.useCallback((uid: string) => {
        onItemsChange(items.filter(item => item.uid !== uid));
    }, [items, onItemsChange]);

    const handleUpdateQuantity = React.useCallback((uid: string, qty: number) => {
        onItemsChange(items.map(item => {
            if (item.uid === uid) {
                return { ...item, quantite: qty };
            }
            return item;
        }));
    }, [items, onItemsChange]);


    return (
        <div className="mb-6 p-4 bg-parchment/30 rounded border border-leather/20">
            <div className="flex justify-between items-center mb-4 border-b border-leather/20 pb-2">
                <div className="flex items-baseline gap-4">
                    <h3 className="font-bold text-leather uppercase text-lg">Contenu du Sac</h3>
                </div>
                {/* Add Button removed, now handled by SacItemSelector */}
            </div>

            {items.length === 0 ? (
                <div className="text-center py-8 text-ink-light italic opacity-70">
                    Le sac est vide. Sélectionnez une catégorie ci-dessus pour ajouter des objets.
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs font-bold text-leather uppercase tracking-wider border-b border-leather/20">
                            <th className="p-2 w-1/12 text-center">ID</th>
                            <th className="p-2 w-5/12">Objet</th>
                            <th className="p-2 w-1/12 text-center">Poids Unit.</th>
                            <th className="p-2 w-1/12 text-center">Qté</th>
                            <th className="p-2 w-2/12 text-center">Poids Total</th>
                            <th className="p-2 w-1/12 text-center"></th>
                        </tr>
                    </thead>
                    {/* Grouping Logic */}
                    {(() => {
                        // 1. Group items by Category
                        const groupedItems: Record<string, Sac[]> = {};

                        items.forEach(item => {
                            const ref = referenceOptions.find(r => r.id === item.refId);
                            const category = ref?.category || 'Divers';
                            if (!groupedItems[category]) {
                                groupedItems[category] = [];
                            }
                            groupedItems[category].push(item);
                        });

                        // 2. Sort Categories Alphabetically
                        const sortedCategories = Object.keys(groupedItems).sort();

                        // 3. Render Groups
                        return sortedCategories.map(category => {
                            // Sort items within category by Name
                            const categoryItems = groupedItems[category].sort((a, b) => {
                                const refA = referenceOptions.find(r => r.id === a.refId);
                                const refB = referenceOptions.find(r => r.id === b.refId);
                                return (refA?.nom || '').localeCompare(refB?.nom || '');
                            });

                            return (
                                <tbody key={category}>
                                    {/* Category Header Row */}
                                    <tr className="bg-leather/5">
                                        <td colSpan={6} className="px-4 py-1.5 font-bold text-leather-dark uppercase text-xs tracking-wider border-y border-leather/20">
                                            {category}
                                        </td>
                                    </tr>
                                    {/* Items in Category */}
                                    {categoryItems.map(item => (
                                        <SacRow
                                            key={item.uid}
                                            item={item}
                                            referenceOptions={referenceOptions}
                                            onUpdateQuantity={handleUpdateQuantity}
                                            onRemove={handleRemoveRow}
                                            onUpdateNotes={onUpdateNotes}
                                        />
                                    ))}
                                </tbody>
                            );
                        });
                    })()}
                </table>
            )}
        </div>
    );
};
