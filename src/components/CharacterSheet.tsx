import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { invoke } from '@tauri-apps/api/core';
import { CharacterHeader } from './CharacterHeader';
import { LocalSaveButton } from './LocalSaveButton';
import { MovementPanel } from './MovementPanel';
import { ProtectionsPanel } from './ProtectionsPanel';
import { MagicStealthPanel } from './MagicStealthPanel';
import { CharacteristicsPanel } from './CharacteristicsPanel';
import { TempModifiersPanel } from './TempModifiersPanel';
import { Inventory } from './Inventory';
import { CompetencesPanel } from './CompetencesPanel';
import { CharacterData, Equipement, Characteristics, GameRules, Origine } from '../types';



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
        discretion: { base: 0, temp: 0 },
        protection_pluie: { base: 0, temp: 0 },
        protection_froid: { base: 0, temp: 0 },
        protection_chaleur: { base: 0, temp: 0 }
    },
    characteristics: {
        courage: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        intelligence: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        charisme: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        adresse: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        force: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        perception: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        esquive: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        attaque: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        parade: { naturel: 0, t1: 0, t2: 0, t3: 0 },
        degats: { naturel: 0, t1: 0, t2: 0, t3: 0 }
    },
    temp_modifiers: {
        mod1: '',
        mod2: '',
        mod3: ''
    },
    inventory: [],
    competences: [],
    competences_specialisation: [],
    competences_sous_specialisation: []
};

export interface CharacterSheetHandle {
    save: () => Promise<void>;
}

interface CharacterSheetProps {
    characterId: string;
    onDirtyChange?: (isDirty: boolean) => void;
}

export const CharacterSheet = forwardRef<CharacterSheetHandle, CharacterSheetProps>(({ characterId, onDirtyChange }, ref) => {
    const [data, setDataState] = useState<CharacterData>(INITIAL_DATA);
    const [loading, setLoading] = useState(true);
    const [refs, setRefs] = useState<any[]>([]);
    const [gameRules, setGameRules] = useState<GameRules | null>(null);
    const isInitialLoad = React.useRef(true);

    const saveCharacter = async () => {
        try {

            await invoke('save_personnage_local', {
                id: characterId,
                name: data.identity.nom || 'Sans nom',
                data: JSON.stringify(data),
                updatedAt: new Date().toISOString()
            });
            onDirtyChange?.(false);
            return Promise.resolve();
        } catch (err) {
            console.error("Save failed", err);
            return Promise.reject(err);
        }
    };

    useImperativeHandle(ref, () => ({
        save: saveCharacter
    }));

    const setData = (newData: CharacterData) => {
        setDataState(newData);
        if (!isInitialLoad.current) {
            onDirtyChange?.(true);
        }
    };


    useEffect(() => {
        // Fetch Refs & Game Rules
        const fetchData = async () => {
            try {
                const refData = await invoke('get_ref_items') as any[];
                setRefs(refData);

                const rules = await invoke('get_game_rules') as GameRules;
                setGameRules(rules);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!characterId) return;

        invoke<any>('get_personnage', { id: characterId })
            .then(char => {
                if (char && char.data) {
                    const mergedData = {
                        ...INITIAL_DATA,
                        ...char.data,
                        identity: { ...INITIAL_DATA.identity, ...(char.data.identity || {}) },
                        vitals: { ...INITIAL_DATA.vitals, ...(char.data.vitals || {}) },
                        general: { ...INITIAL_DATA.general, ...(char.data.general || {}) },
                        defenses: { ...INITIAL_DATA.defenses, ...(char.data.defenses || {}) },
                        movement: { ...INITIAL_DATA.movement, ...(char.data.movement || {}) },
                        magic: { ...INITIAL_DATA.magic, ...(char.data.magic || {}) },
                        characteristics: { ...INITIAL_DATA.characteristics, ...(char.data.characteristics || {}) },
                        temp_modifiers: { ...INITIAL_DATA.temp_modifiers, ...(char.data.temp_modifiers || {}) },
                        inventory: char.data.inventory || [],
                        competences: char.data.competences || [],
                        competences_specialisation: char.data.competences_specialisation || [],
                        competences_sous_specialisation: char.data.competences_sous_specialisation || []
                    };
                    setDataState(mergedData);
                }
                setLoading(false);
                // Allow subsequent updates to trigger dirty state
                setTimeout(() => { isInitialLoad.current = false; }, 500);
            })
            .catch(err => {
                console.error("Failed to load character:", err);
                setLoading(false);
                isInitialLoad.current = false;
            });
    }, [characterId]);

    const [activeTab, setActiveTab] = useState<'fiche' | 'equipement' | 'competences'>('fiche');

    // Computed Values for Characteristics Table
    // The "Equipé" column now represents the TOTAL Value for each characteristic
    // Formula: Naturel + T1 + T2 + T3 + (Armor/Accessory Bonuses) - Malus Tête

    const calculateEquippedValues = () => {
        const values: Record<keyof Characteristics, number> = {
            courage: 0, intelligence: 0, charisme: 0, adresse: 0, force: 0,
            perception: 0, esquive: 0, attaque: 0, parade: 0, degats: 0
        };

        // Initialize with Base values (Naturel + Temp - Malus)
        (Object.keys(values) as Array<keyof Characteristics>).forEach((key) => {
            const char = data.characteristics[key];
            const base = (char.naturel || 0) + (char.t1 || 0) + (char.t2 || 0) + (char.t3 || 0);
            values[key] = base - (data.general.malus_tete || 0);
        });

        // Add Inventory Bonuses (excluding Weapons/Unarmed which have their own columns)
        data.inventory.forEach((item: Equipement) => {
            // Filter for Protections (Armure) and Accessoires (Autre/Sac?)
            // Explicitly exclude weapons
            if (item.equipement_type !== 'Armes' && item.equipement_type !== 'MainsNues') {

                // Look up the Reference Item
                const refItem = refs.find(r => r.id === item.refId);

                // Shield Logic: Skip if it's a shield and shield is inactive
                // We check the reference item 'type' in details, as equipement_type allows only broad categories
                if (refItem?.details?.type === 'Bouclier' && !data.defenses.bouclier_actif) {
                    return;
                }

                // Check for stats in either raw structure (if mapped) or direct (if raw)
                const caracs = refItem?.raw?.caracteristiques || refItem?.caracteristiques;

                if (caracs) {
                    Object.entries(caracs).forEach(([key, val]) => {
                        const normalizedKey = key.toLowerCase();
                        // Cast val to number safely
                        const bonus = parseInt(String(val || 0), 10);

                        if (bonus !== 0 && normalizedKey in values) {
                            values[normalizedKey as keyof Characteristics] += bonus;
                        }
                    });
                }
            }
        });

        return values;
    };

    const equippedValues = calculateEquippedValues();

    // Calculate Total Protections (Base) from Inventory
    // Protection Solide = pr_sol (toutes protections) + modif_pr_sol (toutes protections) + pr_sol (tous accessoires) + modif_pr_sol (tous les accessoires)
    // Same for Spéciale and Magique
    // Discretion = Adresse Naturelle + Bonus Discretion (from items)
    // Magie Physique = Moyenne Sup(Int + Adr) + Bonus
    // Magie Psychique = Moyenne Sup(Int + Cha) + Bonus
    // Resistance Magique = Moyenne Sup(Cour + Int + For) + Bonus
    const calculateComputedStats = () => {
        const totals = {
            solide: { value: 0, details: { formula: "Protections + Accessoires", components: [] as any[], total: 0 } },
            speciale: { value: 0, details: { formula: "Protections + Accessoires", components: [] as any[], total: 0 } },
            magique: { value: 0, details: { formula: "Protections + Accessoires", components: [] as any[], total: 0 } },

            // For these, we want detailed structure:
            discretion: { value: 0, details: { formula: "Adresse Naturelle + Objets", components: [] as any[], total: 0 } },
            magie_physique: { value: 0, details: { formula: "Moyenne sup. (Intelligence + Adresse) + Objets", components: [] as any[], total: 0 } },
            magie_psychique: { value: 0, details: { formula: "Moyenne sup. (Intelligence + Charisme) + Objets", components: [] as any[], total: 0 } },
            resistance_magique: { value: 0, details: { formula: "Moyenne sup. (Courage + Intelligence + Force) + Objets", components: [] as any[], total: 0 } },

            // Protection Status (Environment)
            protection_pluie: { value: 0, details: { formula: "Protections + Accessoires", components: [] as any[], total: 0 } },
            protection_froid: { value: 0, details: { formula: "Protections + Accessoires", components: [] as any[], total: 0 } },
            protection_chaleur: { value: 0, details: { formula: "Protections + Accessoires", components: [] as any[], total: 0 } },

            // Movement
            marche: { value: 0, details: { formula: "Arrondi sup. (Vitesse Origine * Encombrement PR sol) + Objets", components: [] as any[], total: 0 } },
            course: { value: 0, details: { formula: "Arrondi sup. (Vitesse Origine * Encombrement PR sol) + Objets", components: [] as any[], total: 0 } }
        };

        // 1. Add Natural Address for Discretion Base
        const adrNat = (data.characteristics.adresse.naturel || 0);
        totals.discretion.value += adrNat;
        totals.discretion.details.components.push({ label: 'Adresse (Naturelle)', value: adrNat });

        // 2. Add Base Stats for Magic (Moyenne Arrondi Supérieur)
        // Magie Physique: Int + Adr
        const int = equippedValues.intelligence;
        const adr = equippedValues.adresse;
        const baseMagPhy = Math.ceil((int + adr) / 2);
        totals.magie_physique.value += baseMagPhy;
        totals.magie_physique.details.components.push({ label: `Moyenne (Int ${int} + Adr ${adr})`, value: baseMagPhy });

        // Magie Psychique: Int + Cha
        const cha = equippedValues.charisme;
        const baseMagPsy = Math.ceil((int + cha) / 2);
        totals.magie_psychique.value += baseMagPsy;
        totals.magie_psychique.details.components.push({ label: `Moyenne (Int ${int} + Cha ${cha})`, value: baseMagPsy });

        // Resistance Magique: Cour + Int + For
        const cour = equippedValues.courage;
        const force = equippedValues.force;
        const baseResMag = Math.ceil((cour + int + force) / 3);
        totals.resistance_magique.value += baseResMag;
        totals.resistance_magique.details.components.push({ label: `Moyenne (Cour ${cour} + Int ${int} + For ${force})`, value: baseResMag });


        data.inventory.forEach(item => {
            // Only protections and accessories
            // Cast to string to allow checking legacy types like 'Armure', 'Bouclier', 'Autre'
            const type = item.equipement_type as string;
            if (['Protections', 'Accessoires'].includes(type)) {

                const refItem = refs.find(r => r.id === item.refId);

                // Shield Logic: Skip if it's a shield and shield is inactive
                if (refItem?.details?.type === 'Bouclier' && !data.defenses.bouclier_actif) {
                    return;
                }

                // Solide Base comes from degats_pr (Protection) for Armors, not PI
                // Try to find pr_sol in protections object (if raw) or direct (if mapped) or degats_pr (legacy?)
                const protections = refItem?.protections || refItem?.raw?.protections || {};
                const baseSol = parseInt(String(protections.pr_sol || 0), 10);
                const baseSpe = parseInt(String(protections.pr_spe || 0), 10);
                const baseMag = parseInt(String(protections.pr_mag || 0), 10);

                // Environment Base
                const basePluie = refItem?.pluie || 0;
                const baseFroid = refItem?.froid || 0;
                const baseChaleur = refItem?.chaleur || 0;


                // Modifiers
                const modSol = parseInt(String(item.modif_pr_sol || 0), 10);
                const modSpe = parseInt(String(item.modif_pr_spe || 0), 10);
                const modMag = parseInt(String(item.modif_pr_mag || 0), 10);

                const valSol = baseSol + modSol;
                const valSpe = baseSpe + modSpe;
                const valMag = baseMag + modMag;

                if (valSol !== 0) {
                    totals.solide.value += valSol;
                    totals.solide.details.components.push({ label: refItem?.nom || item.nom, value: valSol });
                }
                if (valSpe !== 0) {
                    totals.speciale.value += valSpe;
                    totals.speciale.details.components.push({ label: refItem?.nom || item.nom, value: valSpe });
                }
                if (valMag !== 0) {
                    totals.magique.value += valMag;
                    totals.magique.details.components.push({ label: refItem?.nom || item.nom, value: valMag });
                }

                // Environment Stats Calculation
                if (basePluie !== 0) {
                    totals.protection_pluie.value += basePluie;
                    totals.protection_pluie.details.components.push({ label: refItem?.nom || item.nom, value: basePluie });
                }
                if (baseFroid !== 0) {
                    totals.protection_froid.value += baseFroid;
                    totals.protection_froid.details.components.push({ label: refItem?.nom || item.nom, value: baseFroid });
                }
                if (baseChaleur !== 0) {
                    totals.protection_chaleur.value += baseChaleur;
                    totals.protection_chaleur.details.components.push({ label: refItem?.nom || item.nom, value: baseChaleur });
                }

                // Check char_values for Discretion and Magic Bonuses
                if (item.char_values) {
                    // Discretion
                    const discKey = Object.keys(item.char_values).find(k => k.toLowerCase() === 'discretion' || k.toLowerCase() === 'discrétion');
                    if (discKey) {
                        const val = item.char_values[discKey] || 0;
                        totals.discretion.value += val;
                        totals.discretion.details.components.push({ label: refItem?.nom || item.nom, value: val });
                    }

                    // Magie Physique (mag_phy)
                    const magPhyKey = Object.keys(item.char_values).find(k => k.toLowerCase() === 'mag_phy' || k.toLowerCase() === 'magie_physique');
                    if (magPhyKey) {
                        const val = item.char_values[magPhyKey] || 0;
                        totals.magie_physique.value += val;
                        totals.magie_physique.details.components.push({ label: refItem?.nom || item.nom, value: val });
                    }

                    // Magie Psychique (mag_psy)
                    const magPsyKey = Object.keys(item.char_values).find(k => k.toLowerCase() === 'mag_psy' || k.toLowerCase() === 'magie_psychique');
                    if (magPsyKey) {
                        const val = item.char_values[magPsyKey] || 0;
                        totals.magie_psychique.value += val;
                        totals.magie_psychique.details.components.push({ label: refItem?.nom || item.nom, value: val });
                    }

                    // Resistance Magique (rm)
                    const rmKey = Object.keys(item.char_values).find(k => k.toLowerCase() === 'rm' || k.toLowerCase() === 'resistance_magique' || k.toLowerCase() === 'résistance_magique');
                    if (rmKey) {
                        const val = item.char_values[rmKey] || 0;
                        totals.resistance_magique.value += val;
                        totals.resistance_magique.details.components.push({ label: refItem?.nom || item.nom, value: val });
                    }

                    // Marche
                    const marcheKey = Object.keys(item.char_values).find(k => k.toLowerCase() === 'marche');
                    if (marcheKey) {
                        const val = item.char_values[marcheKey] || 0;
                        totals.marche.value += val;
                        totals.marche.details.components.push({ label: refItem?.nom || item.nom, value: val });
                    }

                    // Course
                    const courseKey = Object.keys(item.char_values).find(k => k.toLowerCase() === 'course');
                    if (courseKey) {
                        const val = item.char_values[courseKey] || 0;
                        totals.course.value += val;
                        totals.course.details.components.push({ label: refItem?.nom || item.nom, value: val });
                    }
                }
            }
        });

        // 3. Movement Base from Origin (Calculated AFTER items to account for PR Solide/Encumbrance)
        if (gameRules && data.identity.origine) {
            const originObj = gameRules.origines.find((o: Origine) =>
                o.name_m === data.identity.origine || o.name_f === data.identity.origine
            );

            if (originObj) {
                const speed = originObj.vitesse;
                const prSolide = totals.solide.value + (data.defenses.solide.temp || 0);

                // Determine Multipliers based on PR Solide
                let marcheMult = 8;
                if (prSolide >= 2 && prSolide < 3) marcheMult = 6;
                else if (prSolide >= 3 && prSolide <= 5) marcheMult = 4;
                else if (prSolide === 6) marcheMult = 3;
                else if (prSolide === 7) marcheMult = 2;
                else if (prSolide > 7) marcheMult = 1;

                let courseMult = 12;
                if (prSolide >= 2 && prSolide < 3) courseMult = 10;
                else if (prSolide >= 3 && prSolide <= 4) courseMult = 8;
                else if (prSolide === 5) courseMult = 6;
                else if (prSolide === 6) courseMult = 4;
                else if (prSolide === 7) courseMult = 3;
                else if (prSolide > 7) courseMult = 2;


                // Marche
                const baseMarche = Math.ceil(speed * marcheMult / 100);
                totals.marche.value += baseMarche;
                totals.marche.details.components.push({
                    label: `Base origine: ${speed / 100}\nPR sol ${prSolide} => ${marcheMult}`,
                    value: baseMarche
                });

                // Course
                const baseCourse = Math.ceil(speed * courseMult / 100);
                totals.course.value += baseCourse;
                totals.course.details.components.push({
                    label: `Base origine: ${speed / 100}\nPR sol ${prSolide} => ${courseMult})`,
                    value: baseCourse
                });
            }
        }

        // Set totals in details
        totals.solide.details.total = totals.solide.value;
        totals.speciale.details.total = totals.speciale.value;
        totals.magique.details.total = totals.magique.value;
        totals.discretion.details.total = totals.discretion.value;
        totals.magie_physique.details.total = totals.magie_physique.value;
        totals.magie_psychique.details.total = totals.magie_psychique.value;
        totals.resistance_magique.details.total = totals.resistance_magique.value;
        totals.marche.details.total = totals.marche.value;
        totals.course.details.total = totals.course.value;

        return totals;
    };

    const computedStats = calculateComputedStats();

    if (loading) {
        return <div className="p-8 text-center text-leather">Chargement de la feuille de personnage...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 pb-20">
            <CharacterHeader
                characterData={data}
                identity={data.identity}
                vitals={data.vitals}
                generalStats={data.general}
                onIdentityChange={(identity) => setData({ ...data, identity })}
                onVitalsChange={(vitals) => setData({ ...data, vitals })}
                onGeneralChange={(general) => {
                    // Auto-calculate level based on XP
                    const xp = general.experience || 0;
                    const calculatedLevel = Math.floor((1 + Math.sqrt(1 + 4 * (xp / 50))) / 2);
                    const newLevel = Math.max(1, calculatedLevel);

                    setData({
                        ...data,
                        general: {
                            ...general,
                            niveau: newLevel
                        }
                    });
                }}
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
                <button
                    onClick={() => setActiveTab('competences')}
                    className={`px-6 py-2 font-bold text-lg transition-colors ${activeTab === 'competences' ? 'bg-leather text-parchment' : 'text-leather hover:bg-leather hover:text-parchment hover:bg-opacity-10'}`}
                >
                    Compétences
                </button>
            </div>

            <div className={activeTab === 'fiche' ? 'space-y-6 animate-fade-in' : 'hidden'}>


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-6">

                        <MovementPanel
                            movement={data.movement}
                            magic={data.magic}
                            malusTete={data.general.malus_tete}
                            computedMovement={{
                                marche: computedStats.marche,
                                course: computedStats.course
                            }}
                            computedDiscretion={computedStats.discretion}
                            onMovementChange={(movement) => setData({ ...data, movement })}
                            onMagicChange={(magic) => setData({ ...data, magic })}
                            onMalusTeteChange={(val) => setData({
                                ...data,
                                general: { ...data.general, malus_tete: val }
                            })}
                        />
                    </div>
                    <div className="flex flex-col gap-6">
                        <ProtectionsPanel
                            defenses={data.defenses}
                            computedDefenses={{
                                solide: computedStats.solide,
                                speciale: computedStats.speciale,
                                magique: computedStats.magique
                            }}
                            onDefenseChange={(defenses) => setData({ ...data, defenses })}
                        />
                    </div>
                </div>

                {/* Characteristics - Full Width */}
                <div>
                    <CharacteristicsPanel
                        characteristics={data.characteristics}
                        equippedValues={equippedValues}
                        inventory={data.inventory}
                        referenceOptions={refs}
                        onChange={(characteristics) => setData({ ...data, characteristics })}
                    />
                </div>

                <div>
                    <MagicStealthPanel
                        stats={data.magic}
                        computedMagic={{
                            magie_physique: computedStats.magie_physique,
                            magie_psychique: computedStats.magie_psychique,
                            resistance_magique: computedStats.resistance_magique,
                            protection_pluie: computedStats.protection_pluie,
                            protection_froid: computedStats.protection_froid,
                            protection_chaleur: computedStats.protection_chaleur
                        }}
                        onChange={(magic) => setData({ ...data, magic })}
                    />
                </div>

                {/* Temp Modifiers - Bottom */}
                <TempModifiersPanel
                    modifiers={data.temp_modifiers}
                    onChange={(temp_modifiers) => setData({ ...data, temp_modifiers })}
                />
            </div>

            <div className={activeTab === 'equipement' ? 'animate-fade-in' : 'hidden'}>
                <Inventory
                    inventory={data.inventory}
                    onInventoryChange={(inventory) => setData({ ...data, inventory })}
                    characterForce={equippedValues.force}
                    bouclierActif={data.defenses.bouclier_actif}
                />
            </div>

            <div className={activeTab === 'competences' ? 'animate-fade-in' : 'hidden'}>
                <CompetencesPanel
                    title="Compétences origine et métier"
                    competences={data.competences || []}
                    onCompetencesChange={(newCompetences) => setData({ ...data, competences: newCompetences })}
                />

                <CompetencesPanel
                    title="Compétences spécialisation"
                    competences={data.competences_specialisation || []}
                    onCompetencesChange={(newCompetences) => setData({ ...data, competences_specialisation: newCompetences })}
                />

                <CompetencesPanel
                    title="Compétences sous spécialisation"
                    competences={data.competences_sous_specialisation || []}
                    onCompetencesChange={(newCompetences) => setData({ ...data, competences_sous_specialisation: newCompetences })}
                />
            </div>

            {/* Portal for Save Button in Header */}
            {document.getElementById('header-actions') && createPortal(
                <LocalSaveButton
                    onSave={saveCharacter}
                />,
                document.getElementById('header-actions')!
            )}
        </div>
    );
});
CharacterSheet.displayName = 'CharacterSheet';
