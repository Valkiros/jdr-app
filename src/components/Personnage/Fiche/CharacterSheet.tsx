import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { invoke } from '@tauri-apps/api/core';
import { applyCompetenceRules } from "../../../utils/competenceRules";
import { CharacterHeader } from './CharacterHeader';
import { LocalSaveButton } from '../../Shared/LocalSaveButton';
import { MovementPanel } from './MovementPanel';
import { ProtectionsPanel } from '../Equipements/ProtectionsPanel';
import { MagicStealthPanel } from './MagicStealthPanel';
import { CharacteristicsPanel } from './CharacteristicsPanel';
import { TempModifiersPanel } from './TempModifiersPanel';
import { Inventory } from '../Equipements/Inventory';
import { CompetencesPanel } from '../Competences/CompetencesPanel';
import { SpecializationCompetencesPanel } from '../Competences/SpecializationCompetencesPanel';
import { DomainPanel } from '../Competences/DomainPanel';
import { StatusPanel } from '../Etat/StatusPanel';
import { SacochesEtPoches } from '../SacochesEtPoches/SacochesEtPoches';
import { SacPanel } from '../Sac/SacPanel';
import { APE } from '../APE/APE';
import { CharacterData, Equipement, Characteristics, Origine } from '../../../types';
import { INITIAL_DATA } from '../../../constants';
import { useRefContext } from '../../../context/RefContext';
import { getAlcoholModifiers } from '../../../utils/alcohol';
import { getItemWeight } from '../../../utils/sacUtils';


export interface CharacterSheetHandle {
    save: () => Promise<void>;
}

interface CharacterSheetProps {
    characterId: string;
    onDirtyChange?: (isDirty: boolean) => void;
}

export const CharacterSheet = forwardRef<CharacterSheetHandle, CharacterSheetProps>(({ characterId, onDirtyChange }, ref) => {
    const [data, setDataState] = useState<CharacterData>(INITIAL_DATA);
    const [characterLoading, setCharacterLoading] = useState(true);
    const { refs, gameRules, loading: refLoading } = useRefContext();
    const [referenceCompetences, setReferenceCompetences] = useState<any[]>([]);
    const isInitialLoad = React.useRef(true);

    useEffect(() => {
        invoke('get_competences')
            .then((comps: any) => setReferenceCompetences(comps))
            .catch(err => console.error("Failed to load competences:", err));
    }, []);

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


    // Removed local fetch of Refs & Game Rules (moved to RefContext)

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
                setCharacterLoading(false);
                // Allow subsequent updates to trigger dirty state
                setTimeout(() => { isInitialLoad.current = false; }, 500);
            })
            .catch(err => {
                console.error("Failed to load character:", err);
                setCharacterLoading(false);
                isInitialLoad.current = false;
            });
    }, [characterId]);

    const [activeTab, setActiveTab] = useState<'fiche' | 'equipement' | 'sacoches' | 'sac' | 'status' | 'competences' | 'ape'>('fiche');

    // Computed Values for Characteristics Table
    // Computed Values for Characteristics Table
    // The "Equipé" column now represents the TOTAL Value for each characteristic
    // Formula: Naturel + T1 + T2 + T3 + (Armor/Accessory Bonuses) + Fatigue - Malus Tête

    const getFatigueModifier = (etat: string) => {
        if (etat === 'Reposé') return 1;
        if (etat && etat.startsWith('Epuisé')) {
            const parts = etat.split(' ');
            if (parts.length > 1) {
                const level = parseInt(parts[1], 10);
                return -level;
            }
        }
        return 0; // Normal, Fatigué
    };

    // Helper to calculate PR Solide Encumbrance EARLY (for Dodge and Movement)
    // Helper to calculate PR Solide Encumbrance EARLY (for Dodge and Movement)
    const currentEncumbrance = React.useMemo(() => {
        let totalSolide = 0;
        data.inventory.forEach(item => {
            // Only protections and accessories
            const type = item.equipement_type as string;
            if (['Protections', 'Accessoires'].includes(type)) {
                const refItem = refs.find(r => r.id === item.refId);
                // Shield check
                if (refItem?.details?.type === 'Bouclier' && !data.defenses.bouclier_actif) return;

                const protections = refItem?.protections || refItem?.raw?.protections || {};
                const baseSol = parseInt(String(protections.pr_sol || 0), 10);
                const modSol = parseInt(String(item.modif_pr_sol || 0), 10);
                totalSolide += (baseSol + modSol);
            }
        });
        // Add Temp Modifier from Defenses (Naturel/Solide temp is usually on Solide panel)
        totalSolide += (data.defenses.solide.temp || 0);

        return totalSolide;
    }, [data.inventory, data.defenses.solide.temp, data.defenses.bouclier_actif, refs]);



    const equippedValues = React.useMemo(() => {
        // Detailed structure for tooltips
        const values: Record<keyof Characteristics, { value: number, components: { label: string, value: number, displayValue?: string }[], overrideDisplay?: string }> = {
            courage: { value: 0, components: [] },
            intelligence: { value: 0, components: [] },
            charisme: { value: 0, components: [] },
            adresse: { value: 0, components: [] },
            force: { value: 0, components: [] },
            perception: { value: 0, components: [] },
            esquive: { value: 0, components: [] },
            attaque: { value: 0, components: [] },
            parade: { value: 0, components: [] },
            degats: { value: 0, components: [] }
        };

        const fatigueMod = getFatigueModifier(data.status?.fatigue?.etat);

        // Get Alcohol Modifiers
        const { leger, fort, gueule_de_bois } = getAlcoholModifiers(data.status || INITIAL_DATA.status);

        const isFlibustier = data.identity.specialisation?.toLowerCase() === 'flibustier';

        // --- SPECIALIZATION & SUB-SPECIALIZATION AUTOMATED ATTRIBUTES ---
        const getSpecData = () => {
            if (!gameRules) return { specBonuses: {}, subSpecBonuses: {} };
            const currentMetier = gameRules.metiers.find(m => m.name_m === data.identity.metier || m.name_f === data.identity.metier);
            if (!currentMetier) return { specBonuses: {}, subSpecBonuses: {} };

            let specBonuses: { [key: string]: number } = {};
            let subSpecBonuses: { [key: string]: number } = {};

            // Specialization
            if (data.identity.specialisation) {
                const spec = currentMetier.specialisations?.find(s => s.name_m === data.identity.specialisation || s.name_f === data.identity.specialisation);
                // Backend sends 'attributs_automatisables' (snake_case)
                const attrs = spec?.attributs_automatisables || (spec as any)?.Attributs_automatisables;
                if (attrs) {
                    for (const [key, value] of Object.entries(attrs)) {
                        specBonuses[key] = (specBonuses[key] || 0) + (value as number);
                    }
                }
            }

            // Sub-Specialization
            if (data.identity.sous_specialisation && data.identity.specialisation) {
                const spec = currentMetier.specialisations?.find(s => s.name_m === data.identity.specialisation || s.name_f === data.identity.specialisation);
                const subSpec = spec?.sous_specialisations?.find(s => s.name_m === data.identity.sous_specialisation || s.name_f === data.identity.sous_specialisation);
                const attrs = subSpec?.attributs_automatisables || (subSpec as any)?.Attributs_automatisables;
                if (attrs) {
                    for (const [key, value] of Object.entries(attrs)) {
                        subSpecBonuses[key] = (subSpecBonuses[key] || 0) + (value as number);
                    }
                }
            }
            return { specBonuses, subSpecBonuses };
        };
        const { specBonuses, subSpecBonuses } = getSpecData();
        // ----------------------------------------------------------------

        // --- Backpack Encumbrance Malus Logic ---
        const sacItems = data.inventory.filter(i => i.equipement_type === 'Sacs');
        const backpack = sacItems.find(i => {
            const ref = refs.find(r => r.id === i.refId);
            return ref?.category === 'Sacs';
        });

        let sacMalus = 0;
        if (backpack) {
            const refBackpack = refs.find(r => r.id === backpack.refId);
            const capacityRaw = (refBackpack as any)?.details?.capacite || 0;
            // eslint-disable-next-line
            const capacity = typeof capacityRaw === 'string' ? parseInt(capacityRaw) : capacityRaw;

            // Calculate Content Weight (Items in 'Sacs' but not the bag itself)
            const contentWeight = sacItems
                .filter(i => i.uid !== backpack.uid)
                .reduce((acc, item) => {
                    const refItem = refs.find(r => r.id === item.refId);
                    const unitWeight = getItemWeight(refItem);
                    return acc + (unitWeight * (item.quantite ?? 1));
                }, 0);

            if (capacity > 0 && contentWeight >= (0.9 * capacity)) {
                sacMalus = -2;
            }
        }
        // ----------------------------------------

        // Initialize with Base values (Naturel + Temp - Malus)
        (Object.keys(values) as Array<keyof Characteristics>).forEach((key) => {
            const char = data.characteristics[key];
            const naturel = char.naturel || 0;
            const t1 = char.t1 || 0;
            const t2 = char.t2 || 0;
            const t3 = char.t3 || 0;
            const malusTete = data.general.malus_tete || 0;

            const components = [];
            if (naturel !== 0) components.push({ label: 'Naturel', value: naturel });
            if (t1 !== 0) components.push({ label: 'T1', value: t1 });
            if (t2 !== 0) components.push({ label: 'T2', value: t2 });
            if (t3 !== 0) components.push({ label: 'T3', value: t3 });

            if (malusTete !== 0) components.push({ label: 'Malus Tête', value: -malusTete });

            const etatFatigue = data.status?.fatigue?.etat || 'Normal';
            if (fatigueMod !== 0) components.push({ label: `Etat de fatigue (${etatFatigue})`, value: fatigueMod });

            // Apply Alcohol Modifiers
            // Key mismatch handling: AlcoholModifiers has specific keys, Characteristics has broader keys
            // Fortunately, AlcoholModifiers keys overlap with Characteristics keys we care about
            if (key in leger) {
                // @ts-ignore
                const val = leger[key];
                if (val !== 0) components.push({ label: 'Alcool (léger)', value: val });
            }
            if (key in fort) {
                // @ts-ignore
                const val = fort[key];
                let effectiveVal = val;

                if (isFlibustier && val < 0) {
                    effectiveVal = 0;
                }

                if (effectiveVal !== 0) {
                    components.push({ label: 'Alcool (fort)', value: effectiveVal });
                }
            }
            if (key in gueule_de_bois) {
                // @ts-ignore
                const val = gueule_de_bois[key];
                if (val !== 0) components.push({ label: 'Gueule de bois', value: val });
            }

            // --- DRUG MALUS LOGIC ---
            const drug = data.status?.drug || { type: 'Aucune', jours_retard: 0 };
            let drugMalus = 0;
            if (drug.type === 'ADD') {
                drugMalus = Math.floor(drug.jours_retard / 2) * -1;
            } else if (drug.type === 'ADD+' || drug.type === 'ADD++') {
                drugMalus = drug.jours_retard * -1;
            }

            if (drugMalus !== 0) {
                components.push({ label: `Manque (Drogue: ${drug.type})`, value: drugMalus });
            }
            // ------------------------

            // --- SPECIALIZATION BONUS ---
            // Mapping: JSON keys -> Characteristics keys
            // COU, INT, CHA, AD, FO, PER, ES, AT, PRD, DEG
            const keyMap: { [key: string]: keyof Characteristics } = {
                'COU': 'courage',
                'INT': 'intelligence',
                'CHA': 'charisme',
                'AD': 'adresse',
                'FO': 'force',
                'PER': 'perception',
                'ES': 'esquive',
                'AT': 'attaque',
                'PRD': 'parade',
                'DEG': 'degats'
            };

            // Reverse map to check if current 'key' matches any spec bonus
            const specKey = Object.keys(keyMap).find(k => keyMap[k] === key);
            if (specKey && specBonuses[specKey]) {
                components.push({ label: 'Spécialisation', value: specBonuses[specKey] });
            }
            if (specKey && subSpecBonuses[specKey]) {
                components.push({ label: 'Sous-spécialisation', value: subSpecBonuses[specKey] });
            }
            // ----------------------------

            // --- ENCUMBRANCE (Dodge) LOGIC ---
            // Only affects Esquive 'equipé'
            let encumbranceMalus = 0;
            if (key === 'esquive') {
                // Lookup Table:
                // 0, 1 -> +1
                // 2 -> 0
                // 3, 4 -> -2
                // 5 -> -4
                // 6 -> -5
                // 7 -> -6
                // >7 -> Impossible (-20 to secure fail)

                if (currentEncumbrance >= 0 && currentEncumbrance <= 1) encumbranceMalus = 1;
                else if (currentEncumbrance === 2) encumbranceMalus = 0;
                else if (currentEncumbrance >= 3 && currentEncumbrance <= 4) encumbranceMalus = -2;
                else if (currentEncumbrance === 5) encumbranceMalus = -4;
                else if (currentEncumbrance === 6) encumbranceMalus = -5;
                else if (currentEncumbrance === 7) encumbranceMalus = -6;
                else if (currentEncumbrance > 7) encumbranceMalus = -999; // Impossible

                if (encumbranceMalus !== 0) {
                    const label = encumbranceMalus > 0 ? 'Légèreté' : 'Encombrement';
                    components.push({
                        label: `${label} (PR Sol. ${currentEncumbrance})`,
                        value: encumbranceMalus,
                        displayValue: currentEncumbrance > 7 ? "Impossible" : undefined
                    });
                }

                if (currentEncumbrance > 7) {
                    values[key].overrideDisplay = "Imp.";
                }
            }
            // ---------------------------------

            let base = naturel + t1 + t2 + t3 - malusTete + fatigueMod;

            // Add alcohol sums to base
            // @ts-ignore
            if (key in leger) base += leger[key];
            // @ts-ignore
            if (key in fort) {
                // @ts-ignore
                const val = fort[key];
                if (!isFlibustier || val >= 0) {
                    base += val;
                }
            }
            // @ts-ignore
            if (key in gueule_de_bois) base += gueule_de_bois[key];

            // Add drug malus to base
            base += drugMalus;

            // Add specialization/sub-specialization bonus to base
            // @ts-ignore
            if (specKey && specBonuses[specKey]) base += specBonuses[specKey];
            // @ts-ignore
            if (specKey && subSpecBonuses[specKey]) base += subSpecBonuses[specKey];

            // Add encumbrance malus (Esquive only)
            if (key === 'esquive') {
                base += encumbranceMalus;
                base += sacMalus;

                if (sacMalus !== 0) {
                    components.push({ label: 'Sac surchargé', value: sacMalus });
                }
            }

            values[key].value = base;
            values[key].components = components;
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
                            values[normalizedKey as keyof Characteristics].value += bonus;
                            values[normalizedKey as keyof Characteristics].components.push({
                                label: refItem?.nom, // Fallback name
                                value: bonus
                            });
                        }
                    });
                }
            }
        });

        return values;
    }, [data.characteristics, data.status, data.general.malus_tete, data.inventory, data.defenses.bouclier_actif, refs, currentEncumbrance, data.identity, gameRules]);



    // Calculate Total Protections (Base) from Inventory
    // Protection Solide = pr_sol (toutes protections) + modif_pr_sol (toutes protections) + pr_sol (tous accessoires) + modif_pr_sol (tous les accessoires)
    // Same for Spéciale and Magique
    // Discretion = Adresse Naturelle + Bonus Discretion (from items)
    // Magie Physique = Moyenne Sup(Int + Adr) + Bonus
    // Magie Psychique = Moyenne Sup(Int + Cha) + Bonus
    // Resistance Magique = Moyenne Sup(Cour + Int + For) + Bonus
    const computedStats = React.useMemo(() => {
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
        const int = equippedValues.intelligence.value;
        const adr = equippedValues.adresse.value;
        const baseMagPhy = Math.ceil((int + adr) / 2);
        totals.magie_physique.value += baseMagPhy;
        totals.magie_physique.details.components.push({ label: `Moyenne sup. (INT ${int} + AD ${adr})`, value: baseMagPhy });

        // Magie Psychique: Int + Cha
        const cha = equippedValues.charisme.value;
        const baseMagPsy = Math.ceil((int + cha) / 2);
        totals.magie_psychique.value += baseMagPsy;
        totals.magie_psychique.details.components.push({ label: `Moyenne sup. (INT ${int} + CHA ${cha})`, value: baseMagPsy });

        // Resistance Magique: Cour + Int + For
        const cour = equippedValues.courage.value;
        const force = equippedValues.force.value;
        const baseResMag = Math.ceil((cour + int + force) / 3);
        totals.resistance_magique.value += baseResMag;
        totals.resistance_magique.details.components.push({ label: `Moyenne sup. (COU ${cour} + INT ${int} + FO ${force})`, value: baseResMag });


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
                    label: `Base origine: ${speed / 100} * (PR Sol ${prSolide} => x${marcheMult / 100})`,
                    value: baseMarche
                });

                // Course
                const baseCourse = Math.ceil(speed * courseMult / 100);
                totals.course.value += baseCourse;
                totals.course.details.components.push({
                    label: `Base origine: ${speed / 100} * (PR Sol ${prSolide} => x${courseMult / 100})`,
                    value: baseCourse
                });

                // --- Specialization / Sub-Spec Bonuses for Movement & RM ---
                const getSpecData = () => {
                    if (!gameRules) return { specBonuses: {} as any, subSpecBonuses: {} as any };
                    const currentMetier = gameRules.metiers.find((m: any) => m.name_m === data.identity.metier || m.name_f === data.identity.metier);
                    if (!currentMetier) return { specBonuses: {}, subSpecBonuses: {} };

                    let specBonuses: { [key: string]: number } = {};
                    let subSpecBonuses: { [key: string]: number } = {};

                    // Specialization
                    if (data.identity.specialisation) {
                        const spec = currentMetier.specialisations?.find((s: any) => s.name_m === data.identity.specialisation || s.name_f === data.identity.specialisation);
                        const attrs = spec?.attributs_automatisables || (spec as any)?.Attributs_automatisables;
                        if (attrs) Object.entries(attrs).forEach(([k, v]) => specBonuses[k] = (specBonuses[k] || 0) + (v as number));
                    }

                    // Sub-Specialization
                    if (data.identity.sous_specialisation && data.identity.specialisation) {
                        const spec = currentMetier.specialisations?.find((s: any) => s.name_m === data.identity.specialisation || s.name_f === data.identity.specialisation);
                        const subSpec = spec?.sous_specialisations?.find((s: any) => s.name_m === data.identity.sous_specialisation || s.name_f === data.identity.sous_specialisation);
                        const attrs = subSpec?.attributs_automatisables || (subSpec as any)?.Attributs_automatisables;
                        if (attrs) Object.entries(attrs).forEach(([k, v]) => subSpecBonuses[k] = (subSpecBonuses[k] || 0) + (v as number));
                    }
                    return { specBonuses, subSpecBonuses };
                };

                const { specBonuses, subSpecBonuses } = getSpecData();

                // RM
                if (specBonuses['RM']) {
                    totals.resistance_magique.value += specBonuses['RM'];
                    totals.resistance_magique.details.components.push({ label: 'Spécialisation', value: specBonuses['RM'] });
                }
                if (subSpecBonuses['RM']) {
                    totals.resistance_magique.value += subSpecBonuses['RM'];
                    totals.resistance_magique.details.components.push({ label: 'Sous-spécialisation', value: subSpecBonuses['RM'] });
                }

                // Marche (MVTm)
                if (specBonuses['MVTm']) {
                    totals.marche.value += specBonuses['MVTm'];
                    totals.marche.details.components.push({ label: 'Spécialisation', value: specBonuses['MVTm'] });
                }
                if (subSpecBonuses['MVTm']) {
                    totals.marche.value += subSpecBonuses['MVTm'];
                    totals.marche.details.components.push({ label: 'Sous-spécialisation', value: subSpecBonuses['MVTm'] });
                }

                // Course (MVTc)
                if (specBonuses['MVTc']) {
                    totals.course.value += specBonuses['MVTc'];
                    totals.course.details.components.push({ label: 'Spécialisation', value: specBonuses['MVTc'] });
                }
                if (subSpecBonuses['MVTc']) {
                    totals.course.value += subSpecBonuses['MVTc'];
                    totals.course.details.components.push({ label: 'Sous-spécialisation', value: subSpecBonuses['MVTc'] });
                }
                // -----------------------------------------------------------
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
    }, [data.characteristics.adresse.naturel, equippedValues, data.inventory, data.defenses, gameRules, data.identity.origine, refs]);



    if (characterLoading || refLoading) {
        return <div className="p-8 text-center text-leather">Chargement de la feuille de personnage...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 pb-20">
            <CharacterHeader
                characterData={data}
                identity={data.identity}
                vitals={data.vitals}
                generalStats={data.general}
                onIdentityChange={(newIdentity) => {
                    // Smart update logic to prevent resetting specs on gender swap
                    const updatedIdentity = { ...newIdentity };
                    const oldIdentity = data.identity;

                    if (!gameRules) {
                        // Fallback to simple logic if rules not loaded
                        if (updatedIdentity.metier !== oldIdentity.metier &&
                            !updatedIdentity.specialisation // Don't reset if already populated (by Header logic)
                        ) {
                            updatedIdentity.specialisation = '';
                            updatedIdentity.sous_specialisation = '';
                        }
                        if (updatedIdentity.specialisation !== oldIdentity.specialisation &&
                            !updatedIdentity.sous_specialisation // Don't reset if already populated
                        ) {
                            updatedIdentity.sous_specialisation = '';
                        }
                    } else {
                        // Advanced logic using IDs
                        const getMetierId = (name: string) => gameRules.metiers.find(m => m.name_m === name || m.name_f === name)?.id;
                        const getSpecId = (metierName: string, specName: string) => {
                            const m = gameRules.metiers.find(m => m.name_m === metierName || m.name_f === metierName);
                            return m?.specialisations?.find(s => s.name_m === specName || s.name_f === specName)?.id;
                        };

                        const oldMetierId = getMetierId(oldIdentity.metier);
                        const newMetierId = getMetierId(updatedIdentity.metier);

                        // If Metier changed ID (different job), clear specs
                        // BUT if Header already provided a valid spec (e.g. from gender swap logic), keep it!
                        if (oldMetierId !== newMetierId && !updatedIdentity.specialisation) {
                            updatedIdentity.specialisation = '';
                            updatedIdentity.sous_specialisation = '';
                        }

                        // Same for Specialization -> Sub-Spec
                        if (updatedIdentity.specialisation) {
                            const oldSpecId = getSpecId(oldIdentity.metier, oldIdentity.specialisation || '');
                            const newSpecId = getSpecId(updatedIdentity.metier, updatedIdentity.specialisation);

                            if (oldSpecId !== newSpecId) {
                                // Spec changed -> Reset Sub-Spec
                                if (!updatedIdentity.sous_specialisation) {
                                    updatedIdentity.sous_specialisation = '';
                                }
                            }
                        } else {
                            // Spec cleared
                            updatedIdentity.sous_specialisation = '';
                        }
                    }

                    // --- RESET LOGIC FOR COMPETENCES ---
                    let newCompetencesSpec = data.competences_specialisation;
                    let newCompetencesSubSpec = data.competences_sous_specialisation;

                    // 1. Specialization Changed ?
                    if (updatedIdentity.specialisation !== oldIdentity.specialisation) {
                        // Reset Spec Comps
                        newCompetencesSpec = [];
                        // Reset Sub-Spec identity (already handled above but enforcing consistency) & Comps
                        updatedIdentity.sous_specialisation = '';
                        newCompetencesSubSpec = [];
                    }
                    // 2. Sub-Specialization Changed ? (Only if spec didn't change, otherwise it's already wiped)
                    else if (updatedIdentity.sous_specialisation !== oldIdentity.sous_specialisation) {
                        // Reset Sub-Spec Comps
                        newCompetencesSubSpec = [];
                    }

                    setData({
                        ...data,
                        identity: updatedIdentity,
                        competences_specialisation: newCompetencesSpec,
                        competences_sous_specialisation: newCompetencesSubSpec
                    });
                }}
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
                competences={data.competences}
            />

            {/* Tab Navigation */}
            {/* Tab Navigation */}
            <div className="flex border-b-2 border-leather mb-6 overflow-x-auto whitespace-nowrap hide-scrollbar">
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
                    onClick={() => setActiveTab('sacoches')}
                    className={`px-6 py-2 font-bold text-lg transition-colors ${activeTab === 'sacoches' ? 'bg-leather text-parchment' : 'text-leather hover:bg-leather hover:text-parchment hover:bg-opacity-10'}`}
                >
                    Sacoches & Poches
                </button>
                <button
                    onClick={() => setActiveTab('sac')}
                    className={`px-6 py-2 font-bold text-lg transition-colors ${activeTab === 'sac' ? 'bg-leather text-parchment' : 'text-leather hover:bg-leather hover:text-parchment hover:bg-opacity-10'}`}
                >
                    Sac
                </button>
                <button
                    onClick={() => setActiveTab('status')}
                    className={`px-6 py-2 font-bold text-lg transition-colors ${activeTab === 'status' ? 'bg-leather text-parchment' : 'text-leather hover:bg-leather hover:text-parchment hover:bg-opacity-10'}`}
                >
                    État
                </button>
                <button
                    onClick={() => setActiveTab('competences')}
                    className={`px-6 py-2 font-bold text-lg transition-colors ${activeTab === 'competences' ? 'bg-leather text-parchment' : 'text-leather hover:bg-leather hover:text-parchment hover:bg-opacity-10'}`}
                >
                    Compétences
                </button>
                <button
                    onClick={() => setActiveTab('ape')}
                    className={`px-6 py-2 font-bold text-lg transition-colors ${activeTab === 'ape' ? 'bg-leather text-parchment' : 'text-leather hover:bg-leather hover:text-parchment hover:bg-opacity-10'}`}
                >
                    APE
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
                        globalModifiers={{
                            pi: (getAlcoholModifiers(data.status || INITIAL_DATA.status).leger.pi || 0) +
                                (getAlcoholModifiers(data.status || INITIAL_DATA.status).fort.pi || 0) +
                                (getAlcoholModifiers(data.status || INITIAL_DATA.status).gueule_de_bois.pi || 0)
                        }}
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

            {/* Equipement (Inventory)*/}
            <div className={activeTab === 'equipement' ? 'animate-fade-in' : 'hidden'}>
                <Inventory
                    inventory={data.inventory}
                    onInventoryChange={(inventory) => setData({ ...data, inventory })}
                    characterForce={equippedValues.force.value}
                    bouclierActif={data.defenses.bouclier_actif}
                />
            </div>

            {/* Sacoches et Poches */}
            <div className={activeTab === 'sacoches' ? 'animate-fade-in' : 'hidden'}>
                <SacochesEtPoches
                    inventory={data.inventory}
                    onInventoryChange={(inventory) => setData({ ...data, inventory })}
                    characterForce={equippedValues.force.value}
                />
            </div>

            {/* Sac */}
            <div className={activeTab === 'sac' ? 'animate-fade-in' : 'hidden'}>
                <SacPanel
                    inventory={data.inventory}
                    onInventoryChange={(inventory) => setData({ ...data, inventory })}
                    customItems={data.custom_sac_items}
                    onCustomItemsChange={(custom_sac_items) => setData({ ...data, custom_sac_items })}
                />
            </div>

            {/* Compétences (CompetencesPanel)*/}
            <div className={activeTab === 'competences' ? 'animate-fade-in' : 'hidden'}>
                <CompetencesPanel
                    title="Compétences origine et métier"
                    competences={data.competences || []}
                    onCompetencesChange={(newCompetences) => {
                        const processed = applyCompetenceRules(newCompetences, data, gameRules, referenceCompetences);
                        setData({ ...data, competences: processed });
                    }}
                />

                {/* Specialization Competencies */}
                {data.identity.specialisation && (
                    <SpecializationCompetencesPanel
                        title={`Spécialisation : ${data.identity.specialisation}`}
                        competences={data.competences_specialisation || []}
                        onCompetencesChange={(newComps) => setData({ ...data, competences_specialisation: newComps })}
                        identity={data.identity}
                        type="specialisation"
                        globalCompetences={data.competences || []}
                    />
                )}

                {/* Sub-Specialization Competencies */}
                {data.identity.sous_specialisation && (
                    <SpecializationCompetencesPanel
                        title={`Sous-Spécialisation : ${data.identity.sous_specialisation}`}
                        competences={data.competences_sous_specialisation || []}
                        onCompetencesChange={(newComps) => setData({ ...data, competences_sous_specialisation: newComps })}
                        identity={data.identity}
                        type="sous_specialisation"
                        globalCompetences={data.competences || []}
                    />
                )}

                {/* Preux Chevalier Domain Selection */}
                {gameRules && data.identity.metier && data.identity.specialisation && data.identity.sous_specialisation && (() => {
                    const currentMetier = gameRules.metiers.find(m => m.name_m === data.identity.metier || m.name_f === data.identity.metier);
                    const spec = currentMetier?.specialisations?.find(s => s.name_m === data.identity.specialisation || s.name_f === data.identity.specialisation);
                    const subSpec = spec?.sous_specialisations?.find(s => s.name_m === data.identity.sous_specialisation || s.name_f === data.identity.sous_specialisation);

                    return subSpec?.id === 'preux_chevalier';
                })() && (
                        <DomainPanel
                            domaines={gameRules.domaines || []}
                            selectedDomaine={data.identity.domaine}
                            onDomaineChange={(dom) => setData({ ...data, identity: { ...data.identity, domaine: dom } })}
                        />
                    )}


            </div>

            {/* Etat (StatusPanel) */}
            <div className={activeTab === 'status' ? 'animate-fade-in' : 'hidden'}>
                <StatusPanel
                    status={data.status || INITIAL_DATA.status}
                    description={data.identity.description}
                    onChange={(newStatus) => setData({ ...data, status: newStatus })}
                    onDescriptionChange={(desc) => setData({ ...data, identity: { ...data.identity, description: desc } })}
                />
            </div>

            {/* APE Tab */}
            <div className={activeTab === 'ape' ? 'animate-fade-in' : 'hidden'}>
                <APE
                    ape={data.ape || []}
                    onApeChange={(ape) => setData({ ...data, ape })}
                    origin={data.identity.origine}
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
