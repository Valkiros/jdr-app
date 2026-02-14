import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { Identity, Vitals, CharacterData, GameRules, Origine, Metier, Requirements, Characteristics, GeneralStats } from '../../../types';
import { VitalsPanel } from './VitalsPanel';
import { Tooltip } from '../../Shared/Tooltip';
import { SmartInput } from '../../Shared/SmartInput';

interface CharacterHeaderProps {
    identity: Identity;
    vitals: Vitals;
    generalStats: GeneralStats;
    characterData: CharacterData;
    onIdentityChange: (identity: Identity) => void;
    onVitalsChange: (vitals: Vitals) => void;
    onGeneralChange: (stats: GeneralStats) => void;
    competences: CharacterData['competences']; // Add competences prop to check requirements
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = ({
    identity,
    vitals,
    generalStats,
    characterData,
    onIdentityChange,
    onVitalsChange,
    onGeneralChange,
    competences // Destructure new prop
}) => {
    const [rules, setRules] = useState<GameRules | null>(null);
    const [hoveredSpec, setHoveredSpec] = useState<any | null>(null); // For tooltip

    useEffect(() => {
        invoke<GameRules>('get_game_rules')
            .then(setRules)
            .catch(err => console.error("Failed to load game rules:", err));
    }, []);

    const handleIdentityChange = (field: keyof Identity, value: string) => {
        let newIdentity = { ...identity, [field]: value };

        if (field === 'sexe' && rules) {
            const isMale = value === 'Masculin';

            // Sync Origine
            if (identity.origine) {
                const currentObj = rules.origines.find(o => o.name_m === identity.origine || o.name_f === identity.origine);
                if (currentObj) {
                    const rawName = isMale ? currentObj.name_m : currentObj.name_f;
                    // Apply same fallback logic as renderOptions
                    newIdentity.origine = rawName || (isMale ? currentObj.name_f : currentObj.name_m) || currentObj.name_m;
                }
            }

            // Sync Metier
            if (identity.metier) {
                const currentMetier = rules.metiers.find(m => m.name_m === identity.metier || m.name_f === identity.metier);
                if (currentMetier) {
                    const rawNameMetier = isMale ? currentMetier.name_m : currentMetier.name_f;
                    newIdentity.metier = rawNameMetier || (isMale ? currentMetier.name_f : currentMetier.name_m) || currentMetier.name_m;

                    // Sync Specialisation (Dependent on Metier)
                    if (identity.specialisation) {
                        const currentSpec = currentMetier.specialisations?.find(s => s.name_m === identity.specialisation || s.name_f === identity.specialisation);
                        if (currentSpec) {
                            const rawNameSpec = isMale ? currentSpec.name_m : currentSpec.name_f;
                            newIdentity.specialisation = rawNameSpec || (isMale ? currentSpec.name_f : currentSpec.name_m) || currentSpec.name_m;

                            // Sync Sous-Specialisation (Dependent on Specialisation)
                            if (identity.sous_specialisation) {
                                const currentSubSpec = currentSpec.sous_specialisations?.find(s => s.name_m === identity.sous_specialisation || s.name_f === identity.sous_specialisation);
                                if (currentSubSpec) {
                                    const rawNameSub = isMale ? currentSubSpec.name_m : currentSubSpec.name_f;
                                    newIdentity.sous_specialisation = rawNameSub || (isMale ? currentSubSpec.name_f : currentSubSpec.name_m) || currentSubSpec.name_m;
                                }
                            }
                        }
                    }
                }
            }
        }

        onIdentityChange(newIdentity);
    };

    const handleImageClick = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Images',
                    extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif']
                }]
            });

            if (selected && typeof selected === 'string') {
                // Read binary file
                const contents = await readFile(selected);

                // Convert to Base64
                const base64String = btoa(
                    new Uint8Array(contents)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
                );

                // Determine Mime Type (basic detection)
                const ext = selected.split('.').pop()?.toLowerCase() || 'jpg';
                let mime = 'image/jpeg';
                if (ext === 'png') mime = 'image/png';
                else if (ext === 'webp') mime = 'image/webp';
                else if (ext === 'gif') mime = 'image/gif';

                const dataUrl = `data:${mime};base64,${base64String}`;
                handleIdentityChange('avatar_url', dataUrl);
            }
        } catch (err) {
            console.error('Failed to open dialog or read file:', err);
        }
    };

    const getMissingMinRequirements = (req: Requirements, stats: Characteristics): string[] => {
        const missingMin: string[] = [];
        if (req.COUR && (stats.courage.naturel || 0) < req.COUR) missingMin.push(`COU ${req.COUR}`);
        if (req.INT && (stats.intelligence.naturel || 0) < req.INT) missingMin.push(`INT ${req.INT}`);
        if (req.CHA && (stats.charisme.naturel || 0) < req.CHA) missingMin.push(`CHA ${req.CHA}`);
        if (req.AD && (stats.adresse.naturel || 0) < req.AD) missingMin.push(`AD ${req.AD}`);
        if (req.FO && (stats.force.naturel || 0) < req.FO) missingMin.push(`FO ${req.FO}`);
        return missingMin;
    };

    const getMissingMaxRequirements = (req: Requirements, stats: Characteristics): string[] => {
        const missingMax: string[] = [];
        if (req.COUR && (stats.courage.naturel || 0) > req.COUR) missingMax.push(`COU ${req.COUR}`);
        if (req.INT && (stats.intelligence.naturel || 0) > req.INT) missingMax.push(`INT ${req.INT}`);
        if (req.CHA && (stats.charisme.naturel || 0) > req.CHA) missingMax.push(`CHA ${req.CHA}`);
        if (req.AD && (stats.adresse.naturel || 0) > req.AD) missingMax.push(`AD ${req.AD}`);
        if (req.FO && (stats.force.naturel || 0) > req.FO) missingMax.push(`FO ${req.FO}`);
        return missingMax;
    };

    const renderOptions = (items: (Origine | Metier)[]) => {
        // Find current Origine to check for forbidden metiers
        const currentOrigine = rules?.origines.find(o => o.name_m === identity.origine || o.name_f === identity.origine);

        const optionsWithStatus = items.map(item => {
            const isMale = identity.sexe === 'Masculin';
            const name = isMale ? item.name_m : item.name_f;
            // Fallback if empty name
            const label = name || (isMale ? item.name_f : item.name_m) || item.name_m;

            const missingMin = getMissingMinRequirements(item.min, characterData.characteristics);
            const missingMax = getMissingMaxRequirements(item.max, characterData.characteristics);
            let isDisabled = missingMin.length > 0 || missingMax.length > 0;
            let displayLabel = label;
            let isForbidden = false;

            // Check if blocked by Origine
            // We verify if it is a Metier (has specialisations) and if the current origin blocks it
            if (currentOrigine && currentOrigine.metiers_impossibles && 'specialisations' in item) {
                if (currentOrigine.metiers_impossibles.includes(String(item.id))) {
                    isForbidden = true;
                    isDisabled = true;
                }
            }

            // Exception: Troll Ménestrel
            // Si l'origine est Troll et le métier est Ménestrel, on autorise tout
            if (currentOrigine && (currentOrigine.name_m === 'Troll' || currentOrigine.name_f === 'Troll')) {
                if (item.name_m === 'Ménestrel' || item.name_f === 'Ménestrel') {
                    isForbidden = false;
                    isDisabled = false;
                    // On vide les tableaux pour ne pas afficher les restrictions
                    missingMin.length = 0;
                    missingMax.length = 0;
                }
            }

            if (isForbidden) {
                displayLabel = `${label} (Bloqué par l'origine)`;
            } else if (missingMin.length > 0 && missingMax.length > 0) {
                displayLabel = `${label} ( Min: ${missingMin.join(', ')} || Max: ${missingMax.join(', ')} )`;
            } else if (missingMin.length > 0) {
                displayLabel = `${label} ( Min: ${missingMin.join(', ')} )`;
            } else if (missingMax.length > 0) {
                displayLabel = `${label} ( Max: ${missingMax.join(', ')} )`;
            }

            return {
                id: item.id,
                label,
                displayLabel,
                isDisabled
            };
        });

        const sortedOptions = optionsWithStatus.sort((a, b) => {
            // 1. Availability: Available (false) before Disabled (true)
            if (a.isDisabled !== b.isDisabled) {
                return a.isDisabled ? 1 : -1;
            }
            // 2. Alphabetical
            return a.label.localeCompare(b.label);
        });

        return sortedOptions.map(({ id, label, displayLabel, isDisabled }) => (
            <option key={id} value={label} disabled={isDisabled}>
                {displayLabel}
            </option>
        ));
    };

    return (

        <div className="flex flex-col gap-6 p-4 bg-parchment/30 rounded-lg border border-leather/50 relative">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Image Placeholder */}
                <div className="relative group w-full md:w-48 h-48">
                    <div onClick={handleImageClick} className="w-full h-full bg-leather/10 border-2 border-leather border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-leather/20 transition-colors">
                        {identity.avatar_url ? (
                            <img src={identity.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded" />
                        ) : (
                            <span className="text-leather/50 font-serif">Image</span>
                        )}
                    </div>
                    {identity.avatar_url && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleIdentityChange('avatar_url', '');
                            }}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            title="Supprimer l'image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Identity Fields Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                    {/* Tooltip for Specs */}
                    {hoveredSpec && (
                        <Tooltip
                            visible={!!hoveredSpec}
                            position={{ x: hoveredSpec.x, y: hoveredSpec.y }}
                            title={hoveredSpec.title}
                            requireCtrl={true}
                            direction="auto"
                        >
                            {Object.entries(hoveredSpec.data).map(([key, value]) => (
                                <div key={key} className="text-tooltip-text flex gap-2">
                                    <span className="font-bold min-w-[10px]">-</span>
                                    <span>{String(value)}</span>
                                </div>
                            ))}
                        </Tooltip>
                    )}

                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-leather-light">Nom</label>
                        <SmartInput
                            value={identity.nom}
                            onCommit={(val) => handleIdentityChange('nom', String(val))}
                            className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark"
                            placeholder="Nom du personnage"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-leather-light">Sexe</label>
                        <select
                            value={identity.sexe}
                            onChange={(e) => handleIdentityChange('sexe', e.target.value)}
                            className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark appearance-none"
                        >
                            <option value="">Sélectionner</option>
                            <option value="Masculin">Masculin</option>
                            <option value="Féminin">Féminin</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-leather-light">Origine</label>
                        <select
                            value={identity.origine}
                            onChange={(e) => handleIdentityChange('origine', e.target.value)}
                            className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark appearance-none"
                        >
                            <option value="">Sélectionner</option>
                            {rules && renderOptions(rules.origines)}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-leather-light">Métier</label>
                        <select
                            value={identity.metier}
                            onChange={(e) => handleIdentityChange('metier', e.target.value)}
                            className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark appearance-none"
                        >
                            <option value="">Sélectionner</option>
                            {rules && renderOptions(rules.metiers)}
                        </select>
                    </div>

                    {/* Specialisation Selector */}
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-leather-light flex items-center justify-between">
                            Spécialisation
                            <span className="text-[10px] text-gray-500">(Niv 5+)</span>
                        </label>
                        <div className="relative">
                            <select
                                value={identity.specialisation || ''}
                                onChange={(e) => handleIdentityChange('specialisation', e.target.value)}
                                onMouseEnter={(e) => {
                                    if (!identity.specialisation || !rules) return;
                                    const currentMetier = rules.metiers.find(m => m.name_m === identity.metier || m.name_f === identity.metier);
                                    if (!currentMetier || !currentMetier.specialisations) return;

                                    const spec = currentMetier.specialisations.find(s => s.name_m === identity.specialisation || s.name_f === identity.specialisation);
                                    if (spec && spec.attributs_specifiques) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setHoveredSpec({
                                            title: identity.specialisation,
                                            data: spec.attributs_specifiques,
                                            x: rect.left + (rect.width / 2),
                                            y: rect.top
                                        });
                                    }
                                }}
                                onMouseLeave={() => setHoveredSpec(null)}
                                disabled={generalStats.niveau < 5}
                                className={`w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark appearance-none cursor-help ${generalStats.niveau < 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Sélectionner</option>
                                {rules && identity.metier && (() => {
                                    const currentMetier = rules.metiers.find(m => m.name_m === identity.metier || m.name_f === identity.metier);

                                    if (!currentMetier || !currentMetier.specialisations) return null;

                                    return currentMetier.specialisations.map(spec => {
                                        const isMale = identity.sexe === 'Masculin';
                                        const label = isMale ? spec.name_m : spec.name_f;
                                        // Check requirements
                                        let disabled = false;
                                        let reason = "";

                                        if (spec.necessite_competence && spec.necessite_competence.length > 0) {
                                            const missingComps = spec.necessite_competence.filter(req =>
                                                !competences?.some(c => c.nom.toLowerCase() === req.toLowerCase())
                                            );

                                            if (missingComps.length > 0) {
                                                disabled = true;
                                                reason = `(Req: ${missingComps.join(', ')})`;
                                            }
                                        }

                                        return (
                                            <option key={spec.id} value={label} disabled={disabled}>
                                                {label} {reason}
                                            </option>
                                        );
                                    });
                                })()}
                            </select>
                        </div>
                    </div>

                    {/* Sous-Specialisation Selector */}
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-leather-light flex items-center justify-between">
                            Sous-Spécialisation
                            <span className="text-[10px] text-gray-500">(Niv 10+)</span>
                        </label>
                        <div className="relative">
                            <select
                                value={identity.sous_specialisation || ''}
                                onChange={(e) => handleIdentityChange('sous_specialisation', e.target.value)}
                                onMouseEnter={(e) => {
                                    if (!identity.sous_specialisation || !rules || !identity.specialisation) return;
                                    const currentMetier = rules.metiers.find(m => m.name_m === identity.metier || m.name_f === identity.metier);
                                    const currentSpec = currentMetier?.specialisations?.find(s => s.name_m === identity.specialisation || s.name_f === identity.specialisation);
                                    const subSpec = currentSpec?.sous_specialisations?.find(s => s.name_m === identity.sous_specialisation || s.name_f === identity.sous_specialisation);

                                    if (subSpec && subSpec.attributs_specifiques) {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setHoveredSpec({
                                            title: identity.sous_specialisation,
                                            data: subSpec.attributs_specifiques,
                                            x: rect.left + (rect.width / 2),
                                            y: rect.top
                                        });
                                    }
                                }}
                                onMouseLeave={() => setHoveredSpec(null)}
                                disabled={generalStats.niveau < 10 || !identity.specialisation}
                                className={`w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark appearance-none cursor-help ${generalStats.niveau < 10 || !identity.specialisation ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Sélectionner</option>
                                {rules && identity.specialisation && (() => {
                                    const currentMetier = rules.metiers.find(m => m.name_m === identity.metier || m.name_f === identity.metier);
                                    const currentSpec = currentMetier?.specialisations?.find(s => s.name_m === identity.specialisation || s.name_f === identity.specialisation);

                                    if (!currentSpec || !currentSpec.sous_specialisations) return null;

                                    return currentSpec.sous_specialisations.map(sub => {
                                        const isMale = identity.sexe === 'Masculin';
                                        const label = isMale ? sub.name_m : sub.name_f;
                                        // Check requirements
                                        let disabled = false;
                                        let reason = "";

                                        if (sub.necessite_competence && sub.necessite_competence.length > 0) {
                                            const missingComps = sub.necessite_competence.filter(req =>
                                                !competences?.some(c => c.nom.toLowerCase() === req.toLowerCase())
                                            );

                                            if (missingComps.length > 0) {
                                                disabled = true;
                                                reason = `(Req: ${missingComps.join(', ')})`;
                                            }
                                        }

                                        return (
                                            <option key={label} value={label} disabled={disabled}>
                                                {label} {reason}
                                            </option>
                                        );
                                    });
                                })()}
                            </select>
                        </div>
                    </div>

                    {/* General Stats Integrated */}
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-leather-light">Niveau</label>
                        <div className="w-full bg-transparent border-b border-leather py-1 font-serif text-lg text-leather-dark font-bold">
                            {generalStats.niveau}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-leather-light">Expérience</label>
                        <SmartInput
                            type="number"
                            value={generalStats.experience || 0}
                            onCommit={(val) => onGeneralChange({ ...generalStats, experience: Number(val) || 0 })}
                            className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-leather-light">Points de Destin</label>
                        <SmartInput
                            type="number"
                            value={generalStats.points_destin || 0}
                            onCommit={(val) => onGeneralChange({ ...generalStats, points_destin: Number(val) || 0 })}
                            className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark"
                        />
                    </div>
                </div>
            </div>

            {/* Vitals Section - Always Visible */}
            <div className="pt-2">
                <VitalsPanel
                    vitals={vitals}
                    onChange={onVitalsChange}
                    origine={identity.origine}
                    corruptionRules={rules ? { origine: rules.corruption_origine, palier: rules.corruption_palier } : null}
                />
            </div>
        </div>
    );
};
