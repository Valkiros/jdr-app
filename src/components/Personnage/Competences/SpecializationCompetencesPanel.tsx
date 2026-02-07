
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
}

export const SpecializationCompetencesPanel: React.FC<SpecializationCompetencesPanelProps> = ({
    title,
    competences,
    onCompetencesChange,
    identity,
    type
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
                if (subSpec.competences_obligatoires) requiredComps = subSpec.competences_obligatoires;
            }
        }

        // Sync logic: Ensure required comps are present
        // We do strictly additive specific logic here to avoid wiping user data accidentally
        // But for required specs, we should enforce them.

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

        // 2. Handle Choices (Initial population of empty slots if needed, but easier to let user add)
        // Actually, for choices, we should probably just ensure the user can't add more than allowed
        // or facilitate the UI for it.
        // For now, we'll just handle mandatory ones automatically.

        if (hasChanges) {
            onCompetencesChange(newCompetences);
        }

    }, [rules, identity, type, referenceCompetences]); // Check dependencies carefully to avoid loops

    const handleRemoveRow = (id: string) => {
        onCompetencesChange(competences.filter(c => c.id !== id));
    };

    // Determine if a competence is read-only (mandatory)
    const isMandatory = (compName: string) => {
        if (!rules || !identity.metier) return false;
        const currentMetier = rules.metiers.find(m => m.name_m === identity.metier || m.name_f === identity.metier);

        if (type === 'specialisation' && identity.specialisation) {
            const spec = currentMetier?.specialisations?.find(s => s.name_m === identity.specialisation || s.name_f === identity.specialisation);
            return spec?.competences?.includes(compName);
        }
        else if (type === 'sous_specialisation' && identity.specialisation && identity.sous_specialisation) {
            const spec = currentMetier?.specialisations?.find(s => s.name_m === identity.specialisation || s.name_f === identity.specialisation);
            const subSpec = spec?.sous_specialisations?.find(s => s.name_m === identity.sous_specialisation || s.name_f === identity.sous_specialisation);
            return subSpec?.competences_obligatoires?.includes(compName);
        }
        return false;
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
