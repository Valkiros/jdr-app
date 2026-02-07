import React, { useState } from 'react';
import { Sac, RefEquipement } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { SearchableSelect } from '../../Shared/SearchableSelect';
import { Tooltip } from '../../Shared/Tooltip';

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
                equipement_type: 'Sacs',
                etat: 'Intact',
                modif_rupture: 0
            };
            onSacChange(newItem);
        }
    };

    const refItem = sac ? referenceOptions.find(r => r.id === sac.refId) : undefined;

    // Determine capacity: Check details.capacite
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

    // Tooltip state
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const handleMouseEnter = (e: React.MouseEvent) => {
        if (refItem?.effet) {
            setShowTooltip(true);
            setTooltipPos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (showTooltip) {
            setTooltipPos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseLeave = () => {
        setShowTooltip(false);
    };

    return (
        <div className="bg-parchment/30 rounded border border-leather/20 p-4 mb-6">
            <h3 className="font-bold text-leather uppercase text-lg mb-3">Sac à dos équipé</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                    onMouseEnter={handleMouseEnter}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="relative"
                >
                    <label className="block text-xs font-bold text-leather uppercase mb-1">Modèle de sac</label>
                    <SearchableSelect
                        options={referenceOptions.map(r => ({ id: r.id, label: r.nom }))}
                        value={sac?.refId || ''}
                        onChange={handleSelectChange}
                        className="w-full"
                        placeholder="Choisir un sac à dos..."
                    />
                    <Tooltip visible={showTooltip} position={tooltipPos} title={refItem?.nom} requireCtrl={true}>
                        {refItem?.effet}
                    </Tooltip>
                </div>

                <div className="flex flex-col justify-end">
                    <div className="text-sm p-2 bg-input-bg rounded border border-leather/10">
                        <div className="grid grid-cols-5 gap-2 items-end">
                            {/* Etat */}
                            <div className="col-span-1">
                                <span className="font-bold text-leather text-xs block mb-1">Etat:</span>
                                <select
                                    value={sac?.etat || 'Intact'}
                                    onChange={(e) => sac && onSacChange({ ...sac, etat: e.target.value })}
                                    className="w-full p-1 bg-transparent border-b border-leather-light focus:border-leather outline-none text-xs"
                                >
                                    <option value="Intact">Intact</option>
                                    <option value="Endommagé">Endommagé</option>
                                    <option value="Cassé">Cassé</option>
                                </select>
                            </div>

                            {/* Rupture */}
                            <div className="col-span-1 border-l border-leather/10 pl-2">
                                <span className="font-bold text-leather text-xs block mb-1">Rupture:</span>
                                <span className="text-ink">{(refItem as any)?.details?.rupture || '-'}</span>
                            </div>

                            {/* Modif Rupture */}
                            <div className="col-span-1 border-r border-leather/10 pr-2">
                                <span className="font-bold text-leather text-xs block mb-1">Modif (rupt.):</span>
                                <input
                                    type="number"
                                    value={sac?.modif_rupture || ''}
                                    onChange={(e) => sac && onSacChange({ ...sac, modif_rupture: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-transparent border-b border-leather/20 focus:border-leather outline-none text-center text-xs"
                                    placeholder="+0"
                                />
                            </div>

                            {/* Capacité */}
                            <div className="col-span-1 text-center">
                                <span className="font-bold text-leather text-xs block mb-1">Capacité:</span>
                                <span className="text-ink">{capacity || '0'}</span>
                            </div>

                            {/* Poids */}
                            <div className="col-span-1 text-right">
                                <span className="font-bold text-leather text-xs block mb-1">Poids:</span>
                                <span className={`font-bold ${weightColorClass} text-xs`}>
                                    {currentTotalWeight.toFixed(1)} g
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
