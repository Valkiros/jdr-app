import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
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
                <div className="w-full md:w-48 h-48 bg-leather/10 border-2 border-leather border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-leather/20 transition-colors">
                    {identity.avatar_url ? (
                        <img src={identity.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded" />
                    ) : (
                        <span className="text-leather/50 font-serif">Image</span>
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
                <VitalsPanel vitals={vitals} onChange={onVitalsChange} />
            </div>
        </div>
    );
};
