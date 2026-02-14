import React from 'react';
import { Sac, RefEquipement } from '../../../types';
import { getItemWeight, getMaxRuptureOptions } from '../../../utils/sacUtils';
import { SmartInput } from '../../Shared/SmartInput';
import { Tooltip } from '../../Shared/Tooltip';

interface SacTableProps {
    items: Sac[];
    onItemsChange: (items: Sac[]) => void;
    referenceOptions: RefEquipement[];
}

// Memoized Row Component
const SacRow = React.memo(({ item, referenceOptions, onUpdateQuantity, onRemove, onUpdateNotes, onUpdateField, onHover, onLeave }: {
    item: Sac,
    referenceOptions: RefEquipement[],
    onUpdateQuantity: (uid: string, qty: number) => void,
    onRemove: (uid: string) => void,
    onUpdateNotes?: (uid: string, notes: string) => void,
    onUpdateField: (uid: string, field: keyof Sac, value: any) => void,
    onHover: (e: React.MouseEvent, title: string, content: string) => void,
    onLeave: () => void
}) => {
    const refItem = referenceOptions.find(r => r.id === item.refId);
    const effect = refItem?.effet || (refItem as any)?.details?.effet;
    const unitWeight = getItemWeight(refItem);
    const totalItemWeight = unitWeight * (item.quantite ?? 1);
    const displayRefId = refItem?.ref_id || '-';

    // Determine category from RefItem (or fallback to 'Sacs' if mismatch)
    const category = refItem?.category || 'Divers';
    const catLower = category.toLowerCase();

    // Field Visibility Logic
    const showEtat = ['accessoires', 'armes', 'armes_de_jet', 'munitions', 'objets_speciaux', 'outils', 'pieges', 'protections', 'sacoches', 'poches', 'sacs'].includes(catLower);
    const showModRupt = ['accessoires', 'armes', 'armes_de_jet', 'munitions', 'objets_speciaux', 'outils', 'pieges', 'protections', 'sacoches', 'poches', 'sacs'].includes(catLower);
    const showModProts = ['accessoires', 'protections'].includes(catLower);
    const showCharges = ['objets_magiques'].includes(catLower);

    // Local state for notes removed in favor of SmartInput

    return (
        <tr className="border-b border-leather/10 hover:bg-leather/5 transition-colors text-sm">
            {/* ID */}
            <td className="p-2 text-center font-mono text-xs text-ink-light align-top pt-3">
                {displayRefId}
            </td>

            {/* Objet + Notes */}
            <td className="p-2 align-top pt-2">
                <div
                    className={`font-bold text-leather ${effect ? 'cursor-help' : ''} inline-block`}
                    onMouseEnter={(e) => {
                        if (effect && onHover) onHover(e, refItem?.nom || 'Objet', effect);
                    }}
                    onMouseMove={(e) => {
                        if (effect && onHover) onHover(e, refItem?.nom || 'Objet', effect);
                    }}
                    onMouseLeave={onLeave}
                >
                    {refItem?.nom || 'Objet inconnu'}
                </div>
                {/* Notes Field */}
                {catLower === 'bouffes' && onUpdateNotes && (
                    <div className="mt-1">
                        <SmartInput
                            type="text"
                            placeholder="Notes..."
                            value={item.notes || ''}
                            onCommit={(val) => onUpdateNotes(item.uid, String(val))}
                            className="text-xs text-ink bg-input-bg border-b border-leather/20 focus:border-leather outline-none italic w-full placeholder-leather/30 font-serif"
                        />
                    </div>
                )}
            </td>

            {/* Etat */}
            <td className="p-2 text-center align-top pt-2">
                {showEtat ? (
                    <select
                        value={item.etat || 'Intact'}
                        onChange={(e) => onUpdateField(item.uid, 'etat', e.target.value)}
                        className="w-full min-w-[80px] p-1 bg-input-bg text-ink border-b border-leather-light focus:border-leather outline-none text-xs text-center"
                    >
                        <option value="Intact">Intact</option>
                        <option value="Endommagé">Endommagé</option>
                        <option value="Cassé">Cassé</option>
                    </select>
                ) : <span className="text-gray-300">-</span>}
            </td>

            {/* Mod Rupt */}
            <td className="p-2 text-center align-top pt-2">
                {showModRupt ? (
                    <select
                        value={item.modif_rupture || 0}
                        onChange={(e) => onUpdateField(item.uid, 'modif_rupture', parseInt(e.target.value) || 0)}
                        className="w-12 bg-input-bg text-ink border-b border-leather/20 text-center focus:border-leather outline-none text-xs"
                    >
                        {getMaxRuptureOptions(refItem?.rupture || (refItem as any)?.details?.rupture).map(opt => (
                            <option key={opt} value={opt}>+{opt}</option>
                        ))}
                    </select>
                ) : <span className="text-gray-300">-</span>}
            </td>

            {/* Mod Protections (Sol/Mag/Spe) */}
            <td className="p-2 text-center align-top pt-2">
                {showModProts ? (
                    <div className="flex flex-col gap-1">
                        <SmartInput
                            type="number"
                            title="Modif PR Solide"
                            placeholder="Sol."
                            value={item.modif_pr_sol || ''}
                            onCommit={(val) => onUpdateField(item.uid, 'modif_pr_sol', Number(val))}
                            className="w-12 bg-input-bg text-ink border-b border-leather/20 text-center focus:border-leather outline-none text-xs"
                        />
                        <SmartInput
                            type="number"
                            title="Modif PR Magique"
                            placeholder="Mag."
                            value={item.modif_pr_mag || ''}
                            onCommit={(val) => onUpdateField(item.uid, 'modif_pr_mag', Number(val))}
                            className="w-12 bg-input-bg text-ink border-b border-leather/20 text-center focus:border-leather outline-none text-xs"
                        />
                        <SmartInput
                            type="number"
                            title="Modif PR Spéciale"
                            placeholder="Spé."
                            value={item.modif_pr_spe || ''}
                            onCommit={(val) => onUpdateField(item.uid, 'modif_pr_spe', Number(val))}
                            className="w-12 bg-input-bg text-ink border-b border-leather/20 text-center focus:border-leather outline-none text-xs"
                        />
                    </div>
                ) : <span className="text-gray-300">-</span>}
            </td>

            {/* Charges */}
            {/* Charges */}
            <td className="p-2 text-center align-top pt-2">
                {showCharges ? (
                    <SmartInput
                        type="number"
                        value={item.charges || 0}
                        onCommit={(val) => onUpdateField(item.uid, 'charges', Number(val))}
                        className="w-12 bg-input-bg text-ink border-b border-leather/20 text-center focus:border-leather outline-none text-xs"
                        placeholder="0"
                    />
                ) : <span className="text-gray-300">-</span>}
            </td>


            {/* Poids Unit */}
            <td className="p-2 text-center text-ink-light align-top pt-3">
                {unitWeight > 0 ? `${unitWeight} g` : '-'}
            </td>

            {/* Qté */}
            <td className="p-2 text-center align-top pt-2">
                <SmartInput
                    type="number"
                    min={0}
                    value={item.quantite || 0}
                    onCommit={(val) => onUpdateQuantity(item.uid, Number(val))}
                    className="w-10 bg-input-bg text-ink border-b border-leather/20 text-center focus:border-leather outline-none font-medium text-xs"
                />
            </td>

            {/* Poids Total */}
            <td className="p-2 text-center font-medium align-top pt-3 text-leather">
                {totalItemWeight > 0 ? `${totalItemWeight} g` : '-'}
            </td>

            {/* Action */}
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

    const handleUpdateField = React.useCallback((uid: string, field: keyof Sac, value: any) => {
        onItemsChange(items.map(item => {
            if (item.uid === uid) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    }, [items, onItemsChange]);

    // Tooltip state lifted to Table
    const [tooltipState, setTooltipState] = React.useState<{ visible: boolean, x: number, y: number, title: string, content: string }>({
        visible: false, x: 0, y: 0, title: '', content: ''
    });

    const handleItemHover = React.useCallback((e: React.MouseEvent, title: string, content: string) => {
        setTooltipState({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            title,
            content
        });
    }, []);

    const handleItemLeave = React.useCallback(() => {
        setTooltipState(prev => ({ ...prev, visible: false }));
    }, []);

    let activeTooltip = null;
    if (tooltipState.visible) {
        activeTooltip = (
            <Tooltip visible={true} position={{ x: tooltipState.x, y: tooltipState.y }} title={tooltipState.title} requireCtrl={true}>
                {tooltipState.content}
            </Tooltip>
        );
    }


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
                            <th className="p-2 w-3/12">Objet</th>
                            <th className="p-2 w-1/12 text-center">Etat</th>
                            <th className="p-2 w-1/12 text-center">Mod(R)</th>
                            <th className="p-2 w-1/12 text-center">Mod(P)</th>
                            <th className="p-2 w-1/12 text-center">Ch.</th>
                            <th className="p-2 w-1/12 text-center">Pds U.</th>
                            <th className="p-2 w-1/12 text-center">Qté</th>
                            <th className="p-2 w-1/12 text-center">Total</th>
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
                                        <td colSpan={10} className="px-4 py-1.5 font-bold text-leather-dark uppercase text-xs tracking-wider border-y border-leather/20">
                                            {category}
                                        </td>
                                    </tr>
                                    {/* Items in Category */}
                                    {categoryItems.map(item => (
                                        <SacRow
                                            key={item.uid}
                                            item={item}
                                            referenceOptions={referenceOptions}
                                            onUpdateQuantity={(uid, qty) => handleUpdateField(uid, 'quantite', qty)}
                                            onRemove={handleRemoveRow}
                                            onUpdateNotes={onUpdateNotes}
                                            onUpdateField={handleUpdateField}
                                            onHover={handleItemHover}
                                            onLeave={handleItemLeave}
                                        />
                                    ))}
                                </tbody>
                            );
                        });
                    })()}
                </table>
            )}
            {activeTooltip}
        </div>
    );
};
