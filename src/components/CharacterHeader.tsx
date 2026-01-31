import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';
import { Identity, Vitals, CharacterData, GameRules, Origine, Metier, Requirements, Characteristics } from '../types';
import { VitalsPanel } from './VitalsPanel';

interface CharacterHeaderProps {
    identity: Identity;
    vitals: Vitals;
    characterData: CharacterData;
    onIdentityChange: (identity: Identity) => void;
    onVitalsChange: (vitals: Vitals) => void;
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = ({
    identity,
    vitals,
    characterData,
    onIdentityChange,
    onVitalsChange
}) => {
    const [rules, setRules] = useState<GameRules | null>(null);

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
                const currentObj = rules.metiers.find(m => m.name_m === identity.metier || m.name_f === identity.metier);
                if (currentObj) {
                    const rawName = isMale ? currentObj.name_m : currentObj.name_f;
                    newIdentity.metier = rawName || (isMale ? currentObj.name_f : currentObj.name_m) || currentObj.name_m;
                }
            }
        }

        onIdentityChange(newIdentity);
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

    const getMissingRequirements = (req: Requirements, stats: Characteristics): string[] => {
        const missing: string[] = [];
        if (req.COUR && (stats.courage.naturel || 0) < req.COUR) missing.push(`COU ${req.COUR}`);
        if (req.INT && (stats.intelligence.naturel || 0) < req.INT) missing.push(`INT ${req.INT}`);
        if (req.CHA && (stats.charisme.naturel || 0) < req.CHA) missing.push(`CHA ${req.CHA}`);
        if (req.AD && (stats.adresse.naturel || 0) < req.AD) missing.push(`AD ${req.AD}`);
        if (req.FO && (stats.force.naturel || 0) < req.FO) missing.push(`FO ${req.FO}`);
        return missing;
    };

    const renderOptions = (items: (Origine | Metier)[]) => {
        const optionsWithStatus = items.map(item => {
            const isMale = identity.sexe === 'Masculin';
            const name = isMale ? item.name_m : item.name_f;
            // Fallback if empty name
            const label = name || (isMale ? item.name_f : item.name_m) || item.name_m;

            const missing = getMissingRequirements(item.min, characterData.characteristics);
            const isDisabled = missing.length > 0;
            const displayLabel = isDisabled ? `${label} ( Min: ${missing.join(', ')} )` : label;

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
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-leather-light">Nom</label>
                        <input
                            type="text"
                            value={identity.nom}
                            onChange={(e) => handleIdentityChange('nom', e.target.value)}
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
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-leather-light">Spécialisation</label>
                        <input
                            type="text"
                            value={identity.specialisation}
                            onChange={(e) => handleIdentityChange('specialisation', e.target.value)}
                            className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs font-bold uppercase text-leather-light">Sous-Spécialisation</label>
                        <input
                            type="text"
                            value={identity.sous_specialisation}
                            onChange={(e) => handleIdentityChange('sous_specialisation', e.target.value)}
                            className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark"
                        />
                    </div>
                </div>
            </div>

            {/* Vitals Section - Always Visible */}
            <div className="border-t border-leather/30 pt-4">
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
