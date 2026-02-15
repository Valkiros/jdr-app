import React, { useEffect, useMemo } from 'react';
import { Equipement, RefEquipement } from '../../../types';
import { useRefContext } from '../../../context/RefContext';
import { MainsNuesTable } from './MainsNuesTable';
import { ArmesTable } from './ArmesTable';
import { ProtectionsTable } from './ProtectionsTable';
import { AccessoiresTable } from './AccessoiresTable';

interface InventoryProps {
    inventory: Equipement[];
    onInventoryChange: (items: Equipement[]) => void;
    characterForce: number;
    bouclierActif: boolean;
}

export const Inventory: React.FC<InventoryProps> = ({ inventory, onInventoryChange, characterForce, bouclierActif }) => {
    const { refs: rawRefs } = useRefContext();

    const refs = useMemo(() => {
        return rawRefs.map((row: any) => {
            // Extract data from nested JSON objects
            const details = row.details || {};
            const caracs = row.caracteristiques || {};
            const protections = row.protections || {};
            const degats = row.degats || {};
            const prix = row.prix_info || {};
            const craft = row.craft || {};

            return {
                id: row.id,
                ref_id: row.ref_id,
                category: row.category,
                nom: row.nom,

                // Degats fields required by updated RefEquipement
                pi: parseInt(String(degats.pi || 0), 10),
                degats: degats.degats || 0,

                // Caracs fields required by updated RefEquipement
                courage: caracs.courage || 0,
                intelligence: caracs.intelligence || 0,
                charisme: caracs.charisme || 0,
                adresse: caracs.adresse || 0,
                force: caracs.force || 0,
                perception: caracs.perception || 0,
                esquive: caracs.esquive || 0,
                attaque: caracs.attaque || 0,
                parade: caracs.parade || 0,
                mag_psy: caracs.mag_psy || 0,
                mag_phy: caracs.mag_phy || 0,
                rm: caracs.rm || 0,
                mvt: caracs.mvt || 0,
                discretion: caracs.discretion || 0,

                // Protections fields required by updated RefEquipement
                pr_sol: parseInt(String(protections.pr_sol || 0), 10),
                pr_mag: parseInt(String(protections.pr_mag || 0), 10),
                pr_spe: parseInt(String(protections.pr_spe || 0), 10),
                pluie: parseInt(String(protections.pluie || 0), 10),
                froid: parseInt(String(protections.froid || 0), 10),
                chaleur: parseInt(String(protections.chaleur || 0), 10),

                // Prix fields required by updated RefEquipement
                prix: prix.prix || 0,
                monnaie: prix.monnaie || '',

                // Details fields required by updated RefEquipement
                niveau: details.niveau || 0,
                restriction: details.restriction || '',
                origine_rarete: details["origine/rarete"] || '',
                type: details.type || '',
                contenant: details.contenant || '',
                portee: details.portee || '',
                aura: details.aura || '',
                mains: details.mains || '',
                matiere: details.matiere || '',
                couvre: details.couvre || '',
                effet: details.effet || '',
                charge: details.charge || 0,
                capacite: details.capacite || 0,
                places: details.places || 0,
                poids: details.poids || 0,
                rupture: details.rupture || '',
                recolte: details.recolte || '',
                peremption: details.peremption || '',

                // Craft fields required by updated RefEquipement
                composants: craft.composants || [],
                outils: craft.outils || [],
                qualifications: craft.qualifications || [],
                difficulte: craft.difficulte || '',
                temps_de_confection: craft.temps_de_confection || '',
                confection: craft.confection || '',
                xp_confection: row.craft?.xp_confection || 0,
                xp_reparation: row.craft?.xp_reparation || 0,

                raw: row
            };
        }) as RefEquipement[];
    }, [rawRefs]);

    // Derived state for sections
    const mainsNues = inventory.filter(i => i.equipement_type === 'MainsNues');
    const armes = inventory.filter(i => i.equipement_type === 'Armes');
    const protections = inventory.filter(i => i.equipement_type === 'Protections');
    const accessoires = inventory.filter(i => i.equipement_type === 'Accessoires');





    // Ensure at least one item per category on mount/update
    // We use a safe check that only updates if absolutely necessary and strictly checks counts


    const updateSection = (newSectionItems: Equipement[], sectionType: string) => {
        let itemsToSet = newSectionItems;

        // If user removed the last item, immediately replace with default


        let otherItems: Equipement[] = [];

        if (sectionType === 'MainsNues') {
            otherItems = inventory.filter(i => i.equipement_type !== 'MainsNues');
        } else if (sectionType === 'Armes') {
            otherItems = inventory.filter(i => i.equipement_type !== 'Armes');
        } else if (sectionType === 'Protections') {
            otherItems = inventory.filter(i => i.equipement_type !== 'Protections');
        } else if (sectionType === 'Accessoires') {
            otherItems = inventory.filter(i => i.equipement_type !== 'Accessoires');
        }

        onInventoryChange([...otherItems, ...itemsToSet]);
    };

    // Auto-Relink logic moved to CharacterSheet.tsx to be global
    // useEffect(() => { ... }, [refs, inventory]);

    const handleRemoveItem = (uid: string) => {
        onInventoryChange(inventory.filter(i => i.uid !== uid));
    };

    return (
        <div className="md:p-4 text-ink">


            <div className="grid grid-cols-1 gap-8">
                {/* Mains Nues takes full width now due to many columns */}
                <MainsNuesTable
                    items={mainsNues}
                    onItemsChange={(items) => updateSection(items, 'MainsNues')}
                    referenceOptions={refs.filter(r => r.category === 'Mains_nues')}
                    defaultItem={{ equipement_type: 'MainsNues' }}
                    characterForce={characterForce}
                    onRemove={handleRemoveItem}
                />

                <div className="grid grid-cols-1 gap-8">

                    <ArmesTable
                        items={armes}
                        onItemsChange={(items) => updateSection(items, 'Armes')}
                        referenceOptions={refs.filter(r => r.category === 'Armes')}
                        defaultItem={{ equipement_type: 'Armes' }}
                        characterForce={characterForce}
                        onRemove={handleRemoveItem}
                    />

                    <ProtectionsTable
                        items={protections}
                        onItemsChange={(items) => updateSection(items, 'Protections')}
                        referenceOptions={refs.filter(r => r.category === 'Protections')}
                        defaultItem={{ equipement_type: 'Protections' }}
                        bouclierActif={bouclierActif}
                        onRemove={handleRemoveItem}
                    />

                    <AccessoiresTable
                        items={accessoires}
                        onItemsChange={(items) => updateSection(items, 'Accessoires')}
                        referenceOptions={refs.filter(r => r.category === 'Accessoires')}
                        defaultItem={{ equipement_type: 'Accessoires' }}
                        onRemove={handleRemoveItem}
                    />
                </div>
            </div>

        </div>
    );
};
