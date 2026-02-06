import React from 'react';
import { Sac, RefEquipement, CustomSacItem } from '../../../types';
import { useRefContext } from '../../../context/RefContext';
import { SacTable } from './SacTable';
import { SacDetails } from './SacDetails';
import { SacItemSelector } from './SacItemSelector';
import { SacCustomTable } from './SacCustomTable';
import { v4 as uuidv4 } from 'uuid';
import { getItemWeight } from '../../../utils/sacUtils';

interface SacPanelProps {
    inventory: Sac[];
    onInventoryChange: (items: Sac[]) => void;
    customItems: CustomSacItem[];
    onCustomItemsChange: (items: CustomSacItem[]) => void;
}

export const SacPanel: React.FC<SacPanelProps> = ({ inventory, onInventoryChange, customItems, onCustomItemsChange }) => {
    const { refs } = useRefContext();

    // 1. Filter items belonging to the "Sac" tab (equipement_type === 'Sacs')
    const sacItems = (inventory || []).filter(i => i.equipement_type === 'Sacs');
    const otherItems = (inventory || []).filter(i => i.equipement_type !== 'Sacs');

    // 2. Distinguish "Backpack" (Category = 'Sacs') vs "Content" (Everything else in Sacs)
    // We assume the FIRST item with category 'Sacs' is the equipped backpack.
    const backpack = sacItems.find(i => {
        const ref = refs.find(r => r.id === i.refId);
        return ref?.category === 'Sacs';
    });
    // If found, cast to Sac type for internal use (it should match anyway)
    const backpackAsSac = backpack as unknown as Sac;

    // Content is everything in 'Sacs' that is NOT the specific backpack item
    const sacContentItems = backpack
        ? sacItems.filter(i => i.uid !== backpack.uid)
        : sacItems;

    // Handle Content Updates (Add/Remove items in table)
    const handleContentChange = (newContentItems: Sac[]) => {
        // newContentItems are 'Sacs'. We merge them + backpack (if exists) + otherItems
        const newSacList = [...newContentItems];
        if (backpack) {
            newSacList.push(backpackAsSac);
        }

        // Combine with items from other tabs
        onInventoryChange([...otherItems, ...newSacList]);
    };

    // Handle Backpack Update (Select/Change bag)
    const handleBackpackChange = (newBackpack: Sac | undefined) => {
        // Start with current content
        const newSacList = [...sacContentItems];

        // Add new backpack if defined
        if (newBackpack) {
            // Ensure type is 'Sacs'
            const backpackWithCorrectType: Sac = { ...newBackpack, equipement_type: 'Sacs' };
            newSacList.push(backpackWithCorrectType);
        }

        // Combine with items from other tabs
        onInventoryChange([...otherItems, ...newSacList]);
    };

    // Handle Adding Item via Selector
    const handleAddItem = (refItem: RefEquipement) => {
        // Check if item exists in CONTENT (not backpack itself)
        const existingItem = sacContentItems.find(i => i.refId === refItem.id);

        let newContentList: Sac[];

        if (existingItem) {
            // Increment quantity
            newContentList = sacContentItems.map(i =>
                i.uid === existingItem.uid
                    ? { ...i, quantite: (i.quantite || 1) + 1 }
                    : i
            );
        } else {
            // Add new item
            const newItem: Sac = {
                uid: uuidv4(),
                id: '',
                refId: refItem.id,
                quantite: 1,
                equipement_type: 'Sacs'
            };
            newContentList = [...sacContentItems, newItem];
        }

        handleContentChange(newContentList as Sac[]);
    };

    // Handle Note Updates
    const handleUpdateNotes = (uid: string, notes: string) => {
        const newSacList = sacContentItems.map(item =>
            item.uid === uid ? { ...item, notes } : item
        );
        handleContentChange(newSacList as Sac[]);
    };

    // Calculate Standard Content Weight
    const standardContentWeight = sacContentItems.reduce((acc, item) => {
        const refItem = refs.find(r => r.id === item.refId);
        const unitWeight = getItemWeight(refItem);
        return acc + (unitWeight * (item.quantite ?? 1));
    }, 0);

    // Calculate Custom Content Weight
    const customContentWeight = (customItems || []).reduce((acc, item) => {
        return acc + (item.poids * item.quantite);
    }, 0);

    const totalWeight = standardContentWeight + customContentWeight;

    // Optimize: Memoize filtered references
    const backpackRefOptions = React.useMemo(() => refs.filter(r => r.category === 'Sacs'), [refs]);
    const contentRefOptions = React.useMemo(() => refs.filter(r => r.category !== 'Mains_nues'), [refs]);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-parchment/50 p-4 rounded-lg border border-leather/10 shadow-sm">
                <h2 className="text-2xl font-bold text-leather mb-2">Gestion du Sac</h2>
                <p className="text-ink-light text-sm italic mb-4">
                    Sélectionnez votre sac à dos et gérez son contenu.
                </p>

                <SacDetails
                    sac={backpackAsSac}
                    onSacChange={handleBackpackChange}
                    // Filter: ONLY 'Sacs' category for the Backpack Selector
                    referenceOptions={backpackRefOptions}
                    currentTotalWeight={totalWeight}
                />

                <SacItemSelector
                    referenceOptions={contentRefOptions}
                    onAddItem={handleAddItem}
                />

                <SacTable
                    items={sacContentItems as Sac[]}
                    onItemsChange={handleContentChange}
                    onUpdateNotes={handleUpdateNotes}
                    // Filter: All items EXCEPT 'Mains_nues' for the Content Table
                    referenceOptions={contentRefOptions}
                />

                <SacCustomTable
                    items={customItems || []}
                    onItemsChange={onCustomItemsChange}
                />
            </div>
        </div>
    );
};
