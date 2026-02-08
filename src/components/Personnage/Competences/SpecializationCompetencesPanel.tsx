
import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Competence, CharacterCompetence, GameRules } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { SearchableSelect } from '../../Shared/SearchableSelect';

interface SpecializationCompetencesPanelProps {
    title: string;
    competences: CharacterCompetence[];
    onCompetencesChange: (competences: CharacterCompetence[]) => void;
    identity: {
        metier: string;
        specialisation?: string;
        sous_specialisation?: string;
    };
    type: 'specialisation' | 'sous_specialisation';
    globalCompetences: CharacterCompetence[]; // Main character competences for checking requirements
}

export const SpecializationCompetencesPanel: React.FC<SpecializationCompetencesPanelProps> = ({
    title,
    competences,
    onCompetencesChange,
    identity,
    type,
    globalCompetences
}) => {
    const [rules, setRules] = useState<GameRules | null>(null);
    const [referenceCompetences, setReferenceCompetences] = useState<Competence[]>([]);

    useEffect(() => {
        invoke<GameRules>('get_game_rules')
            .then(setRules)
            .catch(err => console.error("Failed to load game rules:", err));

        invoke<Competence[]>('get_competences')
            .then(setReferenceCompetences)
            .catch(err => console.error("Failed to fetch reference competences:", err));
    }, []);

    // Effect to sync mandatory competencies
    useEffect(() => {
        if (!rules || !identity.metier) return;

        const currentMetier = rules.metiers.find(m => m.name_m === identity.metier || m.name_f === identity.metier);
        if (!currentMetier) return;


        let requiredComps: string[] = [];
        let isFossoyeur = false;

        if (type === 'specialisation' && identity.specialisation) {
            const spec = currentMetier.specialisations?.find(s => s.name_m === identity.specialisation || s.name_f === identity.specialisation);
            if (spec && spec.competences) {
                requiredComps = spec.competences;
            }
        }
        else if (type === 'sous_specialisation' && identity.specialisation && identity.sous_specialisation) {
            const spec = currentMetier.specialisations?.find(s => s.name_m === identity.specialisation || s.name_f === identity.specialisation);
            const subSpec = spec?.sous_specialisations?.find(s => s.name_m === identity.sous_specialisation || s.name_f === identity.sous_specialisation);

            if (subSpec) {
                if (subSpec.competences_obligatoires) {
                    requiredComps = [...subSpec.competences_obligatoires];
                }

                // Check if it's Fossoyeur d'armées
                if (subSpec.id === 'fossoyeur_armees') {
                    isFossoyeur = true;
                }
            }
        }

        // --- FOSSOYEUR D'ARMEES SPECIFIC LOGIC ---
        if (isFossoyeur) {
            // 1. Remove "Intimider" and "Chercher des noises" from the default mandatory list
            //    (Because we handle them conditionally)
            requiredComps = requiredComps.filter(c => c !== 'Intimider' && c !== 'Chercher des noises');

            // 2. Check Global Competences
            const hasIntimider = globalCompetences.some(c => c.nom === 'Intimider');
            const hasChercher = globalCompetences.some(c => c.nom === 'Chercher des noises');

            // 3. Logic:
            //    - If has Intimider -> Add Chercher des noises
            //    - If has Chercher -> Add Intimider

            if (hasIntimider && !hasChercher) {
                requiredComps.push('Chercher des noises');
            } else if (hasChercher && !hasIntimider) {
                requiredComps.push('Intimider');
            }
        }
        // -----------------------------------------

        // --- BONUS LOGIC: "Les yeux révolver" ---
        // Applies to ANY Specialization/Sub-Spec that allows this choice (currently Fossoyeur)
        // Check if "Les yeux révolver" is selected in THIS panel
        const hasYeux = competences.some(c => c.nom === 'Les yeux révolver' || c.nom === 'Les yeux révolvers'); // handling typo just in case

        if (hasYeux) {
            const globalHasT1 = globalCompetences.some(c => c.nom === 'Terrifiant I');

            if (globalHasT1) {
                requiredComps.push('Terrifiant II');
            } else {
                requiredComps.push('Terrifiant I');
            }
        }
        // ----------------------------------------

        // Sync logic: Ensure required comps are present
        // We do strictly additive specific logic here to avoid wiping user data accidentally
        let newCompetences = [...competences];
        let hasChanges = false;

        // 1. Enforce Required
        requiredComps.forEach(reqName => {
            const exists = newCompetences.find(c => c.nom === reqName);
            if (!exists) {
                const refComp = referenceCompetences.find(r => r.nom === reqName);
                newCompetences.push({
                    id: uuidv4(),
                    nom: reqName,
                    description: refComp?.description || '',
                    tableau: refComp?.tableau
                });
                hasChanges = true;
            }
        });

        // Remove mandatory skills that are NO LONGER required (e.g. if conditions changed)
        // BUT ONLY if they were added as mandatory (we can't easily track that without a flag, 
        // but for Fossoyeur we know specifically we might need to remove them if condition fails)
        if (isFossoyeur) {
            const toRemoveNames = ['Intimider', 'Chercher des noises', 'Terrifiant I', 'Terrifiant II']; // Added Terrifiant to tracked
            const shouldHaveNames = requiredComps.filter(name => toRemoveNames.includes(name));

            const currentNames = newCompetences.map(c => c.nom);
            const unwanted = currentNames.filter(name => toRemoveNames.includes(name) && !shouldHaveNames.includes(name));

            if (unwanted.length > 0) {
                newCompetences = newCompetences.filter(c => !unwanted.includes(c.nom));
                hasChanges = true;
            }
        }

        // 2. Handle Choices (Initial population of empty slots if needed, but easier to let user add)
        // Actually, for choices, we should probably just ensure the user can't add more than allowed
        // or facilitate the UI for it.
        // For now, we'll just handle mandatory ones automatically.

        if (hasChanges) {
            onCompetencesChange(newCompetences);
        }

    }, [rules, identity, type, referenceCompetences, globalCompetences, competences]); // Added competences to dep array

    const handleRemoveRow = (id: string) => {
        onCompetencesChange(competences.filter(c => c.id !== id));
    };

    // Determine if a competence is read-only (mandatory)
    const isMandatory = (compName: string) => {
        if (!rules || !identity.metier) return false;
        const currentMetier = rules.metiers.find(m => m.name_m === identity.metier || m.name_f === identity.metier);

        let requiredComps: string[] = [];
        let isFossoyeur = false;

        if (type === 'specialisation' && identity.specialisation) {
            const spec = currentMetier?.specialisations?.find(s => s.name_m === identity.specialisation || s.name_f === identity.specialisation);
            if (spec?.competences) requiredComps = spec.competences;
        }
        else if (type === 'sous_specialisation' && identity.specialisation && identity.sous_specialisation) {
            const spec = currentMetier?.specialisations?.find(s => s.name_m === identity.specialisation || s.name_f === identity.specialisation);
            const subSpec = spec?.sous_specialisations?.find(s => s.name_m === identity.sous_specialisation || s.name_f === identity.sous_specialisation);

            if (subSpec?.competences_obligatoires) requiredComps = [...subSpec.competences_obligatoires];
            if (subSpec?.id === 'fossoyeur_armees') isFossoyeur = true;
        }

        // Apply same dynamic logic
        if (isFossoyeur) {
            requiredComps = requiredComps.filter(c => c !== 'Intimider' && c !== 'Chercher des noises');
            const hasIntimider = globalCompetences.some(c => c.nom === 'Intimider');
            const hasChercher = globalCompetences.some(c => c.nom === 'Chercher des noises');

            if (hasIntimider && !hasChercher) requiredComps.push('Chercher des noises');
            else if (hasChercher && !hasIntimider) requiredComps.push('Intimider');

            const hasYeux = competences.some(c => c.nom === 'Les yeux révolver' || c.nom === 'Les yeux révolvers');
            if (hasYeux) {
                const globalHasT1 = globalCompetences.some(c => c.nom === 'Terrifiant I');
                requiredComps.push(globalHasT1 ? 'Terrifiant II' : 'Terrifiant I');
            }
        }

        return requiredComps.includes(compName);
    };

    // Filter for choice dropdown
    const getChoiceOptions = () => {
        if (!rules || !identity.metier) return [];
        const currentMetier = rules.metiers.find(m => m.name_m === identity.metier || m.name_f === identity.metier);

        if (type === 'sous_specialisation' && identity.specialisation && identity.sous_specialisation) {
            const spec = currentMetier?.specialisations?.find(s => s.name_m === identity.specialisation || s.name_f === identity.specialisation);
            const subSpec = spec?.sous_specialisations?.find(s => s.name_m === identity.sous_specialisation || s.name_f === identity.sous_specialisation);

            if (subSpec && subSpec.competences_choix) {
                // Filter out already selected ones
                const selectedNames = competences.map(c => c.nom);
                return subSpec.competences_choix
                    .filter((name: string) => !selectedNames.includes(name))
                    .map((name: string) => ({ id: name, label: name }));
            }
        }
        return [];
    };

    const handleAddChoice = () => {
        // Just add an empty row, user selects from dropdown which is filtered
        const newCompetence: CharacterCompetence = {
            id: uuidv4(),
            nom: '',
            description: ''
        };
        onCompetencesChange([...competences, newCompetence]);
    };

    const handleSelectChange = (id: string, name: string) => {
        const refComp = referenceCompetences.find(c => c.nom === name);
        onCompetencesChange(competences.map(c => {
            if (c.id === id) {
                return {
                    ...c,
                    nom: name,
                    description: refComp?.description || '',
                    tableau: refComp?.tableau
                };
            }
            return c;
        }));
    };

    // Max choices check
    const getMaxChoices = () => {
        if (!rules || !identity.metier) return 0;
        if (type === 'sous_specialisation' && identity.specialisation && identity.sous_specialisation) {
            const currentMetier = rules.metiers.find(m => m.name_m === identity.metier || m.name_f === identity.metier);
            const spec = currentMetier?.specialisations?.find(s => s.name_m === identity.specialisation || s.name_f === identity.specialisation);
            const subSpec = spec?.sous_specialisations?.find(s => s.name_m === identity.sous_specialisation || s.name_f === identity.sous_specialisation);
            return subSpec?.nombre_competences_choix || 0;
        }
        return 0;
    };

    const currentChoicesCount = competences.filter(c => !isMandatory(c.nom)).length;
    const maxChoices = getMaxChoices();
    const canAddMore = type === 'sous_specialisation' && currentChoicesCount < maxChoices;

    return (
        <div className="mb-6 p-6 bg-parchment/30 rounded-lg shadow-sm border border-leather/20 relative">
            <h3 className="text-xl font-bold text-leather-dark font-serif tracking-wide mb-4">{title}</h3>
            <div className="overflow-x-auto border border-leather rounded bg-parchment-light">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="bg-leather text-parchment">
                            <th className="p-3 border-b border-leather w-1/3">Compétence</th>
                            <th className="p-3 border-b border-leather">Description</th>
                            <th className="p-3 border-b border-leather w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {competences.map((comp) => {
                            const forced = isMandatory(comp.nom);
                            return (
                                <tr key={comp.id} className="even:bg-parchment hover:bg-parchment-dark transition-colors border-b border-leather/20 last:border-0">
                                    <td className="p-3 align-top">
                                        {forced ? (
                                            <span className="font-bold text-leather-dark">{comp.nom}</span>
                                        ) : (
                                            <SearchableSelect
                                                options={getChoiceOptions().concat({ id: comp.nom, label: comp.nom })} // Ensure current value is in options
                                                value={comp.nom}
                                                onChange={(val) => handleSelectChange(comp.id, val)}
                                                className="w-full"
                                                placeholder="Choisir..."
                                            />
                                        )}
                                    </td>
                                    <td className="p-3 align-top text-sm text-leather-dark">
                                        {comp.description}
                                    </td>
                                    <td className="p-3 align-top text-center">
                                        {!forced && (
                                            <button
                                                onClick={() => handleRemoveRow(comp.id)}
                                                className="text-red-600 hover:text-red-800 font-bold"
                                                title="Supprimer"
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {competences.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-4 text-center italic text-leather/70">
                                    Aucune compétence requise.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {canAddMore && (
                <div className="mt-2 text-right">
                    <button
                        onClick={handleAddChoice}
                        className="px-3 py-1 bg-leather text-parchment font-serif font-bold rounded hover:bg-leather-dark active:scale-95 transition-all shadow-sm"
                    >
                        + Ajouter compétence au choix ({currentChoicesCount}/{maxChoices})
                    </button>
                </div>
            )}
        </div>
    );
};
