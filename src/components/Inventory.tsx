import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Equipement, RefEquipement } from '../types';
import { MainsNuesTable } from './MainsNuesTable';
import { ArmesTable } from './ArmesTable';
import { ProtectionsTable } from './ProtectionsTable';
import { AccessoiresTable } from './AccessoiresTable';
import { v4 as uuidv4 } from 'uuid';

interface InventoryProps {
    inventory: Equipement[];
    onInventoryChange: (items: Equipement[]) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ inventory, onInventoryChange }) => {
    const [refs, setRefs] = useState<RefEquipement[]>([]);

    // Derived state for sections
    const mainsNues = inventory.filter(i => i.equipement_type === 'MainsNues');
    const armes = inventory.filter(i => i.equipement_type === 'Arme');
    const protections = inventory.filter(i => i.equipement_type === 'Armure');
    const accessoires = inventory.filter(i => i.equipement_type === 'Autre');

    useEffect(() => {
        // Fetch Reference Data from Supabase
        const fetchRefs = async () => {
            // Use invoke instead of direct Supabase if we are moving to local only? 
            // The instructions said "local SQLite". 
            // The existing code uses `supabase.from('ref_items')`. 
            // We should switch to a Tauri command `get_ref_equipements`.
            // There is already a `get_ref_equipements` in commands.rs!
            // Let's use that one.

            // ... oh wait, the previous code was IMPORTING supabase. 
            // I should switch to `invoke('get_ref_equipements')`.

            /*
             const { data, error } = await supabase
                 .from('ref_items')
                 .select('*')
                 .range(0, 10000)
                 .order('category')
                 .order('nom');
              */

            // Re-writing to use invoke
            try {
                const data = await invoke('get_ref_equipements') as any[]; // Type assertion for now
                const mappedRefs: RefEquipement[] = data.map((row: any) => ({
                    id: row.id,
                    ref_id: row.id, // ID is the ref_id locally
                    category: row.category,
                    nom: row.nom,
                    poids: row.poids,
                    pi: row.pi,
                    rupture: row.rupture,
                    esquive_bonus: row.esquive_bonus,
                    degats_pr: row.degats_pr,
                    pr_mag: row.pr_mag,
                    pr_spe: row.pr_spe,
                    item_type: row.item_type,
                    description: row.description,
                    raw: row
                }));
                setRefs(mappedRefs);
            } catch (err) {
                console.error("Failed to fetch equipment refs:", err);
            }
        };

        fetchRefs();
    }, []);

    // Helper to create default item
    const createDefaultItem = (type: 'Armure' | 'Arme' | 'Sac' | 'Autre' | 'MainsNues'): Equipement => {
        const base: Equipement = {
            id: uuidv4(),
            refId: 0,
            originalRefId: 0,
            nom: '',
            poids: 0,
            esquive_bonus: 0,
            degats_pr: '',
            equipement_type: type,
            equipe: true
        };

        if (type === 'MainsNues') {
            return {
                ...base,
                nom: 'Main nue',
                modif_pi: '',
                bonus_fo: 0,
                rupture: '',
                modif_rupture: ''
            };
        }
        return base;
    };

    // Ensure at least one item per category on mount/update
    // We use a safe check that only updates if absolutely necessary and strictly checks counts
    useEffect(() => {
        const counts = {
            MainsNues: inventory.filter(i => i.equipement_type === 'MainsNues').length,
            Arme: inventory.filter(i => i.equipement_type === 'Arme').length,
            Armure: inventory.filter(i => i.equipement_type === 'Armure').length,
            Autre: inventory.filter(i => i.equipement_type === 'Autre').length
        };

        let newItems: Equipement[] = [];

        if (counts.MainsNues === 0) newItems.push(createDefaultItem('MainsNues'));
        if (counts.Arme === 0) newItems.push(createDefaultItem('Arme'));
        if (counts.Armure === 0) newItems.push(createDefaultItem('Armure'));
        if (counts.Autre === 0) newItems.push(createDefaultItem('Autre'));

        if (newItems.length > 0) {
            // Only update if we are adding items.
            // This prevents the loop IF the added items are correctly recognized next render.
            // Based on previous bug, ensure types are EXACT matches.
            onInventoryChange([...inventory, ...newItems]);
        }
    }, [inventory]); // Removing onInventoryChange from dep array to avoid unstable reference loop, though React usually handles strict mode

    const updateSection = (newSectionItems: Equipement[], sectionType: string) => {
        let itemsToSet = newSectionItems;

        // If user removed the last item, immediately replace with default
        if (itemsToSet.length === 0) {
            const type = sectionType === 'MainsNues' ? 'MainsNues' :
                sectionType === 'Armes' ? 'Arme' :
                    sectionType === 'Armure' ? 'Armure' : 'Autre';
            itemsToSet = [createDefaultItem(type as any)];
        }

        let otherItems: Equipement[] = [];

        if (sectionType === 'MainsNues') {
            otherItems = inventory.filter(i => i.equipement_type !== 'MainsNues');
        } else if (sectionType === 'Armes') {
            otherItems = inventory.filter(i => i.equipement_type !== 'Arme');
        } else if (sectionType === 'Armure') {
            otherItems = inventory.filter(i => i.equipement_type !== 'Armure');
        } else if (sectionType === 'Autre') {
            otherItems = inventory.filter(i => i.equipement_type !== 'Autre');
        }

        onInventoryChange([...otherItems, ...itemsToSet]);
    };

    return (
        <div className="md:p-4 text-ink">
            <h2 className="text-2xl font-serif font-bold text-ink-header drop-shadow-sm mb-4 border-b border-leather pb-2">Inventaire</h2>

            <div className="grid grid-cols-1 gap-8">
                {/* Mains Nues takes full width now due to many columns */}
                <MainsNuesTable
                    items={mainsNues}
                    onItemsChange={(items) => updateSection(items, 'MainsNues')}
                    referenceOptions={refs.filter(r => r.category === 'Mains_nues' || r.category === 'Main nue')}
                    defaultItem={{ nom: 'Main nue' }}
                />

                <div className="grid grid-cols-1 gap-8">

                    <ArmesTable
                        items={armes}
                        onItemsChange={(items) => updateSection(items, 'Armes')}
                        referenceOptions={refs.filter(r => r.category === 'Armes')}
                        defaultItem={{ equipement_type: 'Arme' }}
                    />

                    <ProtectionsTable
                        items={protections}
                        onItemsChange={(items) => updateSection(items, 'Armure')}
                        referenceOptions={refs.filter(r => r.category === 'Protections')}
                        defaultItem={{ equipement_type: 'Armure' }}
                    />

                    <AccessoiresTable
                        items={accessoires}
                        onItemsChange={(items) => updateSection(items, 'Autre')}
                        referenceOptions={refs.filter(r => r.category === 'Accessoires')}
                        defaultItem={{ equipement_type: 'Autre' }}
                    />
                </div>
            </div>

        </div>
    );
};
