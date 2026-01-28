import React from 'react';
import { Identity } from '../types';

interface CharacterHeaderProps {
    identity: Identity;
    onChange: (identity: Identity) => void;
}

export const CharacterHeader: React.FC<CharacterHeaderProps> = ({ identity, onChange }) => {
    const handleChange = (field: keyof Identity, value: string) => {
        onChange({ ...identity, [field]: value });
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 p-4 bg-parchment/30 rounded-lg border border-leather/50">
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
                        onChange={(e) => handleChange('nom', e.target.value)}
                        className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark"
                        placeholder="Nom du personnage"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase text-leather-light">Sexe</label>
                    <input
                        type="text"
                        value={identity.sexe}
                        onChange={(e) => handleChange('sexe', e.target.value)}
                        className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase text-leather-light">Origine</label>
                    <input
                        type="text"
                        value={identity.origine}
                        onChange={(e) => handleChange('origine', e.target.value)}
                        className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase text-leather-light">Métier</label>
                    <input
                        type="text"
                        value={identity.metier}
                        onChange={(e) => handleChange('metier', e.target.value)}
                        className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase text-leather-light">Spécialisation</label>
                    <input
                        type="text"
                        value={identity.specialisation}
                        onChange={(e) => handleChange('specialisation', e.target.value)}
                        className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs font-bold uppercase text-leather-light">Sous-Spécialisation</label>
                    <input
                        type="text"
                        value={identity.sous_specialisation}
                        onChange={(e) => handleChange('sous_specialisation', e.target.value)}
                        className="w-full bg-transparent border-b border-leather focus:border-leather-dark outline-none py-1 font-serif text-lg text-leather-dark"
                    />
                </div>
            </div>
        </div>
    );
};
