import React from 'react';
import { Sac, RefEquipement } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { SearchableSelect } from '../../Shared/SearchableSelect';

interface SacDetailsProps {
    sac: Sac | undefined;
    onSacChange: (item: Sac | undefined) => void;
    referenceOptions: RefEquipement[];
    currentTotalWeight: number;
}

export const SacDetails: React.FC<SacDetailsProps> = ({
    sac,
    onSacChange,
    referenceOptions,
    currentTotalWeight
}) => {

    const handleSelectChange = (refIdStr: string) => {
        const refId = parseInt(refIdStr);
        if (!refId) {
            onSacChange(undefined);
            return;
        }

        const refItem = referenceOptions.find(r => r.id === refId);
        if (refItem) {
            const newItem: Sac = {
                uid: sac?.uid || uuidv4(),
                id: '',
                refId: refItem.id,
                equipement_type: 'Sacs'
            };
            onSacChange(newItem);
        }
    };

    const refItem = sac ? referenceOptions.find(r => r.id === sac.refId) : undefined;

    // Determine opacity/red color logic
    // We try to use 'capacite' first, fallback to 'places' if that's what is used for limit
    // Assuming capacite is the boolean/weight comparison target
    // Determine capacity: Check top-level 'capacite', then 'places', then deep 'details'
    // Determine capacity: Check top-level 'capacite', then 'places', then deep 'details' (legacy), then direct 'details' (from Rust)
    const capacityRaw = refItem
        ? (
            (refItem as any).details?.capacite ||
            0
        )
        : 0;
    // ensure capacity is number
    const capacity = typeof capacityRaw === 'string' ? parseInt(capacityRaw) : capacityRaw;

    const isOverloaded = refItem && capacity > 0 && currentTotalWeight >= capacity;
    const isWarning = refItem && capacity > 0 && !isOverloaded && currentTotalWeight >= (0.9 * capacity);

    let weightColorClass = 'text-ink';
    if (isOverloaded) weightColorClass = 'text-red-600 font-bold';
    else if (isWarning) weightColorClass = 'text-orange-600 font-bold';

    return (
        <div className="bg-parchment/30 rounded border border-leather/20 p-4 mb-6">
            <h3 className="font-bold text-leather uppercase text-lg mb-3">Sac à dos équipé</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-leather uppercase mb-1">Modèle de sac</label>
                    <SearchableSelect
                        options={referenceOptions.map(r => ({ id: r.id, label: r.nom }))}
                        value={sac?.refId || ''}
                        onChange={handleSelectChange}
                        className="w-full"
                        placeholder="Choisir un sac à dos..."
                    />
                </div>

                <div className="flex flex-col justify-end">
                    <div className="text-sm p-2 bg-input-bg rounded border border-leather/10">
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <span className="font-bold text-leather text-xs block">Rupture:</span>
                                <span className="text-ink">{refItem?.rupture || '-'}</span>
                            </div>
                            <div>
                                <span className="font-bold text-leather text-xs block">Capacité:</span>
                                <span className="text-ink">{capacity || '0'}</span>
                            </div>
                            <div>
                                <span className="font-bold text-leather text-xs block">Poids Contenu:</span>
                                <span className={`font-bold ${weightColorClass}`}>
                                    {currentTotalWeight.toFixed(2)} g
                                </span>
                            </div>
                        </div>
                        {refItem?.effet && (
                            <div className="mt-2 text-xs italic text-ink-light border-t border-leather/10 pt-1">
                                {refItem.effet}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
