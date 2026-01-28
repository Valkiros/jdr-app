import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CharacterHeader } from './CharacterHeader';
import { VitalsPanel } from './VitalsPanel';
import { GeneralStatsPanel } from './GeneralStatsPanel';
import { DefensePanel } from './DefensePanel';
import { MagicStealthPanel } from './MagicStealthPanel';
import { CharacteristicsPanel } from './CharacteristicsPanel';
import { TempModifiersPanel } from './TempModifiersPanel';
import { Inventory } from './Inventory';
import { CharacterData, Equipement, Characteristics } from '../types';

interface CharacterSheetProps {
    characterId: string;
}

const INITIAL_DATA: CharacterData = {
    identity: {
        avatar_url: '',
        nom: '',
        sexe: '',
        origine: '',
        metier: '',
        specialisation: '',
        sous_specialisation: ''
    },
    vitals: {
        pv: { current: 10, max: 10, temp: 0 },
        pm: { current: 0, max: 0, temp: 0 },
        corruption: { current: 0, max: 100, daily: 0 }
    },
    general: {
        niveau: 1,
        experience: 0,
        points_destin: 0,
        malus_tete: 0
    },
    defenses: {
        naturelle: { base: 0, temp: 0 },
        solide: { base: 0, temp: 0 },
        speciale: { base: 0, temp: 0 },
        magique: { base: 0, temp: 0 },
        bouclier_actif: false
    },
    movement: {
        marche: { base: 4, temp: 0 },
        course: { base: 10, temp: 0 }
    },
    magic: {
        magie_physique: { base: 0, temp: 0 },
        magie_psychique: { base: 0, temp: 0 },
        resistance_magique: { base: 0, temp: 0 },
        discretion: { base: 0, temp: 0 }
    },
    characteristics: {
        courage: { t1: 0, t2: 0, t3: 0 },
        intelligence: { t1: 0, t2: 0, t3: 0 },
        charisme: { t1: 0, t2: 0, t3: 0 },
        adresse: { t1: 0, t2: 0, t3: 0 },
        force: { t1: 0, t2: 0, t3: 0 },
        perception: { t1: 0, t2: 0, t3: 0 },
        esquive: { t1: 0, t2: 0, t3: 0 },
        attaque: { t1: 0, t2: 0, t3: 0 },
        parade: { t1: 0, t2: 0, t3: 0 },
        degats: { t1: 0, t2: 0, t3: 0 }
    },
    temp_modifiers: {
        mod1: '',
        mod2: '',
        mod3: ''
    },
    inventory: []
};

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ characterId }) => {
    const [data, setData] = useState<CharacterData>(INITIAL_DATA);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!characterId) return;

        invoke<any>('get_personnage', { id: characterId })
            .then(char => {
                if (char && char.data) {
                    // Start with initial data and merge saved data over it
                    // This ensures new fields are present if loaded data is old
                    const mergedData = {
                        ...INITIAL_DATA,
                        ...char.data,
                        // Deep merge specific sections if needed, or rely on ...spread if structure is flat enough at top level
                        // For recursive safety, we might need deeper merge, but for now spread is okay 
                        // assuming 'data' structure matches 'CharacterData' top keys.
                        // But for nested objects like 'vitals.pv', shallow merge of 'vitals' might overwrite new fields if 'char.data.vitals' is partial.
                        // Let's do a slightly safer merge for main sections.
                        identity: { ...INITIAL_DATA.identity, ...(char.data.identity || {}) },
                        vitals: { ...INITIAL_DATA.vitals, ...(char.data.vitals || {}) },
                        general: { ...INITIAL_DATA.general, ...(char.data.general || {}) },
                        defenses: { ...INITIAL_DATA.defenses, ...(char.data.defenses || {}) },
                        movement: { ...INITIAL_DATA.movement, ...(char.data.movement || {}) },
                        magic: { ...INITIAL_DATA.magic, ...(char.data.magic || {}) },
                        characteristics: { ...INITIAL_DATA.characteristics, ...(char.data.characteristics || {}) },
                        temp_modifiers: { ...INITIAL_DATA.temp_modifiers, ...(char.data.temp_modifiers || {}) },
                        inventory: char.data.inventory || []
                    };
                    setData(mergedData);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load character:", err);
                setLoading(false);
            });
    }, [characterId]);

    const [activeTab, setActiveTab] = useState<'fiche' | 'equipement'>('fiche');

    // Computed Values for Characteristics Table
    // Scan inventory for items that boost characteristics. 
    // Currently, our 'Equipement' struct has 'esquive_bonus'. 
    // If we want to support other stats, we need to look at 'raw.details' or similar.
    // For now, let's just map 'esquive' since it's the only explicitly typed bonus.
    // TODO: Expand backend/types to support generic stat bonuses on equipment.

    const calculateEquippedValues = () => {
        const values: Record<keyof Characteristics, number> = {
            courage: 0, intelligence: 0, charisme: 0, adresse: 0, force: 0,
            perception: 0, esquive: 0, attaque: 0, parade: 0, degats: 0
        };

        data.inventory.forEach((item: Equipement) => {
            if (item.equipe) {
                values.esquive += item.esquive_bonus || 0;
                // Add calculation for other stats here when data model supports it
            }
        });

        return values;
    };

    const equippedValues = calculateEquippedValues();

    if (loading) {
        return <div className="p-8 text-center text-leather">Chargement de la feuille de personnage...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 pb-20">
            <CharacterHeader
                identity={data.identity}
                onChange={(identity) => setData({ ...data, identity })}
            />

            {/* Tab Navigation */}
            <div className="flex border-b-2 border-leather mb-6">
                <button
                    onClick={() => setActiveTab('fiche')}
                    className={`px-6 py-2 font-bold text-lg transition-colors ${activeTab === 'fiche' ? 'bg-leather text-parchment' : 'text-leather hover:bg-leather hover:text-parchment hover:bg-opacity-10'}`}
                >
                    Fiche
                </button>
                <button
                    onClick={() => setActiveTab('equipement')}
                    className={`px-6 py-2 font-bold text-lg transition-colors ${activeTab === 'equipement' ? 'bg-leather text-parchment' : 'text-leather hover:bg-leather hover:text-parchment hover:bg-opacity-10'}`}
                >
                    Equipements
                </button>
            </div>

            {activeTab === 'fiche' && (
                <div className="space-y-6 animate-fade-in">
                    <VitalsPanel
                        vitals={data.vitals}
                        onChange={(vitals) => setData({ ...data, vitals })}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <GeneralStatsPanel
                                stats={data.general}
                                onChange={(general) => setData({ ...data, general })}
                            />
                            <DefensePanel
                                defenses={data.defenses}
                                movement={data.movement}
                                onDefenseChange={(defenses) => setData({ ...data, defenses })}
                                onMovementChange={(movement) => setData({ ...data, movement })}
                            />
                            <MagicStealthPanel
                                stats={data.magic}
                                onChange={(magic) => setData({ ...data, magic })}
                            />
                        </div>

                        <div>
                            <CharacteristicsPanel
                                characteristics={data.characteristics}
                                equippedValues={equippedValues}
                                onChange={(characteristics) => setData({ ...data, characteristics })}
                            />
                        </div>
                    </div>

                    <TempModifiersPanel
                        modifiers={data.temp_modifiers}
                        onChange={(temp_modifiers) => setData({ ...data, temp_modifiers })}
                    />
                </div>
            )}

            {activeTab === 'equipement' && (
                <div className="animate-fade-in">
                    <Inventory
                        inventory={data.inventory}
                        onInventoryChange={(inventory) => setData({ ...data, inventory })}
                    />
                </div>
            )}
        </div>
    );
};
