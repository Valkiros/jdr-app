import React from 'react';
import { useRefContext } from '../../../context/RefContext';
import { Equipement } from '../../../types';
import { SacochesTable } from './SacochesTable';
import { PotionsTable } from './PotionsTable';
import { ObjetsMagiquesTable } from './ObjetsMagiquesTable';
import { MunitionsTable } from './MunitionsTable';
import { ArmesDeJetTable } from './ArmesDeJetTable';
import { PiegesTable } from './PiegesTable';
import { OutilsTable } from './OutilsTable';

interface SacochesEtPochesProps {
    inventory: Equipement[];
    onInventoryChange: (items: Equipement[]) => void;
    characterForce: number;
}

export const SacochesEtPoches: React.FC<SacochesEtPochesProps> = ({ inventory = [], onInventoryChange, characterForce }) => {
    const { refs: rawRefs } = useRefContext();

    // Refs helper
    const getRefsByCategory = (category: string) => {
        return rawRefs.filter(r => r.category === category || r.equipement_type === category);
    };

    // Filter items from inventory
    const sacoches = inventory.filter(i => i.equipement_type === 'Sacoches');
    const potions = inventory.filter(i => i.equipement_type === 'Potions');
    const objetsMagiques = inventory.filter(i => i.equipement_type === 'Objets_magiques');
    const munitions = inventory.filter(i => i.equipement_type === 'Munitions');
    const armesDeJet = inventory.filter(i => i.equipement_type === 'Armes_de_jet');
    const pieges = inventory.filter(i => i.equipement_type === 'Pieges');
    const outils = inventory.filter(i => i.equipement_type === 'Outils');

    // Generic update handler
    const updateInventory = (type: string, newItems: Equipement[]) => {
        const otherItems = inventory.filter(i => i.equipement_type !== type);
        onInventoryChange([...otherItems, ...newItems]);
    };

    return (
        <div className="space-y-6">
            <SacochesTable
                items={sacoches}
                onItemsChange={(newItems) => updateInventory('Sacoches', newItems)}
                referenceOptions={getRefsByCategory('Sacoches')}
            />
            <PotionsTable
                items={potions}
                onItemsChange={(newItems) => updateInventory('Potions', newItems)}
                referenceOptions={getRefsByCategory('Potions')}
            />
            <ArmesDeJetTable
                items={armesDeJet}
                onItemsChange={(newItems) => updateInventory('Armes_de_jet', newItems)}
                referenceOptions={getRefsByCategory('Armes_de_jet')}
                characterForce={characterForce}
            />
            <MunitionsTable
                items={munitions}
                onItemsChange={(newItems) => updateInventory('Munitions', newItems)}
                referenceOptions={getRefsByCategory('Munitions')}
            />
            <PiegesTable
                items={pieges}
                onItemsChange={(newItems) => updateInventory('Pieges', newItems)}
                referenceOptions={getRefsByCategory('Pieges')}
            />
            <ObjetsMagiquesTable
                items={objetsMagiques}
                onItemsChange={(newItems) => updateInventory('Objets_magiques', newItems)}
                referenceOptions={getRefsByCategory('Objets_magiques')}
            />
            <OutilsTable
                items={outils}
                onItemsChange={(newItems) => updateInventory('Outils', newItems)}
                referenceOptions={getRefsByCategory('Outils')}
            />
        </div>
    );
};
